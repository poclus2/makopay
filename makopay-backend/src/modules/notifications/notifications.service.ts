import { Injectable, Logger, Inject, NotFoundException } from '@nestjs/common';
import { EmailProvider } from './providers/email.provider';
import { InfobipProvider } from './providers/infobip.provider';
import { NexahSmsProvider } from './providers/nexah-sms.provider';
import { InfobipSmsProvider } from './providers/infobip-sms.provider';
import { ISmsProvider } from './interfaces/sms-provider.interface';
import { NotificationSettingsService } from './notification-settings.service';
import { PrismaService } from '../../core/database/prisma/prisma.service';
import { DepositReceivedTemplate } from './templates/email/deposit-received.template';
import { WithdrawalRequestedTemplate } from './templates/email/withdrawal-requested.template';
import { InvestmentStartedTemplate } from './templates/email/investment-started.template';
import { PayoutReceivedTemplate } from './templates/email/payout-received.template';
import { OrderPaidTemplate } from './templates/email/order-paid.template';
import { NewReferralTemplate } from './templates/email/new-referral.template';
import { SupportReplyTemplate } from './templates/email/support-reply.template';

@Injectable()
export class NotificationsService {
    private readonly logger = new Logger(NotificationsService.name);

    private readonly smsProviders: ISmsProvider[];

    constructor(
        private readonly emailProvider: EmailProvider,
        private readonly infobipProvider: InfobipProvider,
        private readonly nexahSmsProvider: NexahSmsProvider,
        private readonly infobipSmsProvider: InfobipSmsProvider,
        private readonly settingsService: NotificationSettingsService,
        private readonly prisma: PrismaService,
    ) {
        // Ordre de priorité: NEXAH (Cameroun) → Infobip (Global)
        this.smsProviders = [
            this.nexahSmsProvider,
            this.infobipSmsProvider,
        ];
    }

    async sendEmail(to: string, subject: string, html: string, force = false) {
        if (!force) {
            const settings = await this.settingsService.getSettings();
            if (!settings.emailEnabled) {
                this.logger.log(`Email to ${to} skipped (Email notifications disabled)`);
                return null;
            }
        }
        return this.emailProvider.sendEmail(to, subject, html);
    }

    async sendSms(to: string, message: string, force = false) {
        if (!force) {
            const settings = await this.settingsService.getSettings();
            if (!settings.smsEnabled) {
                this.logger.log(`SMS to ${to} skipped (SMS notifications disabled)`);
                return null;
            }
        }

        // Essayer chaque provider dans l'ordre de priorité
        for (const provider of this.smsProviders) {
            if (provider.supports(to)) {
                this.logger.log(`Attempting SMS via ${provider.name} to ${to}`);
                const result = await provider.sendSms(to, message, false);

                if (result.success) {
                    this.logger.log(`SMS sent successfully via ${provider.name}: ${result.messageId}`);
                    return result;
                } else {
                    this.logger.warn(`${provider.name} failed: ${result.error}. Trying next provider...`);
                }
            }
        }

        // Si tous les providers échouent
        this.logger.error(`All SMS providers failed for ${to}`);
        return null;
    }

    async sendWhatsApp(to: string, message: string, force = false) {
        if (!force) {
            const settings = await this.settingsService.getSettings();
            if (!settings.smsEnabled) {
                this.logger.log(`WhatsApp to ${to} skipped (SMS/WhatsApp notifications disabled)`);
                return null;
            }
        }
        return this.infobipProvider.sendWhatsApp(to, message);
    }

    async sendOtp(to: string, code: string, channel: 'sms' | 'whatsapp' | 'email' = 'sms') {
        const message = `Your MakoPay verification code is: ${code}. Do not share this code.`;

        switch (channel) {
            case 'sms':
                return this.sendSms(to, message);
            case 'whatsapp':
                return this.sendWhatsApp(to, message);
            case 'email':
                return this.sendEmail(to, 'Verification Code', `<p>${message}</p>`);
            default:
                this.logger.error(`Unsupported channel: ${channel}`);
        }
    }

    // In-App Notifications
    async createInAppNotification(userId: string, title: string, message: string, type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'TRANSACTION' = 'INFO') {
        return this.prisma.notification.create({
            data: {
                userId,
                title,
                message,
                type,
            }
        });
    }

