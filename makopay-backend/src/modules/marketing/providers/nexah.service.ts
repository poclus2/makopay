import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { detectCameroonOperator, getNexahSenderId, normalizePhoneNumber } from '../../notifications/utils/cameroon-operator.util';

@Injectable()
export class NexahService {
    private readonly logger = new Logger(NexahService.name);
    private readonly apiUrl: string;
    private readonly user: string | undefined;
    private readonly password: string | undefined;

    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
    ) {
        this.apiUrl = this.configService.get<string>('NEXAH_API_URL', 'https://smsvas.com/bulk/public/index.php/api/v1');
        this.user = this.configService.get<string>('NEXAH_USER');
        this.password = this.configService.get<string>('NEXAH_PASSWORD');

        if (this.user && this.password) {
            this.logger.log(`NexahService initialized with user: ${this.user}`);
        } else {
            this.logger.warn('NexahService initialized WITHOUT credentials (NEXAH_USER/NEXAH_PASSWORD missing)');
        }
    }

    async sendSms(to: string, message: string): Promise<{
        success: boolean;
        messageId?: string;
        error?: string;
    }> {
        try {
            // 1. Normalize phone number
            const normalizedPhone = normalizePhoneNumber(to);
            // The API expects just the number (e.g. 655867729) or full format? 
            // Test script passes `test.number` (e.g. '237655867729').
            // Let's ensure we send 237xxxxxxxxx if the input is compatible.
            const phoneToSend = normalizedPhone.length === 9 ? `237${normalizedPhone}` : to.replace('+', '');

            // 2. Detect operator and get Sender ID
            const senderId = getNexahSenderId(phoneToSend);

            this.logger.log(`Sending SMS to ${phoneToSend} via Nexah (Sender: ${senderId})`);

            if (!this.user || !this.password) {
                throw new Error('Nexah credentials not configured (NEXAH_USER, NEXAH_PASSWORD)');
            }

            const response = await firstValueFrom(
                this.httpService.post(
                    `${this.apiUrl}/sendsms`,
                    {
                        user: this.user,
                        password: this.password,
                        senderid: senderId,
                        sms: message,
                        mobiles: phoneToSend,
                    },
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json',
                        },
                    },
                ),
            );

            const data = response.data;

            // Check response code based on test script logic
            if (data.responsecode === 1 && data.sms && data.sms.length > 0) {
                const smsResult = data.sms[0];

                if (smsResult.status === 'success') {
                    this.logger.log(`SMS sent successfully to ${phoneToSend}: ${smsResult.messageid}`);
                    return {
                        success: true,
                        messageId: smsResult.messageid,
                    };
                } else {
                    const errorMsg = `${smsResult.errorcode} - ${smsResult.errordescription}`;
                    this.logger.warn(`Nexah API returned error for ${phoneToSend}: ${errorMsg}`);
                    return {
                        success: false,
                        error: errorMsg,
                    };
                }
            } else {
                const errorMsg = data.responsemessage || 'Unknown error';
                this.logger.warn(`Nexah API Invalid Response: ${errorMsg}`);
                return {
                    success: false,
                    error: errorMsg,
                };
            }
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
            if (!this.user || !this.password) return 0;

            const response = await firstValueFrom(
                this.httpService.post(`${this.apiUrl}/smscredit`,
                    {
                        user: this.user,
                        password: this.password,
                    }, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                }),
            );

            const balance = response.data.credit || 0;
            this.logger.log(`Nexah balance: ${balance} SMS`);
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
