import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { DatabaseModule } from '../../core/database/database.module';
import { ProductsModule } from '../products/products.module';
import { InvestmentsModule } from '../investments/investments.module';
import { MlmModule } from '../mlm/mlm.module';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [DatabaseModule, ProductsModule, InvestmentsModule, MlmModule, WalletModule],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule { }
