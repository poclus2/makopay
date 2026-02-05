import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma/prisma.service';
import { User, Prisma } from '@prisma/client';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    async findOne(phoneNumber: string): Promise<User | null> {
        return this.prisma.user.findUnique({
            where: { phoneNumber },
        });
    }

    async findByEmail(email: string): Promise<User | null> {
        return this.prisma.user.findFirst({ where: { email } });
    }

    async findByReferralCode(referralCode: string): Promise<User | null> {
        return this.prisma.user.findUnique({ where: { referralCode } });
    }

    async findById(id: string): Promise<User | null> {
        return this.prisma.user.findUnique({
            where: { id },
        });
    }

    async create(data: Prisma.UserCreateInput): Promise<User> {
        return this.prisma.user.create({
            data,
        });
    }

    async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
        return this.prisma.user.update({
            where: { id },
            data,
        });
    }

    async submitKyc(userId: string, kycData: any) {
        return this.prisma.user.update({
            where: { id: userId },
            data: {
                kycData,
                kycStatus: 'PENDING',
                kycSubmittedAt: new Date()
            }
        });
    }

    async getPendingKycUsers() {
        return this.prisma.user.findMany({
            where: { kycStatus: 'PENDING' },
            orderBy: { kycSubmittedAt: 'desc' },
            include: {
                wallet: true
            }
        });
    }

    async updateKycStatus(userId: string, status: 'VERIFIED' | 'REJECTED') {
        return this.prisma.user.update({
            where: { id: userId },
            data: { kycStatus: status }
        });
    }

    async deleteUserFull(userId: string) {
        return this.prisma.$transaction(async (tx) => {
            // 1. Fetch user to identify sponsor
            const user = await tx.user.findUnique({
                where: { id: userId },
                select: { id: true, sponsorId: true, wallet: { select: { id: true } } }
            });

            if (!user) {
                throw new Error('User not found');
            }

            // 2. MLM Compression: Move referrals to sponsor
            // If user has a sponsor, move referrals to that sponsor.
            // If user has no sponsor (root), referrals become root (sponsorId: null)
            await tx.user.updateMany({
                where: { sponsorId: userId },
                data: { sponsorId: user.sponsorId }
            });

            // 3. Delete Financials & Operations
            // Delete MLM Commissions (Earner or Buyer or Related to Order)
            // Note: MlmCommission relation fields: earnerId, buyerId. Also orderId.
            // We need to delete commissions where this user is involved.
            await tx.mlmCommission.deleteMany({
                where: {
                    OR: [
                        { earnerId: userId },
                        { buyerId: userId }
                    ]
                }
            });

            // Delete Investments and Payouts
            // First find investments to delete their payouts
            const userInvestments = await tx.investment.findMany({
                where: { userId: userId },
                select: { id: true }
            });
            const investmentIds = userInvestments.map(inv => inv.id);

            if (investmentIds.length > 0) {
                await tx.investmentPayout.deleteMany({
                    where: { investmentId: { in: investmentIds } }
                });
                await tx.investment.deleteMany({
                    where: { id: { in: investmentIds } }
                });
            }

            // Delete Wallet and Ledger
            if (user.wallet) {
                await tx.walletLedger.deleteMany({
                    where: { walletId: user.wallet.id }
                });
                await tx.wallet.delete({
                    where: { id: user.wallet.id }
                });
            }

            // Delete Orders and Items
            const userOrders = await tx.order.findMany({
                where: { userId: userId },
                select: { id: true }
            });
            const orderIds = userOrders.map(o => o.id);

            if (orderIds.length > 0) {
                // Also delete MLM commissions linked to these orders (even if user wasn't buyer/earner)
                await tx.mlmCommission.deleteMany({
                    where: { orderId: { in: orderIds } }
                });

                await tx.orderItem.deleteMany({
                    where: { orderId: { in: orderIds } }
                });
                await tx.order.deleteMany({
                    where: { id: { in: orderIds } }
                });
            }

            // Delete Deposit Requests
            await tx.depositRequest.deleteMany({
                where: { userId: userId }
            });

            // Delete Notifications
            await tx.notification.deleteMany({
                where: { userId: userId }
            });

            // Delete Support Data
            await tx.supportMessage.deleteMany({
                where: { senderId: userId }
            });
            await tx.supportConversation.deleteMany({
                where: { userId: userId }
            });
            // Also unassign tickets assigned to this user if they were support staff
            await tx.supportConversation.updateMany({
                where: { assignedToId: userId },
                data: { assignedToId: null }
            });

            // 4. Finally Delete User
            return tx.user.delete({
                where: { id: userId }
            });
        });
    }
}
