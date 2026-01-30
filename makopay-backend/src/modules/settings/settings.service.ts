import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma/prisma.service';
import { UpdateFeesDto } from './dto/update-fees.dto';

@Injectable()
export class SettingsService implements OnModuleInit {
    private readonly logger = new Logger(SettingsService.name);

    // Default Values
    private readonly DEFAULT_FEES = {
        FEE_DEPOSIT_PERCENT: '0',
        FEE_WITHDRAWAL_PERCENT: '1.5',
        FEE_ORDER_PERCENT: '0'
    };

    constructor(private prisma: PrismaService) { }

    async onModuleInit() {
        await this.seedDefaults();
    }

    private async seedDefaults() {
        for (const [key, value] of Object.entries(this.DEFAULT_FEES)) {
            const exists = await this.prisma.systemSetting.findUnique({ where: { key } });
            if (!exists) {
                await this.prisma.systemSetting.create({
                    data: { key, value, description: `System Fee: ${key}` }
                });
                this.logger.log(`Seeded default setting: ${key} = ${value}`);
            }
        }
    }

    async getSetting(key: string, defaultValue: string = '0'): Promise<string> {
        const setting = await this.prisma.systemSetting.findUnique({ where: { key } });
        return setting ? setting.value : defaultValue;
    }

    async getFees() {
        const depositFee = await this.getSetting('FEE_DEPOSIT_PERCENT', this.DEFAULT_FEES.FEE_DEPOSIT_PERCENT);
        const withdrawalFee = await this.getSetting('FEE_WITHDRAWAL_PERCENT', this.DEFAULT_FEES.FEE_WITHDRAWAL_PERCENT);
        const orderFee = await this.getSetting('FEE_ORDER_PERCENT', this.DEFAULT_FEES.FEE_ORDER_PERCENT);

        return {
            depositFeePercent: Number(depositFee),
            withdrawalFeePercent: Number(withdrawalFee),
            orderFeePercent: Number(orderFee)
        };
    }

    async updateFees(dto: UpdateFeesDto) {
        await this.prisma.$transaction([
            this.prisma.systemSetting.upsert({
                where: { key: 'FEE_DEPOSIT_PERCENT' },
                update: { value: dto.depositFeePercent.toString() },
                create: { key: 'FEE_DEPOSIT_PERCENT', value: dto.depositFeePercent.toString(), description: 'Deposit Fee %' }
            }),
            this.prisma.systemSetting.upsert({
                where: { key: 'FEE_WITHDRAWAL_PERCENT' },
                update: { value: dto.withdrawalFeePercent.toString() },
                create: { key: 'FEE_WITHDRAWAL_PERCENT', value: dto.withdrawalFeePercent.toString(), description: 'Withdrawal Fee %' }
            }),
            this.prisma.systemSetting.upsert({
                where: { key: 'FEE_ORDER_PERCENT' },
                update: { value: dto.orderFeePercent.toString() },
                create: { key: 'FEE_ORDER_PERCENT', value: dto.orderFeePercent.toString(), description: 'Order Fee %' }
            })
        ]);

        return this.getFees();
    }
}
