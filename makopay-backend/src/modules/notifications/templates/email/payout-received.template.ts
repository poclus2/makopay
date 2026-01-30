import { BaseEmailTemplate } from './base.template';

export const PayoutReceivedTemplate = (name: string, amount: string, currency: string, source: string) => {
    const content = `
        <p>Hello ${name},</p>
        <p>You've received a new payout!</p>
        
        <div class="card">
            <div class="card-row">
                <span class="label">Amount:</span>
                <span class="value highlight">+${amount} ${currency}</span>
            </div>
            <div class="card-row">
                <span class="label">Source:</span>
                <span class="value">${source}</span>
            </div>
        </div>

        <p>The funds have been added to your wallet balance.</p>
        <a href="${process.env.FRONTEND_URL}/dashboard/wallet" class="button">View Wallet</a>
    `;
    return BaseEmailTemplate('Payout Received', content);
};
