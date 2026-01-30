import { BaseEmailTemplate } from './base.template';

export const InvestmentStartedTemplate = (name: string, planName: string, amount: string, currency: string, endDate: string) => {
    const content = `
        <p>Hello ${name},</p>
        <p>Congratulations! Your new investment plan has started successfully.</p>
        
        <div class="card">
            <div class="card-row">
                <span class="label">Plan:</span>
                <span class="value highlight">${planName}</span>
            </div>
            <div class="card-row">
                <span class="label">Invested Amount:</span>
                <span class="value">${amount} ${currency}</span>
            </div>
             <div class="card-row">
                <span class="label">Completion Date:</span>
                <span class="value">${endDate}</span>
            </div>
        </div>

        <p>You can track your investment performance directly from your dashboard.</p>
        <a href="${process.env.FRONTEND_URL}/dashboard/investments" class="button">Track Investment</a>
    `;
    return BaseEmailTemplate('Investment Started', content);
};
