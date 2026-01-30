import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({
        where: { referralCode: null },
    });

    console.log(`Found ${users.length} users ensuring referral codes...`);

    for (const user of users) {
        let code = generateReferralCode();
        // Simple retry logic for uniqueness collision (unlikely but possible)
        let unique = false;
        let attempts = 0;
        while (!unique && attempts < 5) {
            const existing = await prisma.user.findUnique({ where: { referralCode: code } });
            if (!existing) {
                unique = true;
            } else {
                code = generateReferralCode();
                attempts++;
            }
        }

        if (unique) {
            await prisma.user.update({
                where: { id: user.id },
                data: { referralCode: code },
            });
            console.log(`Updated user ${user.email || user.phoneNumber} with code ${code}`);
        } else {
            console.error(`Failed to generate unique code for user ${user.id}`);
        }
    }
}

function generateReferralCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

main()
    .catch((e) => console.error(e))
    .finally(async () => await prisma.$disconnect());
