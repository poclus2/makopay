import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Search, Clock, Percent, Eye, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '@/contexts/CurrencyContext';
import GlassCard from '../makopay/GlassCard';
import { FilterSheet } from '../makopay/FilterSheet';

interface ShopScreenProps {
  onProductClick?: (product: Product) => void;
  initialPlanId?: string;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  sku: string;
  stock: number;
  imageUrl: string | null;
  isCommissionable: boolean;
  investmentPlanId: string | null;
  investmentPlan?: {
    name: string;
    yieldPercent: string;
    durationDays: number;
  };
}

export const ShopScreen = ({ onProductClick, initialPlanId }: ShopScreenProps) => {
  const { t } = useTranslation();
  const { formatCurrency } = useCurrency();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter State
  const [plans, setPlans] = useState<Array<{ id: string; name: string }>>([]);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(10000); // Default max, will adjust based on products
  const [selectedMinPrice, setSelectedMinPrice] = useState(0);
  const [selectedMaxPrice, setSelectedMaxPrice] = useState(10000);
  const [selectedPlanId, setSelectedPlanId] = useState<string | undefined>(initialPlanId);

  useEffect(() => {
    fetchPlans();
    // If initialPlanId is provided, we use it for the first fetch, 
    // but we also need to sync state if prop changes (though navigation usually resets)
    if (initialPlanId) {
      setSelectedPlanId(initialPlanId);
      fetchProducts({ min: 0, max: 10000, planId: initialPlanId });
    } else {
      fetchProducts();
    }
  }, [initialPlanId]);

  const fetchPlans = async () => {
    try {
      const { data } = await api.get('/investments/plans');
      setPlans(data);
    } catch (error) {
      console.error('Failed to fetch plans', error);
    }
  };

  const fetchProducts = async (filters?: { min: number, max: number, planId?: string }) => {
    setLoading(true);
    try {
      const params: any = {};
      if (filters) {
        params.minPrice = filters.min;
        params.maxPrice = filters.max;
        if (filters.planId) params.planId = filters.planId;
      }

      const { data } = await api.get('/products', { params });
      setProducts(data);

      // Adjust max price range based on loaded products if it's the first load
      if (!filters && data.length > 0) {
        const highestPrice = Math.max(...data.map((p: Product) => Number(p.price)));
        const newMax = Math.ceil(highestPrice / 100) * 100 + 100; // Round up to nearest 100 + buffer
        setMaxPrice(newMax);
        setSelectedMaxPrice(newMax);
      }

    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = () => {
    fetchProducts({
      min: selectedMinPrice,
      max: selectedMaxPrice,
      planId: selectedPlanId
    });
  };

  const handleResetFilters = () => {
    setSelectedMinPrice(0);
    setSelectedMaxPrice(maxPrice);
    setSelectedPlanId(undefined);
    fetchProducts();
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getProductImage = (product: Product) => {
    return product.imageUrl || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop';
  };

  const getYieldPercent = (product: Product) => {
    if (product.investmentPlan) {
      return parseFloat(product.investmentPlan.yieldPercent);
    }
    return 0;
  };

  const getDurationMonths = (product: Product) => {
    if (product.investmentPlan) {
      return Math.round(product.investmentPlan.durationDays / 30);
    }
    return 0;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="min-h-screen p-4 safe-top safe-bottom"
      style={{ paddingTop: '2.5rem' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-title text-foreground">{t('shop.title')}</h1>
        </div>
        <FilterSheet
          minPrice={minPrice}
          maxPrice={maxPrice}
          plans={plans}
          selectedMinPrice={selectedMinPrice}
          selectedMaxPrice={selectedMaxPrice}
          selectedPlanId={selectedPlanId}
          onPriceChange={(value) => {
            setSelectedMinPrice(value[0]);
            setSelectedMaxPrice(value[1]);
          }}
          onPlanChange={setSelectedPlanId}
          onReset={handleResetFilters}
          onApply={handleApplyFilters}
        />
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('shop.searchProducts')}
          className="w-full pl-12 pr-4 py-3 rounded-2xl bg-card/60 border border-border/20 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 transition-colors"
        />
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredProducts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-muted/30 flex items-center justify-center mb-4">
            <Search className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-body text-muted-foreground text-center">
            {searchQuery ? t('shop.noProductsFound', 'No products found') : t('shop.noProductsAvailable', 'No products available')}
          </p>
        </div>
      )}

      {/* Products Grid */}
      {!loading && filteredProducts.length > 0 && (
        <div className="grid grid-cols-2 gap-3 pb-24">
          {filteredProducts.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + index * 0.05 }}
              onClick={() => onProductClick?.(product)}
              className="cursor-pointer"
            >
              <GlassCard className="p-0 overflow-hidden group">
                <div className="relative aspect-square overflow-hidden">
                  <img
                    src={getProductImage(product)}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/30 to-transparent" />

                  {/* Badges */}
                  {product.investmentPlan && (
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      <span className="badge-active text-xxs flex items-center gap-1">
                        <Percent className="w-3 h-3" />
                        {getYieldPercent(product)}%
                      </span>
                      <span className="badge-pending text-xxs flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {getDurationMonths(product)}mo
                      </span>
                    </div>
                  )}

                  {/* Stock Badge */}
                  {product.stock === 0 && (
                    <div className="absolute top-2 right-2">
                      <span className="px-2 py-1 rounded-full text-xxs font-medium bg-destructive/20 text-destructive border border-destructive/30">
                        {t('shop.outOfStock')}
                      </span>
                    </div>
                  )}

                  {/* View Button */}
                  <motion.div
                    whileTap={{ scale: 0.9 }}
                    className="absolute bottom-2 right-2 w-8 h-8 rounded-full gradient-primary flex items-center justify-center shadow-glow"
                  >
                    <Eye className="w-4 h-4 text-primary-foreground" />
                  </motion.div>
                </div>

                <div className="p-3">
                  <h4 className="text-caption font-semibold text-foreground mb-1 truncate">{product.name}</h4>
                  <p className="text-headline text-primary font-bold tabular-nums">{formatCurrency(Number(product.price))}</p>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default ShopScreen;