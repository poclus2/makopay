import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ResendService } from '../providers/resend.service';
import { replaceVariables } from '../utils/message-variables.util';

@Processor('email')
export class EmailProcessor {
    private readonly logger = new Logger(EmailProcessor.name);

    constructor(
        private prisma: PrismaService,
        private resendService: ResendService,
    ) { }

    @Process('send-message')
    async handleEmailSend(job: Job) {
        const { recipientId, subject, message, user, campaignId } = job.data;

        try {
            this.logger.log(`[Email] Sending to ${user.email}`);

            // 1. Replace variables
            const finalSubject = replaceVariables(subject || 'Message de Makopay', user);
            const finalMessage = replaceVariables(message, user);

            // 2. Send via Resend
            const result = await this.resendService.sendEmail(
                user.email,
                finalSubject,
                finalMessage,
            );

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
                        // Email cost: ~5 XAF (or 0 if within free tier)
                        actualCost: { increment: 5 },
                    },
                });

                this.logger.log(`[Email] ✅ Sent to ${user.email}`);
            } else {
                await this.prisma.campaignRecipient.update({
                    where: { id: recipientId },
                    data: {
                        status: 'FAILED',
                        errorMessage: result.error,
                    },
                });

                await this.prisma.campaign.update({
                    where: { id: campaignId },
                    data: { failedCount: { increment: 1 } },
                });

                this.logger.error(`[Email] ❌ Failed for ${user.email}: ${result.error}`);
            }
        } catch (error) {
            this.logger.error(`[Email] Exception for ${user.email}:`, error);

            // Mark as failed
            await this.prisma.campaignRecipient.update({
                where: { id: recipientId },
                data: {
                    status: 'FAILED',
                    errorMessage: error.message,
                },
            });

            throw error; // BullMQ will retry
        }
    }
}
