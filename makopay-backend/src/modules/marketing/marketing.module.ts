import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { HttpModule } from '@nestjs/axios';
import { MarketingController } from './marketing.controller';
import { MarketingService } from './marketing.service';
import { DatabaseModule } from '../../core/database/database.module';
import { NotificationsModule } from '../notifications/notifications.module';

// Processors
import { CampaignProcessor } from './queues/campaign.processor';
import { SmsProcessor } from './queues/sms.processor';
import { EmailProcessor } from './queues/email.processor';

// Providers
import { NexahService } from './providers/nexah.service';
import { ResendService } from './providers/resend.service';

@Module({
    imports: [
        DatabaseModule,
        NotificationsModule,
        HttpModule,
        BullModule.registerQueue(
            { name: 'campaign' },
            { name: 'sms' },
            { name: 'email' },
        ),
    ],
    controllers: [MarketingController],
    providers: [
        MarketingService,
        CampaignProcessor,
        SmsProcessor,
        EmailProcessor,
        NexahService,
        ResendService,
    ],
    exports: [MarketingService],
})
export class MarketingModule { }
