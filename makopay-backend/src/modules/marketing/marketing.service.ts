import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { Campaign, CampaignType, TargetType, User, Prisma, Template, CampaignRecipient } from '@prisma/client';
import { CreateCampaignDto, FilterUsersDto } from './dto/create-campaign.dto';
import { CreateTemplateDto, UpdateTemplateDto } from './dto/template.dto';
import { renderUserTemplate, extractVariables } from './utils/template-renderer.util';
import { parseCsv, validateCsvFormat, extractUniqueRecipients } from './utils/csv-parser.util';

export interface CampaignStats {
    totalRecipients: number;
    sentCount: number;
    deliveredCount: number;
    failedCount: number;
    openedCount: number;
    clickedCount: number;
    deliveryRate: number;
    openRate: number;
    clickRate: number;
}

@Injectable()
export class MarketingService {
    private readonly logger = new Logger(MarketingService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly notificationsService: NotificationsService,
    ) { }

    // ===========================
    // Campaign Methods
    // ===========================

    async createCampaign(dto: CreateCampaignDto, userId: string): Promise<Campaign> {
        this.logger.log(`Creating campaign: ${dto.name} by user ${userId}`);

        // If using a template, load it
        let template: Template | null = null;
        if (dto.templateId) {
            template = await this.prisma.template.findUnique({
                where: { id: dto.templateId },
            });

            if (!template) {
                throw new NotFoundException('Template not found');
            }
        }

        // Estimate recipients count
        let totalRecipients = 0;
        if (dto.targetType === TargetType.ALL_USERS) {
            totalRecipients = await this.prisma.user.count({
                where: { marketingConsent: true },
            });
        } else if (dto.targetType === TargetType.FILTERED && dto.filters) {
            totalRecipients = await this.countTargetedUsers(dto.filters);
        }

        // Estimate cost
        const estimatedCost = await this.estimateCost(dto.type, totalRecipients, dto.message.length);

        // Create campaign
        const campaign = await this.prisma.campaign.create({
            data: {
                name: dto.name,
                type: dto.type,
                subject: dto.subject,
                message: dto.message,
                templateId: dto.templateId,
                targetType: dto.targetType,
                filters: dto.filters as any,
                customListUrl: dto.customListUrl,
                sendNow: dto.sendNow,
                scheduledAt: dto.scheduledAt,
                totalRecipients,
                estimatedCost,
                createdBy: userId,
            },
            include: {
                template: true,
                creator: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
            },
        });

        return campaign;
    }

    async getCampaigns(
        filters?: { type?: CampaignType; status?: string },
        pagination?: { skip?: number; take?: number },
    ): Promise<Campaign[]> {
        const where: Prisma.CampaignWhereInput = {};

        if (filters?.type) {
            where.type = filters.type;
        }

        if (filters?.status) {
            where.status = filters.status as any;
        }

        return this.prisma.campaign.findMany({
            where,
            skip: pagination?.skip || 0,
            take: pagination?.take || 20,
            orderBy: { createdAt: 'desc' },
            include: {
                creator: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
                template: true,
                _count: {
                    select: {
                        recipients: true,
                    },
                },
            },
        });
    }

