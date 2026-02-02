import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { DatabaseModule } from './core/database/database.module';
import { ProductsModule } from './modules/products/products.module';
import { OrdersModule } from './modules/orders/orders.module';
import { InvestmentsModule } from './modules/investments/investments.module';
import { MlmModule } from './modules/mlm/mlm.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { BullModule } from '@nestjs/bullmq';
import { OutboxModule } from './core/outbox/outbox.module';
import { AdminModule } from './modules/admin/admin.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { SupportModule } from './modules/support/support.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { PaymentEnvironmentGuard } from './core/guards/payment-environment.guard';
import { SettingsModule } from './modules/settings/settings.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        connection: {
          host: configService.get('REDIS_HOST'),
          port: configService.get('REDIS_PORT'),
        },
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    AuthModule,
    DatabaseModule,
    OutboxModule,
    ProductsModule,
    OrdersModule,
    InvestmentsModule,
    MlmModule,
    WalletModule,
    AdminModule,
    NotificationsModule,
    SupportModule,
    SettingsModule,
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: 'APP_GUARD',
      useClass: PaymentEnvironmentGuard,
    },
  ],
})
export class AppModule { }
