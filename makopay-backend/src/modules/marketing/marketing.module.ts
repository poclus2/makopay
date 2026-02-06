import { Module } from '@nestjs/common';
import { MarketingController } from './marketing.controller';
import { MarketingService } from './marketing.service';
import { DatabaseModule } from '../../core/database/database.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
    imports: [DatabaseModule, NotificationsModule],
    controllers: [MarketingController],
    providers: [MarketingService],
    exports: [MarketingService],
})
export class MarketingModule { }
