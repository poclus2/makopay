import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { DatabaseModule } from '../../core/database/database.module';
import { WalletModule } from '../wallet/wallet.module';
import { UsersModule } from '../users/users.module';

@Module({
    imports: [DatabaseModule, WalletModule, UsersModule],
    providers: [AdminService],
    controllers: [AdminController],
})
export class AdminModule { }
