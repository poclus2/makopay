import { Module } from '@nestjs/common';
import { InvestmentsController } from './investments.controller';
import { InvestmentsService } from './investments.service';
import { DatabaseModule } from '../../core/database/database.module';
import { ScheduleModule } from '@nestjs/schedule';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [DatabaseModule, ScheduleModule.forRoot(), WalletModule],
  controllers: [InvestmentsController],
  providers: [InvestmentsService],
  exports: [InvestmentsService],
})
export class InvestmentsModule { }
