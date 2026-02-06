/**
 * Replace dynamic variables in campaign messages
 * Available variables: {firstName}, {lastName}, {phone}, {email}, {balance}, {kycStatus}, {referralCode}
 */
export function replaceVariables(template: string, user: any): string {
    if (!user) return template;

    let message = template;

    const variables = {
        '{firstName}': user.firstName || '',
        '{lastName}': user.lastName || '',
        '{phone}': user.phoneNumber || '',
        '{email}': user.email || '',
        '{balance}': user.wallet?.balance?.toLocaleString('fr-FR') || '0',
        '{kycStatus}': user.kycStatus || 'PENDING',
        '{referralCode}': user.referralCode || '',
    };

    // Replace all occurrences
    Object.entries(variables).forEach(([key, value]) => {
        message = message.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), String(value));
    });

    return message;
}
