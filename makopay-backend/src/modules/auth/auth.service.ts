import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { User } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        private notificationsService: NotificationsService,
    ) { }

    async register(registerDto: RegisterDto): Promise<any> {
        const existingUser = await this.usersService.findOne(registerDto.phoneNumber);
        if (existingUser) {
            throw new ConflictException('Phone number already exists');
        }

        const hashedPassword = await argon2.hash(registerDto.password);

        // Build user data conditionally
        const userData: any = {
            phoneNumber: registerDto.phoneNumber,
            passwordHash: hashedPassword,
            firstName: registerDto.firstName,
            lastName: registerDto.lastName,
            referralCode: this.generateReferralCode(),
        };

        // Only include email if it has a value (avoid Prisma unique constraint issue with null/empty)
        if (registerDto.email) {
            userData.email = registerDto.email;
        }

        // Handle sponsor relationship
        let sponsorId: string | null = null;
        if (registerDto.referralCode) {
            const sponsor = await this.usersService.findByReferralCode(registerDto.referralCode);
            if (!sponsor) {
                throw new BadRequestException('Invalid referral code');
            }
            userData.sponsor = { connect: { id: sponsor.id } };
            sponsorId = sponsor.id;
        } else if (registerDto.sponsorId) {
            userData.sponsor = { connect: { id: registerDto.sponsorId } };
            sponsorId = registerDto.sponsorId;
        }

        // Generate OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        userData.otpCode = otpCode;
        userData.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        userData.phoneVerified = false;

        const user = await this.usersService.create(userData);

        // Notify Sponsor
        if (sponsorId) {
            await this.notificationsService.sendNewReferralNotification(
                sponsorId,
                `${user.firstName} ${user.lastName}`
            );
        }

        // Send OTP via SMS
        try {
            await this.notificationsService.sendSms(user.phoneNumber, `Votre code de vérification MakoPay est: ${otpCode}`, true);
        } catch (error) {
            console.error('Failed to send OTP SMS', error);
            // Don't fail registration, user can request resend
        }

        // Return user info but NO detailed token (or partial token if desired, but here we enforce verify first)
        return {
            message: 'Registration successful. Please verify your phone number.',
            userId: user.id,
            phoneNumber: user.phoneNumber,
            requiresVerification: true
        };
    }

    private generateReferralCode(): string {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let result = '';
        for (let i = 0; i < 8; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    async verifyPhone(phoneNumber: string, code: string): Promise<any> {
        const user = await this.usersService.findOne(phoneNumber);
        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        if (user.phoneVerified) {
            return this.login(user);
        }

        if (user.otpCode !== code) {
            throw new BadRequestException('Invalid verification code');
        }

        if (user.otpExpiresAt && user.otpExpiresAt < new Date()) {
            throw new BadRequestException('Verification code expired');
        }

        // Verify user
        await this.usersService.update(user.id, {
            phoneVerified: true,
            otpCode: null,
            otpExpiresAt: null,
        });

        const updatedUser = await this.usersService.findById(user.id);
        return this.login(updatedUser);
    }

    async validateUser(phoneNumber: string, pass: string): Promise<any> {
        const user = await this.usersService.findOne(phoneNumber);
        if (user && (await argon2.verify(user.passwordHash, pass))) {
            const { passwordHash, ...result } = user;
            return result;
        }
        return null;
    }

    async login(user: any) {
        // Payload now uses phoneNumber instead of email if identifying by it, or just sub/role
        const payload = { phoneNumber: user.phoneNumber, sub: user.id, role: user.role };
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                phoneNumber: user.phoneNumber,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                kycStatus: user.kycStatus,
            }
        };
    }

    async resendVerificationCode(phoneNumber: string): Promise<any> {
        const user = await this.usersService.findOne(phoneNumber);
        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        if (user.phoneVerified) {
            throw new ConflictException('Phone number already verified');
        }

        // Generate OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        await this.usersService.update(user.id, {
            otpCode,
            otpExpiresAt,
        });

        // Send OTP via SMS
        try {
            await this.notificationsService.sendSms(user.phoneNumber, `Votre nouveau code de vérification MakoPay est: ${otpCode}`, true);
        } catch (error) {
            console.error('Failed to resend OTP SMS', error);
            throw new BadRequestException('Failed to send SMS');
        }

        return { message: 'Verification code resent successfully' };
    }

    async getProfile(userId: string) {
        const user = await this.usersService.findById(userId);
        if (!user) { throw new UnauthorizedException(); }
        const { passwordHash, ...result } = user;
        return result;
    }

    async changePassword(userId: string, dto: ChangePasswordDto) {
        const user = await this.usersService.findById(userId);
        if (!user) { throw new UnauthorizedException('User not found'); }

        const isMatch = await argon2.verify(user.passwordHash, dto.currentPassword);
        if (!isMatch) {
            throw new UnauthorizedException('Current password is incorrect');
        }

        const newHashedPassword = await argon2.hash(dto.newPassword);
        await this.usersService.update(userId, { passwordHash: newHashedPassword });

        // Notification
        await this.notificationsService.createInAppNotification(
            userId,
            'Security Alert',
            'Your password has been changed successfully.',
            'WARNING'
        );

        return { message: 'Password changed successfully' };
    }
}
