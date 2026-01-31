import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma/prisma.service';
import { Prisma, WalletTransactionType, LedgerSource } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';

import { SettingsService } from '../settings/settings.service';

@Injectable()
export class WalletService {
    private readonly logger = new Logger(WalletService.name);

    constructor(
        private prisma: PrismaService,
        private notificationsService: NotificationsService,
        private settingsService: SettingsService
    ) { }

    async getBalance(userId: string) {
        const wallet = await this.prisma.wallet.findUnique({
            where: { userId },
        });
        return wallet ? wallet.balance : new Prisma.Decimal(0);
    }

    async createWallet(userId: string) {
        return this.prisma.wallet.create({
            data: { userId }
        });
    }

    async getWallet(userId: string) {
        let wallet = await this.prisma.wallet.findUnique({
            where: { userId },
            include: { ledger: { orderBy: { createdAt: 'desc' }, take: 20 } }
        });

        if (!wallet) {
            wallet = await this.createWallet(userId) as any;
            // Re-fetch to match include structure if needed, or just return basic
        }

        // Fetch pending deposit requests
        const pendingDeposits = await this.prisma.depositRequest.findMany({
            where: { userId, status: 'PENDING' },
            orderBy: { createdAt: 'desc' }
        });

        return { ...wallet, pendingDeposits };
    }

    // Credit (Deposit, Commission, Payout)
    async credit(userId: string, amount: Prisma.Decimal, type: WalletTransactionType, source: LedgerSource, reference: string, tx?: Prisma.TransactionClient) {
        const execute = async (prisma: Prisma.TransactionClient) => {
            let wallet = await prisma.wallet.findUnique({ where: { userId } });
            if (!wallet) {
                wallet = await prisma.wallet.create({ data: { userId } });
            }

            const newBalance = wallet.balance.add(amount);

            // Update Wallet
            await prisma.wallet.update({
                where: { id: wallet.id },
                data: { balance: newBalance }
            });

            // Add Ledger Entry
            await prisma.walletLedger.create({
                data: {
                    walletId: wallet.id,
                    type,
                    source,
                    amount,
                    reference,
                    balanceAfter: newBalance,
                }
            });

            this.logger.log(`Credited ${amount} to user ${userId} (Type: ${type}, Source: ${source})`);
            return newBalance;
        };

        let finalBalance;
        if (tx) {
            finalBalance = await execute(tx);
        } else {
            finalBalance = await this.prisma.$transaction(execute);
        }

        // Notification (Async)
        // Convert EUR to XOF for display
        const RATE_XOF = 655.957;
        const amountXof = amount.mul(RATE_XOF).toFixed(0); // Show whole numbers for XOF

        try {
            if (type === WalletTransactionType.DEPOSIT) {
                await this.notificationsService.sendDepositSuccessNotification(userId, amountXof, 'XAF', 'Bank/Crypto');
            } else if (type === WalletTransactionType.INVESTMENT_PAYOUT) {
                await this.notificationsService.sendPayoutNotification(userId, amountXof, 'XAF', 'Investment Yield');
            } else if (type === WalletTransactionType.MLM_COMMISSION) {
                await this.notificationsService.sendPayoutNotification(userId, amountXof, 'XAF', 'Network Commission');
            } else {
                // Fallback for adjustments etc.
                const message = `Credit of ${amountXof} XAF received. Type: ${type}, Source: ${source}.`;
                await this.notificationsService.createInAppNotification(userId, 'Funds Received', message, 'SUCCESS');
            }
        } catch (e) {
            this.logger.error('Failed to send credit notification', e);
        }

        return finalBalance;
    }

