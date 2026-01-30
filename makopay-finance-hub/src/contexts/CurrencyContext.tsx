import React, { createContext, useContext, useState, useEffect } from 'react';

export type CurrencyCode = 'EUR' | 'USD' | 'XOF';

interface Currency {
    code: CurrencyCode;
    symbol: string;
    name: string;
    rate: number; // Rate relative to EUR (base currency)
}

interface CurrencyContextType {
    currency: CurrencyCode;
    setCurrency: (code: CurrencyCode) => void;
    formatCurrency: (amount: number) => string;
    convertAmount: (amount: number) => number;
    availableCurrencies: Currency[];
}

const AVAILABLE_CURRENCIES: Currency[] = [
    { code: 'EUR', symbol: '€', name: 'Euro', rate: 1 },
    { code: 'USD', symbol: '$', name: 'US Dollar', rate: 1.05 },
    { code: 'XOF', symbol: 'Fcfa', name: 'CFA Franc', rate: 655.957 },
];

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currency, setCurrencyState] = useState<CurrencyCode>('XOF');

    useEffect(() => {
        const savedCurrency = localStorage.getItem('currency') as CurrencyCode;
        if (savedCurrency && AVAILABLE_CURRENCIES.find(c => c.code === savedCurrency)) {
            setCurrencyState(savedCurrency);
        }
    }, []);

    const setCurrency = (code: CurrencyCode) => {
        setCurrencyState(code);
        localStorage.setItem('currency', code);
    };

    const currentCurrency = AVAILABLE_CURRENCIES.find(c => c.code === currency) || AVAILABLE_CURRENCIES[0];

    const convertAmount = (amount: number) => {
        return amount * currentCurrency.rate;
    };

    const formatCurrency = (amount: number) => {
        const converted = convertAmount(amount);

        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: currency === 'XOF' ? 0 : 2,
            maximumFractionDigits: currency === 'XOF' ? 0 : 2,
        }).format(converted);
    };

    return (
        <CurrencyContext.Provider value={{
            currency,
            setCurrency,
            formatCurrency,
            convertAmount,
            availableCurrencies: AVAILABLE_CURRENCIES
        }}>
            {children}
        </CurrencyContext.Provider>
    );
};

export const useCurrency = () => {
    const context = useContext(CurrencyContext);
    if (context === undefined) {
        throw new Error('useCurrency must be used within a CurrencyProvider');
    }
    return context;
};
