import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InfobipProvider } from './infobip.provider';
import { ISmsProvider, SmsResult } from '../interfaces/sms-provider.interface';

/**
 * Infobip SMS Provider Wrapper
 * Adapte l'ancien InfobipProvider à la nouvelle interface ISmsProvider
 */
@Injectable()
export class InfobipSmsProvider implements ISmsProvider {
    private readonly logger = new Logger(InfobipSmsProvider.name);
    readonly name = 'Infobip';

    constructor(private readonly infob ipProvider: InfobipProvider) { }

    /**
     * Infobip supporte tous les numéros (fallback global)
     */
    supports(phoneNumber: string): boolean {
        return true; // Support universel
    }

    /**
     * Envoie un SMS via Infobip
     */
    async sendSms(to: string, message: string, isOtp: boolean = false): Promise<SmsResult> {
        try {
            const result = await this.infobipProvider.sendSms(to, message);

            if (result) {
                this.logger.log(`SMS sent successfully via Infobip to ${to}`);
                return {
                    success: true,
                    messageId: result.messageId || 'infobip-success',
                    provider: this.name,
                };
            } else {
                this.logger.warn(`Infobip returned null/false for ${to}`);
                return {
                    success: false,
                    error: 'Infobip returned no result',
                    provider: this.name,
                };
            }
        } catch (error: any) {
            this.logger.error(`Infobip SMS failed: ${error.message}`);
            return {
                success: false,
                error: error.message,
                provider: this.name,
            };
        }
    }
}
