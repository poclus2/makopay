import { PrismaClient, UserRole, LedgerSource, WalletTransactionType, PayoutFrequency } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
    console.log('Start seeding ...');

    // 1. Create Admin
    const adminPhone = '+15550000000';
    const existingAdmin = await prisma.user.findUnique({ where: { phoneNumber: adminPhone } });

    if (!existingAdmin) {
        const passwordHash = await argon2.hash('admin123');
        await prisma.user.create({
            data: {
                phoneNumber: adminPhone,
                email: 'admin@makopay.com',
                firstName: 'Super',
                lastName: 'Admin',
                passwordHash,
                role: UserRole.ADMIN,
            },
        });
        console.log('Created Admin');
    }

    // 2. Create Investment Plans
    const plans = [
        {
            name: 'Starter Plan',
            durationDays: 30,
            yieldPercent: 10.00,
            minAmount: 100,
            payoutFrequency: PayoutFrequency.DAILY
        },
        {
            name: 'Pro Plan',
            durationDays: 60,
            yieldPercent: 15.00,
            minAmount: 500,
            payoutFrequency: PayoutFrequency.DAILY
        },
        {
            name: 'Whale Plan',
            durationDays: 90,
            yieldPercent: 25.00,
            minAmount: 2000,
            payoutFrequency: PayoutFrequency.DAILY
        }
    ];

    for (const p of plans) {
        const existing = await prisma.investmentPlan.findFirst({ where: { name: p.name } });
        if (!existing) {
            await prisma.investmentPlan.create({
                data: {
                    ...p,
                    yieldPercent: new Number(p.yieldPercent).toString(),
                    minAmount: new Number(p.minAmount).toString()
                }
            });
            console.log(`Created Plan: ${p.name}`);
        }
    }

    // 3. Create Users Hierarchy
    const passwordHash = await argon2.hash('user123');

    let userA = await prisma.user.findUnique({ where: { phoneNumber: '+15550000001' } });
    if (!userA) {
        userA = await prisma.user.create({
            data: {
                phoneNumber: '+15550000001',
                email: 'userA@example.com',
                firstName: 'Alice',
                lastName: 'Wonder',
                passwordHash,
                role: UserRole.USER
            }
        });
        console.log('Created User A');
    }

    let userB = await prisma.user.findUnique({ where: { phoneNumber: '+15550000002' } });
    if (!userB) {
        userB = await prisma.user.create({
            data: {
                phoneNumber: '+15550000002',
                email: 'userB@example.com',
                firstName: 'Bob',
                lastName: 'Builder',
                passwordHash,
                role: UserRole.USER,
                sponsorId: userA.id
            }
        });
        console.log('Created User B');
    }

    let userC = await prisma.user.findUnique({ where: { phoneNumber: '+15550000003' } });
    if (!userC) {
        userC = await prisma.user.create({
            data: {
                phoneNumber: '+15550000003',
                email: 'userC@example.com',
                firstName: 'Charlie',
                lastName: 'Chain',
                passwordHash,
                role: UserRole.USER,
                sponsorId: userB.id
            }
        });
        console.log('Created User C');
    }

    // 4. Create Products
    const starterPlan = await prisma.investmentPlan.findFirst({ where: { name: 'Starter Plan' } });
    if (starterPlan) {
        const prodName = 'Mining Rig Starter';
        const existingProd = await prisma.product.findFirst({ where: { name: prodName } });
        if (!existingProd) {
            await prisma.product.create({
                data: {
                    name: prodName,
                    sku: 'RIG-001',
                    price: 150.00,
                    stock: 100,
                    isCommissionable: true,
                    investmentPlanId: starterPlan.id
                }
            });
            console.log('Created Product: Mining Rig Starter');
        }
    }

    console.log('Seeding finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
