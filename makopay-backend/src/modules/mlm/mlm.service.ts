import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma/prisma.service';
import { Prisma, WalletTransactionType, LedgerSource } from '@prisma/client';
import { WalletService } from '../wallet/wallet.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class MlmService {
    private readonly logger = new Logger(MlmService.name);

    private readonly COMMISSION_RATES: Record<number, number> = {
        1: 10,
        2: 5,
        3: 2,
    };

    constructor(
        private prisma: PrismaService,
        private walletService: WalletService,
        @InjectQueue('mlm') private mlmQueue: Queue
    ) { }

    async getNetwork(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                referrals: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        kycStatus: true,
                        createdAt: true,
                        referrals: {
                            select: {
                                id: true,
                                email: true,
                                firstName: true,
                                lastName: true,
                                kycStatus: true,
                                createdAt: true,
                                referrals: {
                                    select: {
                                        id: true,
                                        email: true,
                                        firstName: true,
                                        lastName: true,
                                        kycStatus: true,
                                        createdAt: true,
                                    }
                                }
                            }
                        }
                    }
                },
                sponsor: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true
                    }
                },
                wallet: {
                    select: {
                        id: true
                    }
                }
            }
        });

        // Fetch MLM commissions from wallet ledger
        let commissionsReceived = [];
        if (user?.wallet) {
            const ledgerEntries = await this.prisma.walletLedger.findMany({
                where: {
                    walletId: user.wallet.id,
                    type: WalletTransactionType.MLM_COMMISSION,
                    status: 'COMPLETED'
                },
                select: {
                    amount: true,
                    createdAt: true,
                },
                orderBy: {
                    createdAt: 'desc'
                }
            });
            commissionsReceived = ledgerEntries;
        }

        return {
            ...user,
            commissionsReceived
        };
    }

    // Renamed logic method
    async handleCommissionDistributionJob(orderId: string, userId: string, amountInput: string | number | Prisma.Decimal) {
        // Reconstruct Decimal
        const amount = new Prisma.Decimal(amountInput);

        this.logger.log(`Processing commission job for order ${orderId}, amount: ${amount}`);

        let currentUserId = userId;
        let level = 1;

        while (currentUserId && level <= 3) {
            const user = await this.prisma.user.findUnique({ where: { id: currentUserId } });

            if (!user || !user.sponsorId) break;

            const sponsor = await this.prisma.user.findUnique({ where: { id: user.sponsorId } });
            if (!sponsor) break;

            const rate = this.COMMISSION_RATES[level];
            if (rate) {
                const commissionAmount = amount.mul(rate).div(100);

                await this.prisma.mlmCommission.create({
                    data: {
                        earnerId: sponsor.id,
                        buyerId: userId,
                        orderId: orderId,
                        amount: commissionAmount,
                        level: level,
                    }
                });

                await this.walletService.credit(
                    sponsor.id,
                    commissionAmount,
                    WalletTransactionType.MLM_COMMISSION,
                    LedgerSource.MLM,
                    orderId
                );

                this.logger.log(`Commission Level ${level}: Paid ${commissionAmount} to ${sponsor.email}`);
            }

            currentUserId = sponsor.id;
            level++;
        }
    }

    // Public method adds to queue
    async distributeCommissions(orderId: string, userId: string, amount: Prisma.Decimal) {
        await this.mlmQueue.add('distribute_commission', {
            orderId,
            userId,
            amount: amount.toString() // Serialize Decimal
        });
        this.logger.log(`Added distribute_commission job for order ${orderId}`);
    }
}
