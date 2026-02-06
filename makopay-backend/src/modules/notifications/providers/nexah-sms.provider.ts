import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { ISmsProvider, SmsResult } from '../interfaces/sms-provider.interface';
import { isCameroonNumber, getNexahSenderId } from '../utils/cameroon-operator.util';

/**
 * NEXAH SMS Provider
 * Provider spécialisé pour le Cameroun avec détection automatique d'opérateur
 */
@Injectable()
export class NexahSmsProvider implements ISmsProvider {
    private readonly logger = new Logger(NexahSmsProvider.name);
    readonly name = 'NEXAH';

    private readonly baseUrl: string;
    private readonly username: string;
    private readonly password: string;

    constructor(private configService: ConfigService) {
        this.baseUrl = this.configService.get<string>('NEXAH_API_URL', 'https://smsvas.com/bulk/public/index.php/api/v1');
        this.username = this.configService.get<string>('NEXAH_USERNAME');
        this.password = this.configService.get<string>('NEXAH_PASSWORD');
    }

    /**
     * Vérifie si NEXAH supporte ce numéro (uniquement Cameroun)
     */
    supports(phoneNumber: string): boolean {
        return isCameroonNumber(phoneNumber);
    }

    /**
     * Envoie un SMS via NEXAH
     */
    async sendSms(to: string, message: string, isOtp: boolean = false): Promise<SmsResult> {
        if (!this.username || !this.password) {
            this.logger.error('NEXAH credentials not configured');
            return {
                success: false,
                error: 'NEXAH credentials missing',
                provider: this.name,
            };
        }

        // Détecter l'opérateur et choisir le bon sender ID
        const senderId = getNexahSenderId(to);

        this.logger.log(`Sending SMS via NEXAH to ${to} with sender ID: ${senderId}`);

        try {
            const response = await axios.post(
                `${this.baseUrl}/sendsms`,
                {
                    user: this.username,
                    password: this.password,
                    senderid: senderId,
                    sms: message,
                    mobiles: to.replace('+', ''), // NEXAH accepte avec ou sans +
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                    },
                    timeout: 10000, // 10 secondes timeout
                }
            );

            const data = response.data;

            // Vérifier la réponse
            if (data.responsecode === 1 && data.sms && data.sms.length > 0) {
                const smsResult = data.sms[0];

                if (smsResult.status === 'success') {
                    this.logger.log(`SMS sent successfully via NEXAH: ${smsResult.messageid}`);
                    return {
                        success: true,
                        messageId: smsResult.messageid,
                        provider: this.name,
                        details: {
                            senderId,
                            clientId: smsResult.smsclientid,
                        }
                    };
                } else {
                    this.logger.warn(`NEXAH SMS failed: ${smsResult.errordescription}`);
                    return {
                        success: false,
                        error: `${smsResult.errorcode}: ${smsResult.errordescription}`,
                        provider: this.name,
                    };
                }
            } else {
                this.logger.error(`NEXAH API error: ${data.responsemessage}`);
                return {
                    success: false,
                    error: data.responsemessage || 'Unknown NEXAH error',
                    provider: this.name,
                };
            }

        } catch (error: any) {
            this.logger.error(`NEXAH API call failed: ${error.message}`);
            return {
                success: false,
                error: error.response?.data?.responsemessage || error.message,
                provider: this.name,
            };
        }
    }

    /**
     * Récupère le solde du compte NEXAH
     */
    async getBalance(): Promise<{ credit: number; accountExpDate: string; balanceExpDate: string } | null> {
        if (!this.username || !this.password) {
            this.logger.error('NEXAH credentials not configured');
            return null;
        }

        try {
            const response = await axios.post(
                `${this.baseUrl}/smscredit`,
                {
                    user: this.username,
                    password: this.password,
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                    },
                    timeout: 10000,
                }
            );

            return {
                credit: response.data.credit,
                accountExpDate: response.data.accountexpdate,
                balanceExpDate: response.data.balanceexpdate,
            };
        } catch (error: any) {
            this.logger.error(`Failed to fetch NEXAH balance: ${error.message}`);
            return null;
        }
    }
}
