export interface ISmsProvider {
    sendSms(to: string, message: string): Promise<any>;
    sendWhatsApp(to: string, message: string): Promise<any>;
}
