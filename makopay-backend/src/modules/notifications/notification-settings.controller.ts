import { Controller, Get, Patch, Body, Post, UseInterceptors, ClassSerializerInterceptor } from '@nestjs/common';
import { NotificationSettingsService } from './notification-settings.service';
import { NotificationsService } from './notifications.service';
import { IsBoolean, IsOptional, IsEmail, IsNotEmpty, IsPhoneNumber, IsString } from 'class-validator';
import { WelcomeEmailTemplate } from './templates/email/welcome.template';
import { WelcomeSmsTemplate } from './templates/sms/otp.template';

class UpdateSettingsDto {
    @IsBoolean()
    @IsOptional()
    emailEnabled?: boolean;

    @IsBoolean()
    @IsOptional()
    smsEnabled?: boolean;

    @IsString()
    @IsOptional()
    otpTemplate?: string;
}

class TestEmailDto {
    @IsEmail()
    @IsNotEmpty()
    to: string;

    @IsString()
    @IsNotEmpty()
    name: string;
}

class TestSmsDto {
    @IsPhoneNumber()
    @IsNotEmpty()
    phoneNumber: string;

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsOptional()
    customMessage?: string;
}

@Controller('admin/settings/notifications')
@UseInterceptors(ClassSerializerInterceptor)
export class NotificationSettingsController {
    constructor(
        private readonly settingsService: NotificationSettingsService,
        private readonly notificationsService: NotificationsService
    ) { }

    @Get()
    async getSettings() {
        return this.settingsService.getSettings();
    }

    @Patch()
    async updateSettings(@Body() dto: UpdateSettingsDto) {
        return this.settingsService.updateSettings(dto);
    }

    @Post('test-email')
    async sendTestEmail(@Body() dto: TestEmailDto) {
        const html = WelcomeEmailTemplate(dto.name);
        // Force send to bypass settings for testing purposes
        // sendEmail(to, subject, html, force)
        return await this.notificationsService.sendEmail(dto.to, 'Test Email from MakoPay', html, true);
    }

    @Post('test-sms')
    async sendTestSms(@Body() dto: TestSmsDto) {
        let message = WelcomeSmsTemplate(dto.name);

        if (dto.customMessage) {
            message = dto.customMessage;
        }

        // Force send to bypass settings
        // sendSms(to, message, force)
        return await this.notificationsService.sendSms(dto.phoneNumber, message, true);
    }
}
