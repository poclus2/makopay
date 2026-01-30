import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class AdminService {
    constructor(
        private prisma: PrismaService,
        private walletService: WalletService,
        private usersService: UsersService
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

            const newBalance = wallet.balance.add(amountInEUR);

            await tx.wallet.update({
                where: { id: wallet.id },
                data: { balance: newBalance }
            });

            await tx.walletLedger.create({
                data: {
                    walletId: wallet.id,
                    type: 'DEPOSIT',
                    source: 'ADMIN',
                    amount: amountInEUR,
                    reference: deposit.referenceCode,
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
}
