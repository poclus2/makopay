import { User } from '@prisma/client';

/**
 * Render a template string by replacing variables with actual values
 * Variables are in the format {variableName}
 */
export function renderTemplate(template: string, variables: Record<string, any>): string {
    let result = template;

    for (const [key, value] of Object.entries(variables)) {
        const regex = new RegExp(`\\{${key}\\}`, 'g');
        result = result.replace(regex, String(value || ''));
    }

    return result;
}

/**
 * Extract all variables from a template string
 * Returns array of variable names
 */
export function extractVariables(template: string): string[] {
    const regex = /\{([a-zA-Z0-9_]+)\}/g;
    const matches = template.matchAll(regex);
    const variables = Array.from(matches).map(match => match[1]);

    // Return unique variables only
    return Array.from(new Set(variables));
}

/**
 * Get system variables for a user
 */
export function getSystemVariables(user: User | Partial<User>): Record<string, any> {
    const currentDate = new Date();

    return {
        // User info
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        phoneNumber: user.phoneNumber || '',
        email: user.email || '',

        // Finance (if wallet is loaded)
        balance: (user as any).wallet?.balance || 0,
        balanceXAF: Math.floor((user as any).wallet?.balance || 0),

        // MLM
        referralCode: user.referralCode || '',
        referralLink: user.referralCode ? `https://makopay.live/auth/register?ref=${user.referralCode}` : '',

        // Platform
        appName: 'MakoPay',
        supportEmail: 'support@makopay.live',
        websiteUrl: 'https://makopay.live',

        // Date/Time
        currentDate: currentDate.toLocaleDateString('fr-FR'),
        currentYear: currentDate.getFullYear(),
    };
}

/**
 * Render template for a specific user
 */
export function renderUserTemplate(template: string, user: User | Partial<User>, customVariables?: Record<string, any>): string {
    const systemVars = getSystemVariables(user);
    const allVariables = { ...systemVars, ...customVariables };

    return renderTemplate(template, allVariables);
}