    async getCampaign(id: string): Promise<Campaign> {
        const campaign = await this.prisma.campaign.findUnique({
            where: { id },
            include: {
                creator: true,
                template: true,
                recipients: {
                    take: 10, // First 10 recipients as preview
                    orderBy: { createdAt: 'desc' },
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                phoneNumber: true,
                                email: true,
                            },
                        },
                    },
                },
            },
        });

        if (!campaign) {
            throw new NotFoundException('Campaign not found');
        }

        return campaign;
    }

    async deleteCampaign(id: string): Promise<void> {
        const campaign = await this.prisma.campaign.findUnique({ where: { id } });

        if (!campaign) {
            throw new NotFoundException('Campaign not found');
        }

        // Cannot delete campaigns that are sending or completed
        if (['SENDING', 'COMPLETED'].includes(campaign.status)) {
            throw new BadRequestException('Cannot delete campaign in SENDING or COMPLETED status');
        }

        await this.prisma.campaign.delete({ where: { id } });
        this.logger.log(`Campaign ${id} deleted`);
    }

    async sendCampaign(id: string): Promise<void> {
        const campaign = await this.prisma.campaign.findUnique({
            where: { id },
            include: { template: true },
        });

        if (!campaign) {
            throw new NotFoundException('Campaign not found');
        }

        if (campaign.status !== 'DRAFT' && campaign.status !== 'SCHEDULED') {
            throw new BadRequestException('Campaign already sent or in progress');
        }

        // Create recipients if not already created
        const recipientsCount = await this.prisma.campaignRecipient.count({
            where: { campaignId: id },
        });

        if (recipientsCount === 0) {
            await this.createRecipients(campaign);
        }

        // Update campaign status
        await this.prisma.campaign.update({
            where: { id },
            data: {
                status: 'SENDING',
                sentAt: new Date(),
            },
        });

        // TODO: Send to BullMQ queue in Phase 2
        this.logger.log(`Campaign ${id} queued for sending (${recipientsCount} recipients)`);
    }

    async sendTestCampaign(id: string, recipient: string): Promise<void> {
        const campaign = await this.prisma.campaign.findUnique({
            where: { id },
        });

        if (!campaign) {
            throw new NotFoundException('Campaign not found');
        }

        // Send test based on campaign type
        if (campaign.type === CampaignType.SMS) {
            await this.notificationsService.sendSms(recipient, campaign.message, true);
            this.logger.log(`Test SMS sent to ${recipient}`);
        } else {
            await this.notificationsService.sendEmail(recipient, campaign.subject || 'Test', campaign.message, true);
            this.logger.log(`Test Email sent to ${recipient}`);
        }
    }

    async getCampaignStats(id: string): Promise<CampaignStats> {
        const campaign = await this.prisma.campaign.findUnique({
            where: { id },
        });

        if (!campaign) {
            throw new NotFoundException('Campaign not found');
        }

        const deliveryRate = campaign.sentCount > 0 ? (campaign.deliveredCount / campaign.sentCount) * 100 : 0;
        const openRate = campaign.deliveredCount > 0 ? (campaign.openedCount / campaign.deliveredCount) * 100 : 0;
        const clickRate = campaign.openedCount > 0 ? (campaign.clickedCount / campaign.openedCount) * 100 : 0;

        return {
            totalRecipients: campaign.totalRecipients,
            sentCount: campaign.sentCount,
            deliveredCount: campaign.deliveredCount,
            failedCount: campaign.failedCount,
            openedCount: campaign.openedCount,
            clickedCount: campaign.clickedCount,
            deliveryRate: Number(deliveryRate.toFixed(2)),
            openRate: Number(openRate.toFixed(2)),
            clickRate: Number(clickRate.toFixed(2)),
        };
    }

    // ===========================
    // User Filtering
    // ===========================

    async previewTargetedUsers(filters: FilterUsersDto): Promise<Partial<User>[]> {
        const where = this.buildUserFilter(filters);

        return this.prisma.user.findMany({
            where,
            take: 10, // Preview only first 10
            select: {
                id: true,
                firstName: true,
                lastName: true,
                phoneNumber: true,
                email: true,
                kycStatus: true,
                wallet: {
                    select: {
                        balance: true,
                    },
                },
            },
        });
    }

    async countTargetedUsers(filters: FilterUsersDto): Promise<number> {
        const where = this.buildUserFilter(filters);
        return this.prisma.user.count({ where });
    }

    private buildUserFilter(filters: FilterUsersDto): Prisma.UserWhereInput {
        const where: Prisma.UserWhereInput = {
            marketingConsent: true, // Only users who consented
        };

        if (filters.kycStatus) {
            where.kycStatus = filters.kycStatus as any;
        }

        if (filters.registeredAfter || filters.registeredBefore) {
            where.createdAt = {};
            if (filters.registeredAfter) {
                where.createdAt.gte = filters.registeredAfter;
            }
            if (filters.registeredBefore) {
                where.createdAt.lte = filters.registeredBefore;
            }
        }

        if (filters.balanceMin !== undefined || filters.balanceMax !== undefined) {
            where.wallet = {
                balance: {},
            };
            if (filters.balanceMin !== undefined) {
                where.wallet.balance.gte = filters.balanceMin;
            }
            if (filters.balanceMax !== undefined) {
                where.wallet.balance.lte = filters.balanceMax;
            }
        }

        if (filters.hasInvestments) {
            where.investments = {
                some: {},
            };
        }

        if (filters.hasReferrals) {
            where.referrals = {
                some: {},
            };
        }

        if (filters.phonePrefix) {
            where.phoneNumber = {
                startsWith: filters.phonePrefix,
            };
        }

        return where;
    }

    // ===========================
    // Templates
    // ===========================

    async createTemplate(dto: CreateTemplateDto, userId: string): Promise<Template> {
        const variables = dto.variables || extractVariables(dto.content);

        return this.prisma.template.create({
            data: {
                name: dto.name,
                description: dto.description,
                type: dto.type,
                subject: dto.subject,
                content: dto.content,
                contentHtml: dto.contentHtml,
                variables,
                createdBy: userId,
            },
        });
    }

    async getTemplates(type?: CampaignType): Promise<Template[]> {
        return this.prisma.template.findMany({
            where: {
                isActive: true,
                ...(type && { type }),
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async updateTemplate(id: string, dto: UpdateTemplateDto): Promise<Template> {
        const template = await this.prisma.template.findUnique({ where: { id } });

        if (!template) {
            throw new NotFoundException('Template not found');
        }

        return this.prisma.template.update({
            where: { id },
            data: dto,
        });
    }

    async deleteTemplate(id: string): Promise<void> {
        await this.prisma.template.delete({ where: { id } });
    }

    // ===========================
    // Recipients Management
    // ===========================

    async createRecipients(campaign: Campaign): Promise<number> {
        let recipients: Array<Partial<CampaignRecipient>> = [];

        if (campaign.targetType === TargetType.ALL_USERS) {
            const users = await this.prisma.user.findMany({
                where: { marketingConsent: true },
                include: { wallet: true },
            });

            recipients = users.map(user => ({
                campaignId: campaign.id,
                userId: user.id,
                phoneNumber: campaign.type === CampaignType.SMS ? user.phoneNumber : undefined,
                email: campaign.type === CampaignType.EMAIL ? user.email : undefined,
            }));
        } else if (campaign.targetType === TargetType.FILTERED && campaign.filters) {
            const where = this.buildUserFilter(campaign.filters as any);
            const users = await this.prisma.user.findMany({
                where,
                include: { wallet: true },
            });

            recipients = users.map(user => ({
                campaignId: campaign.id,
                userId: user.id,
                phoneNumber: campaign.type === CampaignType.SMS ? user.phoneNumber : undefined,
                email: campaign.type === CampaignType.EMAIL ? user.email : undefined,
            }));
        }

        // Create all recipients in batch
        if (recipients.length > 0) {
            await this.prisma.campaignRecipient.createMany({
                data: recipients as any,
            });
        }

        // Update campaign total
        await this.prisma.campaign.update({
            where: { id: campaign.id },
            data: { totalRecipients: recipients.length },
        });

        this.logger.log(`Created ${recipients.length} recipients for campaign ${campaign.id}`);
        return recipients.length;
    }

    // ===========================
    // Helpers
    // ===========================

    async estimateCost(type: CampaignType, recipientCount: number, messageLength: number): Promise<number> {
        if (type === CampaignType.SMS) {
            // SMS cost: ~25 FCFA per SMS, 160 chars = 1 SMS
            const smsCount = Math.ceil(messageLength / 160);
            return recipientCount * smsCount * 25;
        } else {
            // Email cost: ~5 FCFA per email
            return recipientCount * 5;
        }
    }
}
