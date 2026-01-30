import { Module } from '@nestjs/common';
import { MlmController } from './mlm.controller';
import { MlmService } from './mlm.service';
import { DatabaseModule } from '../../core/database/database.module';
import { WalletModule } from '../wallet/wallet.module';
import { BullModule } from '@nestjs/bullmq';
import { MlmProcessor } from './processors/mlm.processor';

@Module({
  imports: [
    DatabaseModule,
    WalletModule,
    BullModule.registerQueue({
      name: 'mlm',
    }),
  ],
  controllers: [MlmController],
  providers: [MlmService, MlmProcessor],
  exports: [MlmService],
})
export class MlmModule { }
