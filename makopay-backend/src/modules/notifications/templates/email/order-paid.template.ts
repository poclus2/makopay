import { BaseEmailTemplate } from './base.template';

export const OrderPaidTemplate = (name: string, orderId: string, amount: string, currency: string, itemCount: number) => {
    const content = `
        <p>Hello ${name},</p>
        <p>Thank you for your purchase! Your order has been confirmed.</p>
        
        <div class="card">
            <div class="card-row">
                <span class="label">Order ID:</span>
                <span class="value">${orderId}</span>
            </div>
            <div class="card-row">
                <span class="label">Total Amount:</span>
                <span class="value highlight">${amount} ${currency}</span>
            </div>
            <div class="card-row">
                <span class="label">Items:</span>
                <span class="value">${itemCount}</span>
            </div>
        </div>

        <p>We are processing your order and will notify you when it ships.</p>
        <a href="${process.env.FRONTEND_URL}/dashboard/history" class="button">View Order</a>
    `;
    return BaseEmailTemplate('Order Confirmed', content);
};
