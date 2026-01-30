import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma/prisma.service';

@Injectable()
export class NotificationSettingsService {
    constructor(private readonly prisma: PrismaService) { }

    async getSettings() {
        const emailEnabled = await this.prisma.systemSetting.findUnique({ where: { key: 'notifications.email.enabled' } });
        const smsEnabled = await this.prisma.systemSetting.findUnique({ where: { key: 'notifications.sms.enabled' } });

        return {
            emailEnabled: emailEnabled?.value === 'true',
            smsEnabled: smsEnabled?.value === 'true',
        };
    }

    async updateSettings(settings: { emailEnabled?: boolean; smsEnabled?: boolean }) {
        if (settings.emailEnabled !== undefined) {
            await this.prisma.systemSetting.upsert({
                where: { key: 'notifications.email.enabled' },
                update: { value: String(settings.emailEnabled) },
                create: { key: 'notifications.email.enabled', value: String(settings.emailEnabled), description: 'Enable/Disable Email Notifications' },
            });
        }

        if (settings.smsEnabled !== undefined) {
            await this.prisma.systemSetting.upsert({
                where: { key: 'notifications.sms.enabled' },
                update: { value: String(settings.smsEnabled) },
                create: { key: 'notifications.sms.enabled', value: String(settings.smsEnabled), description: 'Enable/Disable SMS Notifications' },
            });
        }

        return this.getSettings();
    }
}
