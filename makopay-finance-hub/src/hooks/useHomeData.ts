import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface Product {
    id: string;
    name: string;
    price: string;
    description?: string;
    imageUrl?: string;
    createdAt: string;
    investmentPlan?: {
        id: string;
        yieldPercent: string;
        durationDays: number;
    };
}

interface WalletData {
    balance: string;
    ledger: Array<{
        amount: string;
        createdAt: string;
    }>;
}

interface HomeData {
    wallet: WalletData | null;
    featuredProducts: Product[];
    loading: boolean;
    error: string | null;
}

export const useHomeData = (): HomeData => {
    const [wallet, setWallet] = useState<WalletData | null>(null);
    const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchHomeData();
    }, []);

    const fetchHomeData = async () => {
        setLoading(true);
        setError(null);

        try {
            // Fetch wallet and products in parallel
            const [walletResponse, productsResponse] = await Promise.all([
                api.get('/wallet').catch(() => ({ data: null })), // Graceful fallback
                api.get('/products'),
            ]);

            setWallet(walletResponse.data);

            // Filter products sorted by date desc, and limit to 3
            // We include all products (even without plans) to avoid empty list falling back to demo data
            const latestProducts = productsResponse.data
                .sort((a: Product, b: Product) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, 3);

            setFeaturedProducts(latestProducts);
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || 'Failed to load dashboard data';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return {
        wallet,
        featuredProducts,
        loading,
        error,
    };
};
