/**
 * Interface commune pour tous les providers SMS
 */
export interface ISmsProvider {
    /**
     * Nom du provider
     */
    name: string;

    /**
     * Envoie un SMS
     * @param to Numéro de téléphone du destinataire (format international recommandé)
     * @param message Contenu du message
     * @param isOtp Indique si c'est un code OTP (peut influencer le routage)
     * @returns Promise contenant le message ID ou une erreur
     */
    sendSms(to: string, message: string, isOtp?: boolean): Promise<SmsResult>;

    /**
     * Vérifie si ce provider supporte un numéro donné
     * @param phoneNumber Numéro de téléphone
     * @param isOtp Indique si c'est un code OTP (peut influencer le routage)
     * @returns true si le provider peut gérer ce numéro
     */
    supports(phoneNumber: string, isOtp?: boolean): boolean;
}

/**
 * Résultat de l'envoi d'un SMS
 */
export interface SmsResult {
    success: boolean;
    messageId?: string;
    error?: string;
    provider: string;
    details?: any;
}

/**
 * Configuration d'un provider SMS
 */
export interface SmsProviderConfig {
    enabled: boolean;
    priority: number; // Plus le nombre est bas, plus la priorité est haute
}
