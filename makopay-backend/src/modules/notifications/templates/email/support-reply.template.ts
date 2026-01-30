
export const SupportReplyTemplate = (
    userName: string,
    ticketSubject: string,
    messageContent: string,
    ticketId: string
) => `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #000; color: #fff; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { padding: 20px; background-color: #f9f9f9; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px; }
        .message-box { background-color: #fff; padding: 15px; border-left: 4px solid #000; margin: 15px 0; font-style: italic; }
        .footer { text-align: center; font-size: 12px; color: #888; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Support Update</h2>
        </div>
        <div class="content">
            <p>Hello ${userName},</p>
            <p>You have received a new reply to your support ticket: <strong>"${ticketSubject}"</strong> (ID: #${ticketId.substring(0, 8)}).</p>
            
            <div class="message-box">
                "${messageContent}"
            </div>

            <p>You can view the full conversation and reply by logging into your MakoPay app.</p>
            
            <p>Best regards,<br/>MakoPay Support Team</p>
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} MakoPay. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
`;
