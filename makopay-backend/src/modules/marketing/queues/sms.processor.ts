import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma/prisma.service';
import { NexahService } from '../providers/nexah.service';
import { replaceVariables } from '../utils/message-variables.util';

@Processor('sms')
export class SmsProcessor extends WorkerHost {
    private readonly logger = new Logger(SmsProcessor.name);

    constructor(
        private prisma: PrismaService,
        private nexahService: NexahService,
    ) {
        super();
    }

    async process(job: Job): Promise<any> {
        switch (job.name) {
            case 'send-message':
                return this.handleSmsSend(job);
            default:
                throw new Error(`Unknown job ${job.name}`);
        }
    }

    private async handleSmsSend(job: Job) {
        const { recipientId, message, user, campaignId } = job.data;

        try {
            this.logger.log(`[SMS] Sending to ${user.phoneNumber}`);

            // 1. Replace variables
            const finalMessage = replaceVariables(message, user);

            // 2. Send via Nexah
            const result = await this.nexahService.sendSms(user.phoneNumber, finalMessage);

            // 3. Update recipient status
            if (result.success) {
                await this.prisma.campaignRecipient.update({
                    where: { id: recipientId },
                    data: {
                        status: 'SENT',
                        sentAt: new Date(),
                    },
                });

                // Update campaign counters
                await this.prisma.campaign.update({
                    where: { id: campaignId },
                    data: {
                        sentCount: { increment: 1 },
                        // Cost: 11 XAF per SMS
                        actualCost: { increment: 11 },
                    },
                });

                this.logger.log(`[SMS] ✅ Sent to ${user.phoneNumber}`);
            } else {
                await this.prisma.campaignRecipient.update({
                    where: { id: recipientId },
                    data: {
                        status: 'FAILED',
                        error: result.error,
                    },
                });

                await this.prisma.campaign.update({
                    where: { id: campaignId },
                    data: { failedCount: { increment: 1 } },
                });

                this.logger.error(`[SMS] ❌ Failed for ${user.phoneNumber}: ${result.error}`);
            }
        } catch (error) {
            this.logger.error(`[SMS] Exception for ${user.phoneNumber}:`, error);

            // Mark as failed
            await this.prisma.campaignRecipient.update({
                where: { id: recipientId },
                data: {
                    status: 'FAILED',
                    error: error.message,
                },
            });

            throw error; // BullMQ will retry
        }
    }
}
