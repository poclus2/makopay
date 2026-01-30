export const OtpSmsTemplate = (code: string) =>
    `Your MakoPay verification code is: ${code}. Do not share this code with anyone. Valid for 10 minutes.`;

export const WelcomeSmsTemplate = (name: string) =>
    `Welcome to MakoPay, ${name}! We're glad to have you with us. Log in now to start your journey.`;
