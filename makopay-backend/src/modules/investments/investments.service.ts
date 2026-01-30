import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma/prisma.service';
import { Prisma, InvestmentStatus, WalletTransactionType, LedgerSource, PayoutFrequency } from '@prisma/client';
import { Cron, CronExpression } from '@nestjs/schedule';
import { WalletService } from '../wallet/wallet.service';
import { CreateInvestmentPlanDto } from './dto/create-investment-plan.dto';
import { UpdateInvestmentPlanDto } from './dto/update-investment-plan.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class InvestmentsService {
    private readonly logger = new Logger(InvestmentsService.name);

    constructor(
        private prisma: PrismaService,
        private walletService: WalletService,
        private notificationsService: NotificationsService
    ) { }

    async createPlan(data: CreateInvestmentPlanDto) {
        return this.prisma.investmentPlan.create({
            data: {
                ...data,
                yieldPercent: new Prisma.Decimal(data.yieldPercent),
                minAmount: new Prisma.Decimal(data.minAmount),
                maxAmount: data.maxAmount ? new Prisma.Decimal(data.maxAmount) : null,
            }
        });
    }

    async updatePlan(id: string, data: UpdateInvestmentPlanDto) {
        const updateData: any = { ...data };

        if (typeof data.yieldPercent === 'number') {
            updateData.yieldPercent = new Prisma.Decimal(data.yieldPercent);
        }
        if (typeof data.minAmount === 'number') {
            updateData.minAmount = new Prisma.Decimal(data.minAmount);
        }
        if (typeof data.maxAmount === 'number') {
            updateData.maxAmount = new Prisma.Decimal(data.maxAmount);
        }

        return this.prisma.investmentPlan.update({
            where: { id },
            data: updateData,
        });
    }

    async deletePlan(id: string) {
        return this.prisma.investmentPlan.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }

    async findAllPlans() {
        return this.prisma.investmentPlan.findMany({
            where: { deletedAt: null },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findPlanById(id: string) {
        const plan = await this.prisma.investmentPlan.findUnique({
            where: { id },
        });
        if (!plan || plan.deletedAt) throw new NotFoundException('Plan not found');
        return plan;
    }

    async findAllInvestments(userId: string) {
        return this.prisma.investment.findMany({
            where: { userId, deletedAt: null },
            include: { plan: true, payouts: true },
        });
    }

    async createInvestmentFromOrder(orderId: string, userId: string, items: any[], tx?: Prisma.TransactionClient) {
        const client = tx || this.prisma;
        this.logger.log(`Checking for investment products in order ${orderId}`);

        for (const item of items) {
            if (item.product && item.product.investmentPlanId) {
                // Fetch Plan to get Duration
                const plan = await client.investmentPlan.findUnique({
                    where: { id: item.product.investmentPlanId }
                });

                if (!plan) {
                    this.logger.warn(`Plan ${item.product.investmentPlanId} not found for product ${item.product.id}`);
                    continue;
                }

                const principal = new Prisma.Decimal(item.unitPrice).mul(item.quantity);
                const startDate = new Date();
                const endDate = new Date(startDate);
                endDate.setDate(endDate.getDate() + plan.durationDays);

                await client.investment.create({
                    data: {
                        userId,
                        orderId,
                        planId: item.product.investmentPlanId,
                        principalAmount: principal,
                        status: InvestmentStatus.ACTIVE,
                        startDate: startDate,
                        endDate: endDate,
                    }
                });

                // Notification
                await this.notificationsService.sendInvestmentStartedNotification(
                    userId,
                    plan.name,
                    principal.toString(),
                    'XAF',
                    endDate
                );

                this.logger.log(`Created investment for user ${userId} with plan ${item.product.investmentPlanId}`);
            }
        }
    }

    @Cron(CronExpression.EVERY_HOUR)
    async handleHourlyPayouts() {
        this.logger.log('Running hourly payout calculation...');

        const activeInvestments = await this.prisma.investment.findMany({
            where: {
                status: InvestmentStatus.ACTIVE,
                deletedAt: null,
                plan: { payoutFrequency: PayoutFrequency.HOURLY }
            },
            include: { plan: true }
        });

        for (const inv of activeInvestments) {
            // Rate: (MonthlyYield / 30) / 24 / 100
            const hourlyRate = inv.plan.yieldPercent.div(30).div(24).div(100);
            await this.processPayout(inv, hourlyRate);
        }
    }

    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async handleDailyPayouts() {
        this.logger.log('Running daily payout calculation...');

        // Exclude HOURLY plans
        const activeInvestments = await this.prisma.investment.findMany({
            where: {
                status: InvestmentStatus.ACTIVE,
                deletedAt: null,
                plan: { payoutFrequency: { not: PayoutFrequency.HOURLY } }
            },
            include: { plan: true }
        });

        for (const inv of activeInvestments) {
            // Rate: (MonthlyYield / 30) / 100
            const dailyRate = inv.plan.yieldPercent.div(30).div(100);
            await this.processPayout(inv, dailyRate);
        }
    }

    private async processPayout(inv: any, rate: Prisma.Decimal) {
        const payoutAmount = inv.principalAmount.mul(rate);

        // Ensure strictly positive
        if (payoutAmount.lessThanOrEqualTo(0)) return;

        await this.prisma.investmentPayout.create({
            data: {
                investmentId: inv.id,
                amount: payoutAmount,
                payoutDate: new Date(),
            }
        });

        await this.walletService.credit(
            inv.userId,
            payoutAmount,
            WalletTransactionType.INVESTMENT_PAYOUT,
            LedgerSource.INVESTMENT,
            inv.id
        );

        await this.prisma.investment.update({
            where: { id: inv.id },
            data: { lastPayoutAt: new Date() }
        });

        this.logger.log(`Paid ${payoutAmount} to investment ${inv.id}`);
    }
}
