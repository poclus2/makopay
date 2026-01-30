
import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

async function verify() {
    const prisma = new PrismaClient();
    const phone = '+15550000000';
    const pass = 'admin123';

    try {
        const user = await prisma.user.findUnique({ where: { phoneNumber: phone } });
        console.log('User found:', user ? 'YES' : 'NO');
        if (user) {
            console.log('Role:', user.role);
            const valid = await argon2.verify(user.passwordHash, pass);
            console.log('Password valid:', valid);
        }
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

verify();
