import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma/prisma.service';
import { InjectQueue } from '@nestjs/bullmq';

@Processor('campaign')
export class CampaignProcessor extends WorkerHost {
    private readonly logger = new Logger(CampaignProcessor.name);

    constructor(
        private prisma: PrismaService,
        @InjectQueue('sms') private smsQueue: Queue,
        @InjectQueue('email') private emailQueue: Queue,
    ) {
        super();
    }

    async process(job: Job<any, any, string>): Promise<any> {
        switch (job.name) {
            case 'send-campaign':
                return this.handleCampaignSend(job);
            case 'check-completion':
                return this.handleCampaignCompletion(job);
            default:
                throw new Error(`Unknown job ${job.name}`);
        }
    }

    private async handleCampaignSend(job: Job<{ campaignId: string }>) {
        const { campaignId } = job.data;
        this.logger.log(`[Campaign ${campaignId}] Starting processing`);

        try {
            // 1. Get campaign
            const campaign = await this.prisma.campaign.findUnique({
                where: { id: campaignId },
            });

            if (!campaign) {
                throw new Error(`Campaign ${campaignId} not found`);
            }

            // 2. Update status to SENDING
            await this.prisma.campaign.update({
                where: { id: campaignId },
                data: { status: 'SENDING', sentAt: new Date() },
            });

            // 3. Get recipients
            const recipients = await this.prisma.campaignRecipient.findMany({
                where: {
                    campaignId,
                    status: 'PENDING',
                },
                include: {
                    user: {
                        include: { wallet: true },
                    },
                },
            });

            this.logger.log(`[Campaign ${campaignId}] Found ${recipients.length} recipients`);

            if (recipients.length === 0) {
                await this.prisma.campaign.update({
                    where: { id: campaignId },
                    data: { status: 'COMPLETED' },
                });
                return { processed: 0 };
            }

            // 4. Queue each recipient
            const queue = campaign.type === 'SMS' ? this.smsQueue : this.emailQueue;

            for (const recipient of recipients) {
                // For CUSTOM_LIST, recipient.user is null, so we build a pseudo-user from recipient fields
                const variables = recipient.variables as any;
                const userOrRecipient = recipient.user || {
                    phoneNumber: recipient.phoneNumber,
                    email: recipient.email,
                    firstName: variables?.firstName,
                    lastName: variables?.lastName,
                };

                await queue.add('send-message', {
                    recipientId: recipient.id,
                    campaignId: campaign.id,
                    type: campaign.type,
                    subject: campaign.subject,
                    message: campaign.message,
                    user: userOrRecipient,
                });
            }

            this.logger.log(`[Campaign ${campaignId}] Queued ${recipients.length} messages`);

            return { processed: recipients.length };
        } catch (error) {
            this.logger.error(`[Campaign ${campaignId}] Error:`, error);

            // Update campaign to FAILED
            await this.prisma.campaign.update({
                where: { id: campaignId },
                data: { status: 'FAILED' },
            });

            throw error;
        }
    }

    /**
     * Check if all recipients have been processed, then mark campaign as COMPLETED
     */
    private async handleCampaignCompletion(job: Job<{ campaignId: string }>) {
        const { campaignId } = job.data;

        const recipients = await this.prisma.campaignRecipient.findMany({
            where: { campaignId },
        });

        const pending = recipients.filter(r => r.status === 'PENDING').length;

        if (pending === 0) {
            await this.prisma.campaign.update({
                where: { id: campaignId },
                data: { status: 'COMPLETED' },
            });

            this.logger.log(`[Campaign ${campaignId}] Completed`);
        }
    }
}