    async getUserNotifications(userId: string) {
        return this.prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 50 // Limit to last 50
        });
    }

    async getUnreadCount(userId: string) {
        return this.prisma.notification.count({
            where: { userId, read: false }
        });
    }

    async markAsRead(notificationId: string, userId: string) {
        const notification = await this.prisma.notification.findUnique({
            where: { id: notificationId }
        });

        if (!notification || notification.userId !== userId) {
            throw new NotFoundException('Notification not found');
        }

        return this.prisma.notification.update({
            where: { id: notificationId },
            data: { read: true }
        });
    }


    // Specific Notification Methods (In-App + Email)

    async sendDepositSuccessNotification(userId: string, amount: string, currency: string, method: string) {
        // 1. In-App
        await this.createInAppNotification(userId, 'Funds Received', `Credit of ${amount} ${currency} received via ${method}.`, 'SUCCESS');

        // 2. Email
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (user && user.email) {
            const html = DepositReceivedTemplate(user.firstName || 'User', amount, currency, method);
            await this.sendEmail(user.email, 'Deposit Confirmed', html);
        }
    }

    async sendWithdrawalRequestNotification(userId: string, amount: string, currency: string) {
        await this.createInAppNotification(userId, 'Withdrawal Request', `Withdrawal of ${amount} ${currency} requested.`, 'WARNING');

        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (user && user.email) {
            const html = WithdrawalRequestedTemplate(user.firstName || 'User', amount, currency);
            await this.sendEmail(user.email, 'Withdrawal Request Received', html);
        }
    }

    async sendInvestmentStartedNotification(userId: string, planName: string, amount: string, currency: string, endDate: Date) {
        await this.createInAppNotification(userId, 'Investment Confirmed', `Your investment of ${amount} ${currency} in ${planName} has started.`, 'SUCCESS');

        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (user && user.email) {
            const html = InvestmentStartedTemplate(user.firstName || 'User', planName, amount, currency, endDate.toLocaleDateString());
            await this.sendEmail(user.email, 'Investment Started', html);
        }
    }

    async sendPayoutNotification(userId: string, amount: string, currency: string, source: string) {
        await this.createInAppNotification(userId, 'Funds Received', `Payout of ${amount} ${currency} received from ${source}.`, 'SUCCESS');

        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        // Optional: reduce payout spam by checking settings or simplified email
        if (user && user.email) {
            const html = PayoutReceivedTemplate(user.firstName || 'User', amount, currency, source);
            await this.sendEmail(user.email, 'New Payout Received', html);
        }
    }

    async sendOrderPaidNotification(userId: string, orderId: string, amount: string, currency: string, itemCount: number) {
        await this.createInAppNotification(userId, 'Purchase Successful', `Order ${orderId} for ${amount} ${currency} confirmed.`, 'SUCCESS');

        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (user && user.email) {
            const html = OrderPaidTemplate(user.firstName || 'User', orderId, amount, currency, itemCount);
            await this.sendEmail(user.email, 'Order Confirmed', html);
        }
    }

    async sendNewReferralNotification(sponsorId: string, newUserName: string) {
        await this.createInAppNotification(sponsorId, 'New Referral', `${newUserName} has joined your network!`, 'INFO');

        const sponsor = await this.prisma.user.findUnique({ where: { id: sponsorId } });
        if (sponsor && sponsor.email) {
            const html = NewReferralTemplate(sponsor.firstName || 'Partner', newUserName);
            await this.sendEmail(sponsor.email, 'New Team Member', html);
        }
    }

    async sendSupportReplyNotification(userId: string, ticketSubject: string, messagePreview: string, ticketId: string) {
        // 1. In-App
        await this.createInAppNotification(userId, 'Support Reply', `New reply on ticket: ${ticketSubject}`, 'INFO');

        // 2. Email
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (user && user.email) {
            const html = SupportReplyTemplate(user.firstName || 'User', ticketSubject, messagePreview, ticketId);
            await this.sendEmail(user.email, `Reply: ${ticketSubject}`, html);
        }
    }

    async markAllAsRead(userId: string) {
        return this.prisma.notification.updateMany({
            where: { userId, read: false },
            data: { read: true }
        });
    }
}
