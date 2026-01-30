import { BaseEmailTemplate } from './base.template';

export const DepositReceivedTemplate = (name: string, amount: string, currency: string, method: string) => {
    const content = `
        <p>Hello ${name},</p>
        <p>Good news! Your deposit has been successfully credited to your wallet.</p>
        
        <div class="card">
            <div class="card-row">
                <span class="label">Amount:</span>
                <span class="value highlight">+${amount} ${currency}</span>
            </div>
            <div class="card-row">
                <span class="label">Method:</span>
                <span class="value">${method}</span>
            </div>
            <div class="card-row">
                <span class="label">Date:</span>
                <span class="value">${new Date().toLocaleDateString()}</span>
            </div>
        </div>

        <p>You can now use these funds to invest in our products or purchase items from the shop.</p>
        <a href="${process.env.FRONTEND_URL}/dashboard" class="button">Go to Dashboard</a>
    `;
    return BaseEmailTemplate('Deposit Confirmed', content);
};
