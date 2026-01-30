import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { ArrowLeft, CreditCard, Check, Loader2, ShoppingBag, Banknote } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '@/contexts/CurrencyContext';
import GlassCard from '../makopay/GlassCard';

interface CheckoutScreenProps {
  onBack: () => void;
  onComplete: (orderId: string) => void;
  product?: {
    id: string;
    name: string;
    price: number;
    imageUrl: string | null;
  };
  quantity?: number;
}

export const CheckoutScreen = ({ onBack, onComplete, product, quantity = 1 }: CheckoutScreenProps) => {
  const { t } = useTranslation();
  const { formatCurrency } = useCurrency();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'wallet'>('wallet');
  const [balance, setBalance] = useState(0);
  const [loadingBalance, setLoadingBalance] = useState(true);

  useEffect(() => {
    fetchWalletBalance();
  }, []);

  const fetchWalletBalance = async () => {
    try {
      const { data } = await api.get('/wallet');
      setBalance(Number(data.balance));
    } catch (error) {
      console.error('Failed to fetch wallet balance', error);
    } finally {
      setLoadingBalance(false);
    }
  };

  if (!product) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen p-4 flex items-center justify-center"
      >
        <div className="text-center">
          <p className="text-body text-muted-foreground">No product selected</p>
          <button onClick={onBack} className="btn-secondary mt-4">
            Go Back
          </button>
        </div>
      </motion.div>
    );
  }

  const total = Number(product.price) * quantity;
  const processingFee = total * 0.03; // 3% processing fee
  const finalTotal = total + processingFee;

  const handleCheckout = async () => {
    setIsProcessing(true);

    if (paymentMethod === 'wallet' && balance < finalTotal) {
      toast.error(t('errors.insufficientBalance') || 'Insufficient balance');
      setIsProcessing(false);
      return;
    }

    try {
      // Step 1: Create order
      const { data: order } = await api.post('/orders', {
        items: [{
          productId: product.id,
          quantity: quantity,
        }]
      });

      toast.success(t('checkout.orderCreated') || 'Order created successfully!');

      // Step 2: Simulate payment
      // If paying with Wallet, backend handles it via /pay? Or does /pay endpoint check balance?
      // Assuming /pay endpoint handles wallet deduction if configured.
      // Currently backend processes payment.
      await api.post(`/orders/${order.id}/pay`);

      toast.success(t('checkout.paymentSuccessful') || 'Payment successful! 🎉');

      // Navigate to success/orders
      onComplete(order.id);
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('errors.checkoutFailed') || 'Checkout failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const getProductImage = () => {
    return product.imageUrl || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop';
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="min-h-screen p-4 safe-top safe-bottom"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          disabled={isProcessing}
          className="w-10 h-10 rounded-full glass-card flex items-center justify-center disabled:opacity-50"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-title text-foreground">{t('checkout.title') || 'Checkout'}</h1>
      </div>

      {/* Order Summary */}
      <GlassCard variant="solid" className="mb-4">
        <h3 className="text-body font-semibold text-foreground mb-3">{t('checkout.orderSummary') || 'Order Summary'}</h3>
        <div className="flex gap-3 mb-4">
          <img
            src={getProductImage()}
            alt={product.name}
            className="w-20 h-20 rounded-xl object-cover"
          />
          <div className="flex-1">
            <h4 className="text-body font-semibold text-foreground mb-1">{product.name}</h4>
            <p className="text-caption text-muted-foreground">{t('product.quantity')}: {quantity}</p>
            <p className="text-body text-primary font-bold mt-1">{formatCurrency(Number(product.price))} × {quantity}</p>
          </div>
        </div>

        <div className="space-y-2 pt-3 border-t border-border/20">
          <div className="flex items-center justify-between text-body">
            <span className="text-muted-foreground">{t('checkout.subtotal') || 'Subtotal'}</span>
            <span className="text-foreground tabular-nums">{formatCurrency(total)}</span>
          </div>
          <div className="flex items-center justify-between text-body">
            <span className="text-muted-foreground">{t('checkout.processingFee') || 'Processing Fee'} (3%)</span>
            <span className="text-foreground tabular-nums">{formatCurrency(processingFee)}</span>
          </div>
          <div className="flex items-center justify-between text-headline pt-2 border-t border-border/20">
            <span className="text-foreground font-semibold">{t('checkout.total') || 'Total'}</span>
            <span className="text-primary font-bold tabular-nums">{formatCurrency(finalTotal)}</span>
          </div>
        </div>
      </GlassCard>

      {/* Payment Method */}
      <GlassCard className="mb-6">
        <h3 className="text-body font-semibold text-foreground mb-3">{t('checkout.paymentMethod') || 'Payment Method'}</h3>
        <div className="space-y-2">
          {/* Credit Card - Disabled */}
          <button
            disabled={true}
            className={`w-full p-3 rounded-xl border-2 transition-colors flex items-center gap-3 border-border/20 bg-muted/20 opacity-50 cursor-not-allowed`}
          >
            <CreditCard className="w-5 h-5 text-muted-foreground" />
            <div className="text-left">
              <span className="text-body text-muted-foreground block">
                Credit Card
              </span>
              <span className="text-xxs text-muted-foreground">
                {t('common.comingSoon') || 'Coming Soon'}
              </span>
            </div>
          </button>

          {/* MakoPay Wallet - Enabled */}
          <button
            onClick={() => setPaymentMethod('wallet')}
            className={`w-full p-3 rounded-xl border-2 transition-colors flex items-center gap-3 ${paymentMethod === 'wallet'
              ? 'border-primary bg-primary/10'
              : 'border-border/20 bg-transparent'
              }`}
          >
            <Banknote className={`w-5 h-5 ${paymentMethod === 'wallet' ? 'text-primary' : 'text-muted-foreground'}`} />
            <div className="flex-1 text-left">
              <span className={`text-body block ${paymentMethod === 'wallet' ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}>
                MakoPay Wallet
              </span>
              <span className="text-xs text-muted-foreground">
                {t('wallet.available')}: {loadingBalance ? '...' : formatCurrency(balance)}
              </span>
            </div>
            {paymentMethod === 'wallet' && <Check className="w-5 h-5 text-primary ml-auto" />}
          </button>
        </div>
      </GlassCard>

      {/* Notice */}
      <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 mb-6">
        <p className="text-caption text-primary text-center flex items-center justify-center gap-2">
          <ShoppingBag className="w-4 h-4" />
          {t('checkout.demoNotice') || 'This is a demo payment. No real charges will be made.'}
        </p>
      </div>

      {/* Checkout Button */}
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={handleCheckout}
        disabled={isProcessing}
        className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            {t('common.processing') || 'Processing...'}
          </>
        ) : (
          <>
            <Check className="w-5 h-5" />
            {t('checkout.completePurchase') || 'Complete Purchase'} - {formatCurrency(finalTotal)}
          </>
        )}
      </motion.button>

      <p className="text-caption text-muted-foreground text-center mt-4">
        {t('checkout.termsNotice') || 'By completing this purchase, you agree to our Terms of Service'}
      </p>
    </motion.div>
  );
};

export default CheckoutScreen;