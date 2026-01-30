import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import frTranslation from './locales/fr/translation.json';
import enTranslation from './locales/en/translation.json';

i18n
    .use(initReactI18next)
    .init({
        resources: {
            fr: { translation: frTranslation },
            en: { translation: enTranslation },
        },
        lng: localStorage.getItem('language') || 'fr', // Default to French
        fallbackLng: 'fr', // Fallback to French
        interpolation: {
            escapeValue: false, // React already escapes values
        },
        react: {
            useSuspense: false, // Disable suspense for now
        },
    });

export default i18n;
