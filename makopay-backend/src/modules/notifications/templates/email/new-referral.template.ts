import { BaseEmailTemplate } from './base.template';

export const NewReferralTemplate = (sponsorName: string, referralName: string) => {
    const content = `
        <p>Hello ${sponsorName},</p>
        <p>Great news! Your network is growing.</p>
        
        <div class="card">
            <div class="card-row">
                <span class="label">New Member:</span>
                <span class="value highlight">${referralName}</span>
            </div>
            <div class="card-row">
                <span class="label">Date Joined:</span>
                <span class="value">${new Date().toLocaleDateString()}</span>
            </div>
        </div>

        <p>Help them verify their account and make their first investment to earn commissions.</p>
        <a href="${process.env.FRONTEND_URL}/dashboard/network" class="button">View Network</a>
    `;
    return BaseEmailTemplate('New Team Member', content);
};
