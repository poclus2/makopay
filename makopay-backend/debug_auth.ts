import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { UsersService } from './src/modules/users/users.service';
import { AuthService } from './src/modules/auth/auth.service';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const usersService = app.get(UsersService);
    const authService = app.get(AuthService);

    console.log('--- DEBUG START ---');

    // 1. Find Admin
    const admin = await usersService.findOne('+15550000000');
    console.log('Admin found:', admin ? 'YES' : 'NO');
    if (admin) {
        console.log('Admin ID:', admin.id);
        console.log('Admin Hash:', admin.passwordHash);

        // 2. Test Password
        const valid = await authService.validateUser('+15550000000', 'admin123');
        console.log('Password Valid:', valid ? 'YES' : 'NO');

        if (valid) {
            // 3. Test Login/Token
            const login = await authService.login(admin);
            console.log('Token generated:', !!login.access_token);

            // 4. Test Token Validation (Manual Simulation)
            // We can't easily invoke JwtStrategy directly without mocking request/payload
            // But we can check if finding by ID works
            const userById = await usersService.findById(admin.id);
            console.log('Find By ID works:', !!userById);
        }
    }

    console.log('--- DEBUG END ---');
    await app.close();
}

bootstrap();
