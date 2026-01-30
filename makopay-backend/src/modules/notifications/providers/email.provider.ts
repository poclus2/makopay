import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class EmailProvider {
    private resend: Resend;
    private readonly logger = new Logger(EmailProvider.name);

    constructor() {
        // Initialize Resend with API Key from environment variables
        // We defer initialization to ensure env vars are loaded
        if (process.env.RESEND_API_KEY) {
            this.resend = new Resend(process.env.RESEND_API_KEY);
        } else {
            this.logger.warn('RESEND_API_KEY not found in environment variables');
        }
    }

    async sendEmail(to: string, subject: string, html: string): Promise<any> {
        if (!this.resend) {
            this.logger.error('Resend client not initialized');
            return null;
        }

        try {
            const data = await this.resend.emails.send({
                from: process.env.EMAIL_FROM || 'MakoPay <noreply@makopay.com>', // Update with verify domain
                to: [to],
                subject: subject,
                html: html,
            });
            this.logger.log(`Email sent to ${to}: ${(data as any).id || (data as any).data?.id}`);
            return data;
        } catch (error) {
            this.logger.error(`Failed to send email to ${to}`, error);
            throw error;
        }
    }
}
