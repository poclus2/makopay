import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { UsersService } from '../users/users.service';

import { SettingsService } from '../settings/settings.service';

@Injectable()
export class AdminService {
    constructor(
        private prisma: PrismaService,
        private walletService: WalletService,
        private usersService: UsersService,
        private settingsService: SettingsService
    ) { }

    async getStats() {
        const totalUsers = await this.prisma.user.count();
        const pendingDeposits = await this.prisma.depositRequest.count({
            where: { status: 'PENDING' }
        });

        const totalVolumeResult = await this.prisma.depositRequest.aggregate({
            _sum: { amount: true },
            where: { status: 'COMPLETED' }
        });

        return {
            totalUsers,
            pendingDeposits,
            totalVolume: totalVolumeResult._sum.amount || 0
        };
    }

    async getPendingDeposits() {
        return this.prisma.depositRequest.findMany({
            where: { status: 'PENDING' },
            include: { user: { select: { firstName: true, lastName: true, email: true, phoneNumber: true } } },
            orderBy: { createdAt: 'desc' }
        });
    }

    async getPendingWithdrawals() {
        return this.walletService.getPendingWithdrawals();
    }

    async approveWithdrawal(ledgerId: string) {
        return this.walletService.approveWithdrawal(ledgerId);
    }

    async rejectWithdrawal(ledgerId: string) {
        return this.walletService.rejectWithdrawal(ledgerId);
    }

    async getUsers() {
        return this.prisma.user.findMany({
            include: {
                wallet: {
                    select: { balance: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    async getPendingKycUsers() {
        return this.usersService.getPendingKycUsers();
    }

    async updateKycStatus(userId: string, action: 'approve' | 'reject') {
        const status = action === 'approve' ? 'VERIFIED' : 'REJECTED';
        return this.usersService.updateKycStatus(userId, status);
    }

    async approveDeposit(depositId: string) {
        const deposit = await this.prisma.depositRequest.findUniqueOrThrow({
            where: { id: depositId }
        });

        if (deposit.status !== 'PENDING') {
            throw new Error('Deposit is not pending');
        }

        // TODO: Currency conversion if needed (XAF -> EUR for wallet)
        const conversionRate = deposit.currency === 'XAF' ? 655.957 : 1;
        const amountInEUR = Number(deposit.amount) / conversionRate;

        // Fetch Fee Percentage
        const { depositFeePercent } = await this.settingsService.getFees();
        const feeAmount = amountInEUR * (depositFeePercent / 100);
        const netAmount = amountInEUR - feeAmount;

        await this.prisma.$transaction(async (tx) => {
            await tx.depositRequest.update({
                where: { id: depositId },
                data: { status: 'COMPLETED' }
            });

            // Get or create wallet
            let wallet = await tx.wallet.findUnique({ where: { userId: deposit.userId } });
            if (!wallet) {
                wallet = await tx.wallet.create({ data: { userId: deposit.userId } });
            }

            const newBalance = wallet.balance.add(netAmount);

            await tx.wallet.update({
                where: { id: wallet.id },
                data: { balance: newBalance }
            });

            await tx.walletLedger.create({
                data: {
                    walletId: wallet.id,
                    type: 'DEPOSIT',
                    source: 'ADMIN',
                    amount: netAmount,
                    // Store strict amount, fee implied by difference or tracked separately later
                    reference: `${deposit.referenceCode} (Fee: ${depositFeePercent}%)`,
                    balanceAfter: newBalance,
                    status: 'COMPLETED'
                }
            });
        });

        return { success: true };
    }

    async rejectDeposit(depositId: string) {
        const deposit = await this.prisma.depositRequest.findUniqueOrThrow({
            where: { id: depositId }
        });

        if (deposit.status !== 'PENDING') {
            throw new Error('Deposit is not pending');
        }

        await this.prisma.depositRequest.update({
            where: { id: depositId },
            data: { status: 'REJECTED' }
        });

        return { success: true };
    }

    async getDepositHistory() {
        return this.prisma.depositRequest.findMany({
            where: {
                status: {
                    in: ['COMPLETED', 'REJECTED']
                }
            },
            include: {
                user: {
                    select: {
                        firstName: true,
                        lastName: true,
                        email: true,
                        phoneNumber: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 100 // Limit history for now
        });
    }

    async manualDeposit(userIds: string[], amount: number, currency: string, message: string) {
        const results = {
            success: [] as string[],
            failed: [] as string[]
        };

        // Convert to EUR (Base Currency) once
        const conversionRate = currency === 'XAF' || currency === 'XOF' ? 655.957 : 1;
        const amountInEUR = amount / conversionRate;
        const amountDecimal = new (await import('@prisma/client')).Prisma.Decimal(amountInEUR);
        const originalAmountDecimal = new (await import('@prisma/client')).Prisma.Decimal(amount);
        const refPrefix = `ADM-${Date.now()}`;

        for (const userId of userIds) {
            try {
                // Find User
                const user = await this.usersService.findById(userId);
                if (!user) {
                    results.failed.push(`User ${userId} not found`);
                    continue;
                }

                // Credit Wallet
                await this.walletService.credit(
                    user.id,
                    amountDecimal,
                    'DEPOSIT', // Treated as Deposit
                    'ADMIN',   // Source Admin
                    message || 'Recharge Manuelle Admin'
                );

                // Create Completed DepositRequest record for tracking
                await this.prisma.depositRequest.create({
                    data: {
                        userId: user.id,
                        amount: originalAmountDecimal,
                        currency: currency,
                        method: 'MANUAL_ADMIN',
                        payerPhoneNumber: 'ADMIN',
                        referenceCode: `${refPrefix}-${user.phoneNumber?.slice(-4) || 'UNK'}`, // Unique ref per user
                        status: 'COMPLETED'
                    }
                });

                results.success.push(user.id);
            } catch (error) {
                console.error(`Failed manual deposit for ${userId}`, error);
                results.failed.push(userId);
            }
        }

        return results;
    }
}
