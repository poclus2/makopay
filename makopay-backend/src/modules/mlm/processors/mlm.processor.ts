import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { MlmService } from '../mlm.service';

@Processor('mlm')
export class MlmProcessor extends WorkerHost {
    private readonly logger = new Logger(MlmProcessor.name);

    constructor(private readonly mlmService: MlmService) {
        super();
    }

    async process(job: Job<any, any, string>): Promise<any> {
        switch (job.name) {
            case 'distribute_commission':
                this.logger.log(`Processing commission distribution for order ${job.data.orderId}`);
                await this.mlmService.handleCommissionDistributionJob(job.data.orderId, job.data.userId, job.data.amount);
                break;
            default:
                this.logger.warn(`Unknown job name: ${job.name}`);
        }
    }
}
