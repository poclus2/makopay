import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../database/prisma/prisma.service';
import { MlmService } from '../../modules/mlm/mlm.service';

@Injectable()
export class OutboxService {
    private readonly logger = new Logger(OutboxService.name);
    private isProcessing = false;

    constructor(
        private prisma: PrismaService,
        private mlmService: MlmService,
    ) { }

    @Cron(CronExpression.EVERY_5_SECONDS)
    async processOutbox() {
        if (this.isProcessing) return;
        this.isProcessing = true;

        try {
            const events = await this.prisma.outboxEvent.findMany({
                where: { status: 'PENDING' },
                take: 50, // Batch size
                orderBy: { createdAt: 'asc' },
            });

            if (events.length === 0) {
                this.isProcessing = false;
                return;
            }

            this.logger.log(`Processing ${events.length} outbox events...`);

            for (const event of events) {
                await this.processEvent(event);
            }
        } catch (error) {
            this.logger.error('Error processing outbox', error);
        } finally {
            this.isProcessing = false;
        }
    }

    private async processEvent(event: any) {
        try {
            // Mark as PROCESSING
            await this.prisma.outboxEvent.update({
                where: { id: event.id },
                data: { status: 'PROCESSING' },
            });

            // Dispatch based on type
            switch (event.type) {
                case 'ORDER_PAID':
                    await this.handleOrderPaid(event.payload);
                    break;
                default:
                    this.logger.warn(`Unknown event type: ${event.type}`);
            }

            // Mark as COMPLETED
            await this.prisma.outboxEvent.update({
                where: { id: event.id },
                data: {
                    status: 'COMPLETED',
                    processedAt: new Date()
                },
            });

        } catch (error) {
            this.logger.error(`Failed to process event ${event.id}`, error);
            // Mark as FAILED
            await this.prisma.outboxEvent.update({
                where: { id: event.id },
                data: { status: 'FAILED' },
            });
        }
    }

    private async handleOrderPaid(payload: any) {
        const { orderId, userId, totalAmount } = payload;
        this.logger.log(`Handling ORDER_PAID for order ${orderId} (User: ${userId}, Amount: ${totalAmount})`);

        // Trigger MLM Commission Distribution
        await this.mlmService.distributeCommissions(orderId, userId, totalAmount);
    }
}
