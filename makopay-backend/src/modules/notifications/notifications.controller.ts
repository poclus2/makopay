import { Controller, Post, Body, ValidationPipe, UseInterceptors, ClassSerializerInterceptor, Get, Patch, Param, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { NotificationsService } from './notifications.service';
import { IsEmail, IsNotEmpty, IsString, IsOptional, IsPhoneNumber } from 'class-validator';
import { WelcomeEmailTemplate } from './templates/email/welcome.template';
import { WelcomeSmsTemplate } from './templates/sms/otp.template';

class TestEmailDto {
    @IsEmail()
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
}

@Controller('notifications')
@UseInterceptors(ClassSerializerInterceptor)
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) { }

    @Post('test-email')
    async sendTestEmail(@Body(ValidationPipe) dto: TestEmailDto) {
        const html = WelcomeEmailTemplate(dto.name);
        return await this.notificationsService.sendEmail(dto.to, 'Welcome to MakoPay (Test)', html);
    }

    @Post('test-sms')
    async sendTestSms(@Body(ValidationPipe) dto: TestSmsDto) {
        const message = WelcomeSmsTemplate(dto.name);
        return await this.notificationsService.sendSms(dto.phoneNumber, message);
    }

    @Post('test-whatsapp')
    async sendTestWhatsApp(@Body(ValidationPipe) dto: TestSmsDto) {
        const message = WelcomeSmsTemplate(dto.name);
        return await this.notificationsService.sendWhatsApp(dto.phoneNumber, message);
    }

    // In-App Notification Endpoints
    @UseGuards(AuthGuard('jwt'))
    @Get()
    async getUserNotifications(@Req() req: any) {
        const userId = req.user.id;
        const notifications = await this.notificationsService.getUserNotifications(userId);
        const unreadCount = await this.notificationsService.getUnreadCount(userId);
        return { notifications, unreadCount };
    }

    @UseGuards(AuthGuard('jwt'))
    @Patch(':id/read')
    async markAsRead(@Param('id') id: string, @Req() req: any) {
        return await this.notificationsService.markAsRead(id, req.user.id);
    }

    @UseGuards(AuthGuard('jwt'))
    @Patch('read-all')
    async markAllAsRead(@Req() req: any) {
        return await this.notificationsService.markAllAsRead(req.user.id);
    }
}
