/**
 * Cameroon Mobile Operator Detection Utility
 * Détecte l'opérateur mobile camerounais basé sur le préfixe du numéro
 */

export enum CameroonOperator {
    ORANGE = 'ORANGE',
    MTN = 'MTN',
    UNKNOWN = 'UNKNOWN'
}

/**
 * Préfixes des opérateurs camerounais
 */
const OPERATOR_PREFIXES = {
    ORANGE: [
        '640', '655', '656', '657', '658', '659',
        '686', '687', '688', '689', '69'
    ],
    MTN: [
        '650', '651', '652', '653', '654',
        '67', '680', '681', '682', '683'
    ]
};

/**
 * Normalise un numéro de téléphone camerounais
 * Accepte: +237655867729, 237655867729, 655867729, 0655867729
 * Retourne: 655867729
 */
export function normalizePhoneNumber(phoneNumber: string): string {
    // Enlever tous les espaces, tirets, parenthèses
    let normalized = phoneNumber.replace(/[\s\-\(\)]/g, '');

    // Enlever le préfixe international
    if (normalized.startsWith('+237')) {
        normalized = normalized.substring(4);
    } else if (normalized.startsWith('237')) {
        normalized = normalized.substring(3);
    }

    // Enlever le 0 initial si présent
    if (normalized.startsWith('0')) {
        normalized = normalized.substring(1);
    }

    return normalized;
}

/**
 * Détecte l'opérateur mobile camerounais
 * @param phoneNumber Numéro de téléphone (format accepté: +237XXX, 237XXX, 0XXX, XXX)
 * @returns L'opérateur détecté (ORANGE, MTN, UNKNOWN)
 */
export function detectCameroonOperator(phoneNumber: string): CameroonOperator {
    const normalized = normalizePhoneNumber(phoneNumber);

    // Le numéro doit avoir 9 chiffres pour être valide au Cameroun
    if (normalized.length !== 9) {
        return CameroonOperator.UNKNOWN;
    }

    // Vérifier Orange (ex: 655867729 → préfixe 655)
    for (const prefix of OPERATOR_PREFIXES.ORANGE) {
        if (normalized.startsWith(prefix)) {
            return CameroonOperator.ORANGE;
        }
    }

    // Vérifier MTN (ex: 651702809 → préfixe 651)
    for (const prefix of OPERATOR_PREFIXES.MTN) {
        if (normalized.startsWith(prefix)) {
            return CameroonOperator.MTN;
        }
    }

    return CameroonOperator.UNKNOWN;
}

/**
 * Vérifie si un numéro est camerounais
 */
export function isCameroonNumber(phoneNumber: string): boolean {
    // Vérifier si le numéro contient le code pays Cameroun (+237 ou 237)
    if (phoneNumber.includes('237')) {
        return true;
    }

    // Normaliser et vérifier la longueur
    const normalized = normalizePhoneNumber(phoneNumber);

    // Accepter uniquement les numéros de 9 chiffres
    if (normalized.length !== 9) {
        return false;
    }

    // Vérifier si le préfixe correspond à un opérateur camerounais connu
    const operator = detectCameroonOperator(phoneNumber);
    return operator !== CameroonOperator.UNKNOWN;
}

/**
 * Mapping des sender IDs par opérateur pour NEXAH
 */
export const NEXAH_SENDER_IDS = {
    [CameroonOperator.ORANGE]: 'Makopay',
    [CameroonOperator.MTN]: 'InfoSMS',
    [CameroonOperator.UNKNOWN]: 'InfoSMS', // Fallback par défaut
};

/**
 * Obtient le sender ID approprié pour un numéro camerounais
 */
export function getNexahSenderId(phoneNumber: string): string {
    const operator = detectCameroonOperator(phoneNumber);
    return NEXAH_SENDER_IDS[operator];
}
