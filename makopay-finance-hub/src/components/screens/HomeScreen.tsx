import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useHomeData } from '@/hooks/useHomeData';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Loader2 } from 'lucide-react';
import Header from '../makopay/Header';
import BalanceCard from '../makopay/BalanceCard';
import QuickActions from '../makopay/QuickActions';
import CategoryGrid from '../makopay/CategoryGrid';
import FeaturedDeals from '../makopay/FeaturedDeals';

interface HomeScreenProps {
  onNavigate?: (screen: string) => void;
  onProductClick?: (product: any) => void;
}

export const HomeScreen = ({ onNavigate, onProductClick }: HomeScreenProps) => {
  const { user } = useAuth();
  const { wallet, featuredProducts, loading } = useHomeData();
  const { formatCurrency } = useCurrency();

  // Get user display name
  const getUserName = () => {
    if (user?.firstName) return user.firstName;
    if (user?.lastName) return user.lastName;
    if (user?.email) return user.email.split('@')[0];
    if (user?.phoneNumber) return user.phoneNumber;
    return 'User';
  };

  // Get wallet balance as number
  const getBalance = () => {
    return wallet ? Number(wallet.balance) : 0;
  };

  // Calculate percentage change from last month
  const getPercentChange = () => {
    if (!wallet || !wallet.ledger || wallet.ledger.length === 0) {
      return 0;
    }

    // Simple calculation: sum of positive entries in last 30 days vs previous 30 days
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const recentGains = wallet.ledger
      .filter(entry => {
        const date = new Date(entry.createdAt);
        return date >= thirtyDaysAgo && Number(entry.amount) > 0;
      })
      .reduce((sum, entry) => sum + Number(entry.amount), 0);

    const previousGains = wallet.ledger
      .filter(entry => {
        const date = new Date(entry.createdAt);
        return date >= sixtyDaysAgo && date < thirtyDaysAgo && Number(entry.amount) > 0;
      })
      .reduce((sum, entry) => sum + Number(entry.amount), 0);

    if (previousGains === 0) return recentGains > 0 ? 100 : 0;

    return ((recentGains - previousGains) / previousGains) * 100;
  };

  // Map products to featured deals format
  const getFeaturedDeals = () => {
    return featuredProducts.map(product => ({
      id: product.id,
      name: product.name,
      image: product.imageUrl || `https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=200&fit=crop`,
      yield: product.investmentPlan ? Number(product.investmentPlan.yieldPercent) : 0,
      duration: product.investmentPlan ? Math.round(product.investmentPlan.durationDays / 30) : 0,
      price: Number(product.price),
    }));
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen flex items-center justify-center"
      >
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen p-4 safe-top safe-bottom"
      style={{ paddingTop: '2.5rem' }}
    >
      <Header
        userName={getUserName()}
        isVerified={user?.kycStatus === 'VERIFIED'}
        onProfileClick={() => onNavigate?.('profile')}
      />

      <div className="space-y-6">
        <BalanceCard
          balance={Number(wallet?.balance || 0)}
          percentChange={getPercentChange()}
          formatCurrency={formatCurrency}
        />

        <QuickActions onAction={(action) => {
          if (action === 'invest') onNavigate?.('invest');
          if (action === 'cashout') onNavigate?.('withdraw');
          if (action === 'addfunds') onNavigate?.('addfunds');
        }} />

        <CategoryGrid onCategoryClick={(id) => onNavigate?.(id)} />

        <FeaturedDeals
          deals={getFeaturedDeals()}
          onViewAll={() => onNavigate?.('shop')}
          onDealClick={(dealId) => {
            // Find full product object
            const product = featuredProducts.find(p => p.id === dealId);
            if (product && onProductClick) {
              onProductClick(product);
            } else {
              // Fallback to generic shop if no handler
              onNavigate?.('shop');
            }
          }}
        />
      </div>
    </motion.div>
  );
};

export default HomeScreen;