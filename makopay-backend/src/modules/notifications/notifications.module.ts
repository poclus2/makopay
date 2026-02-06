import { Module, Global } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { EmailProvider } from './providers/email.provider';
import { InfobipProvider } from './providers/infobip.provider';
import { NexahSmsProvider } from './providers/nexah-sms.provider';
import { InfobipSmsProvider } from './providers/infobip-sms.provider';
import { NotificationsController } from './notifications.controller';
import { NotificationSettingsController } from './notification-settings.controller';
import { NotificationSettingsService } from './notification-settings.service';
import { DatabaseModule } from '../../core/database/database.module';

@Global()
@Module({
    imports: [DatabaseModule],
    controllers: [NotificationsController, NotificationSettingsController],
    providers: [
        NotificationsService,
        NotificationSettingsService,
        EmailProvider,
        InfobipProvider,
        NexahSmsProvider,
        InfobipSmsProvider,
    ],
    exports: [NotificationsService],
})
export class NotificationsModule { }
