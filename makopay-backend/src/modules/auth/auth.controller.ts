import { Controller, Request, Post, UseGuards, Body, Get, UnauthorizedException, Req, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('register')
    async register(@Body() registerDto: RegisterDto) {
        return this.authService.register(registerDto);
    }

    @Post('login')
    async login(@Body() loginDto: LoginDto) {
        const user = await this.authService.validateUser(loginDto.phoneNumber, loginDto.password);
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }
        return this.authService.login(user);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('me')
    getProfile(@Req() req: any) {
        return req.user;
    }

    @Post('verify-phone')
    async verifyPhone(@Body() body: { phoneNumber: string; code: string }) {
        return this.authService.verifyPhone(body.phoneNumber, body.code);
    }

    @Post('resend-code')
    async resendCode(@Body() body: { phoneNumber: string }) {
        if (!body.phoneNumber) {
            throw new BadRequestException('PhoneNumber is required');
        }
        return this.authService.resendVerificationCode(body.phoneNumber);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('change-password')
    async changePassword(@Req() req: any, @Body() dto: ChangePasswordDto) {
        return this.authService.changePassword(req.user.id, dto);
    }

    @Post('forgot-password')
    async forgotPassword(@Body() dto: ForgotPasswordDto) {
        return this.authService.forgotPassword(dto.phoneNumber);
    }

    @Post('reset-password')
    async resetPassword(@Body() dto: ResetPasswordDto) {
        return this.authService.resetPassword(dto.phoneNumber, dto.otpCode, dto.newPassword);
    }

    @Get('version')
    getVersion() {
        return {
            version: '1.2.0-debug-otp',
            timestamp: new Date().toISOString()
        };
    }
}
