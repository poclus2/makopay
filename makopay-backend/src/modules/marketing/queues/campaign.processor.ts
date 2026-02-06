import { Processor, Process } from '@nestjs/bull';
import type { Job, Queue } from 'bull';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma/prisma.service';
import { InjectQueue } from '@nestjs/bull';

@Processor('campaign')
export class CampaignProcessor {
    private readonly logger = new Logger(CampaignProcessor.name);

    constructor(
        private prisma: PrismaService,
        @InjectQueue('sms') private smsQueue: Queue,
        @InjectQueue('email') private emailQueue: Queue,
    ) { }

    @Process('send-campaign')
    async handleCampaignSend(job: Job<{ campaignId: string }>) {
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
                await queue.add('send-message', {
                    recipientId: recipient.id,
                    campaignId: campaign.id,
                    type: campaign.type,
                    subject: campaign.subject,
                    message: campaign.message,
                    user: recipient.user,
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
    @Process('check-completion')
    async handleCampaignCompletion(job: Job<{ campaignId: string }>) {
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
