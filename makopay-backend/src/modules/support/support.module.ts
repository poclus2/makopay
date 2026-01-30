import { Module } from '@nestjs/common';
import { SupportService } from './support.service';
import { SupportGateway } from './support.gateway';
import { SupportController } from './support.controller';
import { DatabaseModule } from '../../core/database/database.module';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
    imports: [DatabaseModule, UsersModule, AuthModule, NotificationsModule],
    providers: [SupportGateway, SupportService],
    controllers: [SupportController],
    exports: [SupportService],
})
export class SupportModule { }
