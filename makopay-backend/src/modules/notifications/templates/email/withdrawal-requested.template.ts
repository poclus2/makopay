import { BaseEmailTemplate } from './base.template';

export const WithdrawalRequestedTemplate = (name: string, amount: string, currency: string) => {
    const content = `
        <p>Hello ${name},</p>
        <p>We have received your withdrawal request.</p>
        
        <div class="card">
            <div class="card-row">
                <span class="label">Amount:</span>
                <span class="value">${amount} ${currency}</span>
            </div>
            <div class="card-row">
                <span class="label">Status:</span>
                <span class="value" style="color: #f59e0b;">Pending Processing</span>
            </div>
        </div>

        <p>Our team will process your request shortly. You will receive another notification once the funds are sent.</p>
    `;
    return BaseEmailTemplate('Withdrawal Request Received', content);
};
