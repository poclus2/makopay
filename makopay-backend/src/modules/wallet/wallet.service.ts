import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma/prisma.service';
import { Prisma, WalletTransactionType, LedgerSource } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class WalletService {
    private readonly logger = new Logger(WalletService.name);

    constructor(
        private prisma: PrismaService,
        private notificationsService: NotificationsService
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
        try {
            if (type === WalletTransactionType.DEPOSIT) {
                await this.notificationsService.sendDepositSuccessNotification(userId, amount.toString(), 'XAF', 'Bank/Crypto');
            } else if (type === WalletTransactionType.INVESTMENT_PAYOUT) {
                await this.notificationsService.sendPayoutNotification(userId, amount.toString(), 'XAF', 'Investment Yield');
            } else if (type === WalletTransactionType.MLM_COMMISSION) {
                await this.notificationsService.sendPayoutNotification(userId, amount.toString(), 'XAF', 'Network Commission');
            } else {
                // Fallback for adjustments etc.
                const message = `Credit of ${amount} EUR received. Type: ${type}, Source: ${source}.`;
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
        try {
            if (type === WalletTransactionType.WITHDRAWAL) {
                await this.notificationsService.sendWithdrawalRequestNotification(userId, amount.toString(), 'XAF');
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

        await this.notificationsService.createInAppNotification(userId, 'Deposit Request', `Deposit request ${referenceCode} for ${amount} ${currency} initiated via ${method}.`, 'INFO');

        return req;
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
