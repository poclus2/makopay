import { Injectable, Logger } from '@nestjs/common';
import { Infobip, AuthType } from '@infobip-api/sdk';

@Injectable()
export class InfobipProvider {
    private infobip: Infobip;
    private readonly logger = new Logger(InfobipProvider.name);

    constructor() {
        if (process.env.INFOBIP_API_KEY && process.env.INFOBIP_BASE_URL) {
            this.infobip = new Infobip({
                baseUrl: process.env.INFOBIP_BASE_URL,
                apiKey: process.env.INFOBIP_API_KEY,
                authType: AuthType.ApiKey,
            });
        } else {
            this.logger.warn('INFOBIP_API_KEY or INFOBIP_BASE_URL not found in environment variables');
        }
    }

    async sendSms(to: string, message: string): Promise<any> {
        if (!this.infobip) {
            this.logger.error('Infobip client not initialized');
            return null;
        }

        try {
            const response = await this.infobip.channels.sms.send({
                messages: [
                    {
                        destinations: [{ to }],
                        from: process.env.INFOBIP_SENDER_ID || 'MakoPay',
                        text: message,
                    },
                ],
            });
            this.logger.log(`SMS sent to ${to}: ${response.data.messages?.[0]?.messageId}`);
            return response.data;
        } catch (error) {
            this.logger.error(`Failed to send SMS to ${to}`, error);
            throw error;
        }
    }

    async sendWhatsApp(to: string, message: string): Promise<any> {
        if (!this.infobip) {
            this.logger.error('Infobip client not initialized');
            return null;
        }

        try {
            // Basic text message for WhatsApp
            const response = await this.infobip.channels.whatsapp.send({
                from: process.env.INFOBIP_WHATSAPP_NUMBER,
                to: to,
                content: {
                    text: message
                }
            });
            this.logger.log(`WhatsApp sent to ${to}: ${response.data.messageId}`);
            return response.data;
        } catch (error) {
            this.logger.error(`Failed to send WhatsApp to ${to}`, error);
            throw error;
        }
    }
}
