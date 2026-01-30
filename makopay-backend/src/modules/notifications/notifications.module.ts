import { Module, Global } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { EmailProvider } from './providers/email.provider';
import { InfobipProvider } from './providers/infobip.provider';
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
    ],
    exports: [NotificationsService],
})
export class NotificationsModule { }
