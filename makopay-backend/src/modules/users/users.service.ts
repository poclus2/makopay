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
}