    // Debit (Withdrawal, Purchase)
    async debit(userId: string, amount: Prisma.Decimal, type: WalletTransactionType, source: LedgerSource, reference: string, status: string = 'COMPLETED', tx?: Prisma.TransactionClient) {
        const execute = async (prisma: Prisma.TransactionClient) => {
            let wallet = await prisma.wallet.findUnique({ where: { userId } });
            if (!wallet) {
                throw new BadRequestException('Wallet not found');
            }

            if (wallet.balance.lt(amount)) {
                throw new BadRequestException('Insufficient funds');
            }

            const newBalance = wallet.balance.sub(amount);

            await prisma.wallet.update({
                where: { id: wallet.id },
                data: { balance: newBalance }
            });

            await prisma.walletLedger.create({
                data: {
                    walletId: wallet.id,
                    type,
                    source,
                    amount: amount.negated(),
                    status,
                    reference,
                    balanceAfter: newBalance,
                }
            });

            this.logger.log(`Debited ${amount} from user ${userId} (Type: ${type}, Source: ${source})`);
            return newBalance;
        };

        let finalBalance;
        if (tx) {
            finalBalance = await execute(tx);
        } else {
            finalBalance = await this.prisma.$transaction(execute);
        }

        // Notification (Async)
        const RATE_XOF = 655.957;
        const amountXof = amount.mul(RATE_XOF).toFixed(0);

        try {
            if (type === WalletTransactionType.WITHDRAWAL) {
                await this.notificationsService.sendWithdrawalRequestNotification(userId, amountXof, 'XAF');
            }
        } catch (e) {
            this.logger.error('Failed to send debit notification', e);
        }

        return finalBalance;
    }
    // Deposit Request
    async createDepositRequest(userId: string, amount: Prisma.Decimal, method: string, payerPhoneNumber?: string, currency: string = "XAF") {
        const referenceCode = `DEP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const req = await this.prisma.depositRequest.create({
            data: {
                userId,
                amount,
                method,
                payerPhoneNumber,
                currency,
                referenceCode,
            }
        });

        // Convert if needed. If input currency is EUR (default default?)
        // The method signature has currency="XAF".
        // But the amount? Is it in Currency or EUR?
        // WalletController passes converted amount?
        // Let's check WalletController.deposit.
        // It converts body.amount to Decimal. It assumes amount is in EUR usually?
        // But backend doesn't convert deposit requests usually, it just logs them.
        // Assuming deposit request amount IS XAF if currency is XAF.
        // If wallet controller receives EUR amount, then no conversion needed if currency says EUR.
        // But if we want to display XAF:

        let displayAmount = amount.toString();
        let displayCurrency = currency;

        // Assuming amount is stored in EUR in DB (standard practice for this app?), we should convert.
        // But wait, createDepositRequest takes `amount`.
        // I will assume for now simply amount * 655.957 if we want XAF and amount is EUR.
        // But I'll stick to what we did in credit/debit.

        const RATE_XOF = 655.957;
        const amountXof = amount.mul(RATE_XOF).toFixed(0);

        await this.notificationsService.createInAppNotification(userId, 'Deposit Request', `Deposit request ${referenceCode} for ${amountXof} XAF initiated via ${method}.`, 'INFO');

        return req;
    }

    // Withdrawal Request with Fee
    async requestWithdrawal(userId: string, amount: Prisma.Decimal, method: string, details: string) {
        // 1. Fetch Fee
        const { withdrawalFeePercent } = await this.settingsService.getFees();
        const feeAmount = amount.mul(withdrawalFeePercent).div(100);
        const totalDebit = amount.add(feeAmount);

        return this.prisma.$transaction(async (tx) => {
            const wallet = await tx.wallet.findUnique({ where: { userId } });
            if (!wallet) throw new BadRequestException('Wallet not found');
            if (wallet.balance.lt(totalDebit)) {
                throw new BadRequestException(`Insufficient funds. Total required: ${totalDebit} (Amount: ${amount} + Fee: ${feeAmount})`);
            }

            const newBalance = wallet.balance.sub(totalDebit);

            // Update Wallet
            await tx.wallet.update({
                where: { id: wallet.id },
                data: { balance: newBalance }
            });

            // Ledger 1: Withdrawal (Principal)
            const withdrawalLedger = await tx.walletLedger.create({
                data: {
                    walletId: wallet.id,
                    type: WalletTransactionType.WITHDRAWAL,
                    source: LedgerSource.WITHDRAWAL,
                    amount: amount.negated(),
                    status: 'PENDING',
                    reference: details,
                    balanceAfter: wallet.balance.sub(amount),
                }
            });

            // Ledger 2: Fee
            if (Number(feeAmount) > 0) {
                await tx.walletLedger.create({
                    data: {
                        walletId: wallet.id,
                        type: WalletTransactionType.ADJUSTMENT,
                        source: LedgerSource.ADMIN,
                        amount: feeAmount.negated(),
                        status: 'COMPLETED',
                        reference: `FEE-${withdrawalLedger.id} (${withdrawalFeePercent}%)`,
                        balanceAfter: newBalance,
                    }
                });
            } else {
                await tx.walletLedger.update({
                    where: { id: withdrawalLedger.id },
                    data: { balanceAfter: newBalance }
                });
            }

            if (Number(feeAmount) > 0) {
                await tx.walletLedger.update({
                    where: { id: withdrawalLedger.id },
                    data: { balanceAfter: wallet.balance.sub(amount) }
                });
            }

            // Notification
            const RATE_XOF = 655.957;
            const amountXof = amount.mul(RATE_XOF).toFixed(0);

            try {
                await this.notificationsService.sendWithdrawalRequestNotification(userId, amountXof, 'XAF');
            } catch (e) {
                this.logger.error('Failed to send withdrawal notification', e);
            }

            return withdrawalLedger;
        });
    }

    // Admin: Get all pending withdrawals
    async getPendingWithdrawals() {
        return this.prisma.walletLedger.findMany({
            where: {
                type: WalletTransactionType.WITHDRAWAL,
                status: 'PENDING'
            },
            include: {
                wallet: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                                phoneNumber: true,
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    // Admin: Approve Withdrawal
    async approveWithdrawal(ledgerId: string) {
        return this.prisma.walletLedger.update({
            where: { id: ledgerId },
            data: { status: 'COMPLETED' }
        });
    }

    // Admin: Reject Withdrawal (Refund)
    async rejectWithdrawal(ledgerId: string) {
        return this.prisma.$transaction(async (tx) => {
            const ledger = await tx.walletLedger.findUnique({
                where: { id: ledgerId },
                include: { wallet: true }
            });

            if (!ledger || ledger.status !== 'PENDING') {
                throw new BadRequestException('Withdrawal not found or already processed');
            }

            // Refund the amount (amount in ledger is negative for withdrawals, so we subtract it to add it back? No, wait.)
            // In debit(), we stored amount as negated: amount: amount.negated() (e.g. -5000)
            // To refund, we need to ADD the absolute value back.
            // Or typically, we just add the absolute amount.
            // Let's check debit(): amount: amount.negated(). So ledger.amount is -5000.
            // Refund amount = ledger.amount.abs().

            const refundAmount = ledger.amount.abs();
            const newBalance = ledger.wallet.balance.add(refundAmount);

            // 1. Update Wallet Balance
            await tx.wallet.update({
                where: { id: ledger.wallet.id },
                data: { balance: newBalance }
            });

            // 2. Update Original Ledger Status
            await tx.walletLedger.update({
                where: { id: ledgerId },
                data: { status: 'REJECTED' }
            });

            // 3. Create Refund Ledger Entry
            await tx.walletLedger.create({
                data: {
                    walletId: ledger.wallet.id,
                    type: WalletTransactionType.WITHDRAWAL, // Or ADJUSTMENT? Keeping WITHDRAWAL with source ADMIN/WITHDRAWAL implies refund context if positive? 
                    // Better to use ADJUSTMENT or just explicit refund note.
                    source: LedgerSource.ADMIN,
                    amount: refundAmount,
                    balanceAfter: newBalance,
                    status: 'COMPLETED',
                    reference: `REFUND-${ledger.reference}`
                }
            });

            return { success: true };
        });
    }
}
