import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class NexahService {
    private readonly logger = new Logger(NexahService.name);
    private readonly apiUrl = process.env.NEXAH_API_URL || 'https://api.nexah.net/v1';
    private readonly apiKey = process.env.NEXAH_API_KEY;
    private readonly senderId = process.env.NEXAH_SENDER_ID || 'MAKOPAY';

    constructor(private readonly httpService: HttpService) { }

    async sendSms(to: string, message: string): Promise<{
        success: boolean;
        messageId?: string;
        error?: string;
    }> {
        try {
            // Format phone number for Nexah (remove +, keep 237xxxxxxxxx)
            const formattedPhone = to.replace('+', '');

            this.logger.log(`Sending SMS to ${formattedPhone} via Nexah`);

            const response = await firstValueFrom(
                this.httpService.post(
                    `${this.apiUrl}/sms/send`,
                    {
                        to: formattedPhone,
                        message,
                        sender_id: this.senderId,
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${this.apiKey}`,
                            'Content-Type': 'application/json',
                        },
                    },
                ),
            );

            const { message_id } = response.data;
            this.logger.log(`SMS sent successfully to ${formattedPhone}: ${message_id}`);

            return {
                success: true,
                messageId: message_id,
            };
        } catch (error) {
            this.logger.error(
                `Failed to send SMS to ${to}:`,
                error.response?.data || error.message,
            );

            return {
                success: false,
                error: error.response?.data?.message || error.message,
            };
        }
    }

    async getBalance(): Promise<number> {
        try {
            const response = await firstValueFrom(
                this.httpService.get(`${this.apiUrl}/account/balance`, {
                    headers: { Authorization: `Bearer ${this.apiKey}` },
                }),
            );

            const balance = response.data.balance || 0;
            this.logger.log(`Nexah balance: ${balance} XAF`);
            return balance;
        } catch (error) {
            this.logger.error('Failed to get Nexah balance:', error.message);
            return 0;
        }
    }

    /**
     * Calculate cost: 11 XAF per SMS
     */
    calculateCost(messageCount: number): number {
        return messageCount * 11;
    }
}
