import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class ResendService {
    private readonly logger = new Logger(ResendService.name);
    private readonly resend: Resend;
    private readonly fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@makopay.live';
    private readonly fromName = process.env.RESEND_FROM_NAME || 'Makopay';

    constructor() {
        const apiKey = process.env.RESEND_API_KEY;
        if (!apiKey) {
            this.logger.warn('RESEND_API_KEY not configured');
        }
        this.resend = new Resend(apiKey);
    }

    async sendEmail(
        to: string,
        subject: string,
        message: string,
    ): Promise<{
        success: boolean;
        messageId?: string;
        error?: string;
    }> {
        try {
            this.logger.log(`Sending email to ${to} via Resend`);

            const { data, error } = await this.resend.emails.send({
                from: `${this.fromName} <${this.fromEmail}>`,
                to: [to],
                subject,
                html: this.formatHtml(message),
                text: message,
            });

            if (error) {
                this.logger.error(`Failed to send email to ${to}:`, error);
                return {
                    success: false,
                    error: error.message,
                };
            }

            this.logger.log(`Email sent successfully to ${to}: ${data.id}`);
            return {
                success: true,
                messageId: data.id,
            };
        } catch (error) {
            this.logger.error(`Exception sending email to ${to}:`, error);
            return {
                success: false,
                error: error.message,
            };
        }
    }

    private formatHtml(message: string): string {
        // Convert plain text to styled HTML
        return `
      <!DOCTYPE html>
      <html lang="fr">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f4f4f4;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 20px auto;
              background-color: #ffffff;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            .header {
              background-color: #000000;
              color: #ffffff;
              padding: 20px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
            }
            .content {
              padding: 30px;
            }
            .content p {
              margin: 0 0 15px 0;
            }
            .footer {
              background-color: #f8f8f8;
              padding: 20px;
              text-align: center;
              font-size: 12px;
              color: #666;
              border-top: 1px solid #eee;
            }
            .footer a {
              color: #000;
              text-decoration: none;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Makopay</h1>
            </div>
            <div class="content">
              ${message.split('\n').map(line => `<p>${line}</p>`).join('')}
            </div>
            <div class="footer">
              <p>Vous recevez cet email car vous êtes client Makopay</p>
              <p><a href="https://makopay.live">makopay.live</a></p>
            </div>
          </div>
        </body>
      </html>
    `;
    }

    /**
     * Calculate cost: Free tier (3000/month), then ~$0.001/email
     */
    calculateCost(emailCount: number): number {
        if (emailCount <= 3000) return 0;
        // After free tier: ~5 XAF per email (approximation)
        return (emailCount - 3000) * 5;
    }
}
