export const WelcomeEmailTemplate = (name: string) => `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #0d9488; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { padding: 20px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; padding: 10px 20px; background-color: #0d9488; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to MakoPay!</h1>
        </div>
        <div class="content">
            <p>Hello ${name},</p>
            <p>We are thrilled to have you on board. MakoPay is your gateway to a secure and efficient financial ecosystem.</p>
            <p>You can now start exploring our investment plans, shop for products, and grow your network.</p>
            <a href="${process.env.FRONTEND_URL}/dashboard" class="button">Go to Dashboard</a>
            <p>If you have any questions, feel free to reply to this email.</p>
            <p>Best regards,<br>The MakoPay Team</p>
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} MakoPay. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
`;
