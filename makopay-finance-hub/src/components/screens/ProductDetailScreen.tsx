import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { ArrowLeft, Heart, Share2, Clock, Percent, ShoppingCart, Star, Shield, Truck, Check, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '@/contexts/CurrencyContext';
import GlassCard from '../makopay/GlassCard';

interface ProductDetailScreenProps {
  onBack: () => void;
  onCheckout: (product: Product, quantity: number) => void;
  productId?: string;
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
    id: string;
    name: string;
    yieldPercent: string;
    durationDays: number;
    minAmount: string;
    payoutFrequency: string;
  };
}

export const ProductDetailScreen = ({ onBack, onCheckout, productId }: ProductDetailScreenProps) => {
  const { t } = useTranslation();
  const { formatCurrency } = useCurrency();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/products/${productId}`);
      setProduct(data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('errors.fetchFailed'));
      onBack();
    } finally {
      setLoading(false);
    }
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

  if (!product) {
    return null;
  }

  const getProductImage = () => {
    return product.imageUrl || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop';
  };

  const getYieldPercent = () => {
    return product.investmentPlan ? parseFloat(product.investmentPlan.yieldPercent) : 0;
  };

  const getDurationMonths = () => {
    return product.investmentPlan ? Math.round(product.investmentPlan.durationDays / 30) : 0;
  };

  const totalYield = product.investmentPlan
    ? Number(product.price) * (getYieldPercent() / 100) * getDurationMonths()
    : 0;

  const features = [
    { icon: Shield, label: t('product.securedInvestment'), description: t('product.capitalProtected') },
    { icon: Truck, label: t('product.freeDelivery'), description: t('product.shippedToAddress') },
    { icon: Clock, label: t('product.regularPayouts'), description: product.investmentPlan ? t(`product.payoutFrequency.${product.investmentPlan.payoutFrequency}`) : 'N/A' },
  ];

  const handleBuyNow = () => {
    if (product.stock === 0) {
      toast.error(t('product.outOfStock'));
      return;
    }
    onCheckout(product, quantity);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="min-h-screen safe-top safe-bottom"
    >
      {/* Hero Image */}
      <div className="relative h-80 overflow-hidden">
        <img
          src={getProductImage()}
          alt={product.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />

        {/* Header Overlay */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full glass-card flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFavorite(!isFavorite)}
              className="w-10 h-10 rounded-full glass-card flex items-center justify-center"
            >
              <Heart className={`w-5 h-5 ${isFavorite ? 'fill-destructive text-destructive' : 'text-foreground'}`} />
            </button>
            <button className="w-10 h-10 rounded-full glass-card flex items-center justify-center">
              <Share2 className="w-5 h-5 text-foreground" />
            </button>
          </div>
        </div>

        {/* Badges */}
        {product.investmentPlan && (
          <div className="absolute bottom-4 left-4 flex gap-2">
            <span className="badge-active flex items-center gap-1">
              <Percent className="w-3 h-3" />
              {getYieldPercent()}% {t('product.yield')}
            </span>
            <span className="badge-pending flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {getDurationMonths()} {t('product.months')}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 -mt-6 relative z-10">
        {/* Title & Price */}
        <GlassCard variant="solid" className="mb-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h1 className="text-title text-foreground mb-1">{product.name}</h1>
              <div className="flex items-center gap-2">
                <span className="text-caption text-muted-foreground">SKU: {product.sku}</span>
                {product.stock > 0 && (
                  <span className="text-caption text-primary">• {product.stock} {t('product.inStock')}</span>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-title font-bold text-primary tabular-nums">{formatCurrency(Number(product.price))}</p>
              <p className="text-caption text-muted-foreground">{t('product.perUnit')}</p>
            </div>
          </div>

          <p className="text-body text-muted-foreground mb-4">
            {product.description || t('product.defaultDescription')}
          </p>

          {/* Investment Calculator */}
          {product.investmentPlan && (
            <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-caption text-muted-foreground">{t('product.estimatedEarnings')}</span>
                <span className="text-headline font-bold text-primary tabular-nums glow-text">
                  {formatCurrency(totalYield)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xxs text-muted-foreground">
                <Check className="w-3 h-3 text-primary" />
                <span>{t('product.overDuration', { months: getDurationMonths(), yield: getYieldPercent() })}</span>
              </div>
            </div>
          )}
        </GlassCard>

        {/* Quantity Selector */}
        <GlassCard className="mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-body font-semibold text-foreground">{t('product.quantity')}</p>
              <p className="text-caption text-muted-foreground">{t('product.selectUnits')}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 rounded-full glass-card flex items-center justify-center text-foreground hover:bg-muted/50 transition-colors"
              >
                -
              </button>
              <span className="text-headline font-bold text-foreground tabular-nums w-8 text-center">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                disabled={quantity >= product.stock}
                className="w-10 h-10 rounded-full glass-card flex items-center justify-center text-foreground hover:bg-muted/50 transition-colors disabled:opacity-50"
              >
                +
              </button>
            </div>
          </div>
        </GlassCard>

        {/* Features */}
        <div className="mb-6 space-y-3">
          {features.map((feature, index) => (
            <motion.div
              key={feature.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
            >
              <GlassCard className="flex items-center gap-4 py-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-body font-semibold text-foreground">{feature.label}</p>
                  <p className="text-caption text-muted-foreground">{feature.description}</p>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        {/* Bottom Actions */}
        <div className="flex gap-3 pb-24">
          <div className="flex-1">
            <p className="text-caption text-muted-foreground mb-1">Total</p>
            <p className="text-title font-bold text-foreground tabular-nums">
              {formatCurrency(Number(product.price) * quantity)}
            </p>
          </div>
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleBuyNow}
            disabled={product.stock === 0}
            className={`flex-1 btn-primary flex items-center justify-center gap-2 ${product.stock === 0 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
          >
            <ShoppingCart className="w-5 h-5" />
            {product.stock > 0 ? t('product.investNow') : t('product.outOfStock')}
          </motion.button>
        </div>

        {/* Security Badge */}
        <div className="flex items-center justify-center gap-2 text-caption text-muted-foreground pb-4">
          <Shield className="w-4 h-4 text-primary" />
          <span>{t('product.securedByMakoPay')}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductDetailScreen;
