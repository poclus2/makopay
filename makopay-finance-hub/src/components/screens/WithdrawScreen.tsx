import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { ArrowLeft, Banknote, AlertCircle, Lock, Loader2, Check, X, Smartphone, Building2, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '@/contexts/CurrencyContext';
import GlassCard from '../makopay/GlassCard';

interface WithdrawScreenProps {
  onBack: () => void;
  onComplete: () => void;
  availableBalance?: number;
}

const mobileOperators = [
  {
    id: 'orange',
    name: 'Orange Money',
    color: '#FF7900',
    logo: Smartphone
  },
  {
    id: 'mtn',
    name: 'MTN Mobile Money',
    color: '#FFCC00',
    logo: Smartphone
  }
];

export const WithdrawScreen = ({ onBack, onComplete, availableBalance = 0 }: WithdrawScreenProps) => {
  const { t } = useTranslation();
  const { formatCurrency, availableCurrencies, currency } = useCurrency();
  const rate = availableCurrencies.find(c => c.code === currency)?.rate || 1;

  const [amount, setAmount] = useState(0);
  // balance state is not strictly needed if we use availableBalance prop re-calculation, 
  // but let's keep it for local updates if needed.
  // We will store balance in DISPLAY currency for easier comparisons.
  const [balance, setBalance] = useState(availableBalance * rate);
  const [withdrawalFeePercent, setWithdrawalFeePercent] = useState(1.5); // Default, updated from API

  // Payment Method State
  const [selectedMethod, setSelectedMethod] = useState<'mobile' | 'bank'>('mobile');
  const [selectedOperator, setSelectedOperator] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [iban, setIban] = useState('');

  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (availableBalance > 0) {
      setBalance(availableBalance * rate);
    } else {
      fetchWalletBalance();
    }
    fetchFees();
  }, [availableBalance, rate]);

  const fetchFees = async () => {
    try {
      const { data } = await api.get('/settings/fees');
      if (data && data.withdrawalFeePercent !== undefined) {
        setWithdrawalFeePercent(Number(data.withdrawalFeePercent));
      }
    } catch (error) {
      console.error('Failed to fetch fees', error);
    }
  };

  const fetchWalletBalance = async () => {
    try {
      const { data } = await api.get('/wallet');
      if (data && data.balance) {
        // data.balance is EUR
        const fetchedBalance = Number(data.balance);
        setBalance(fetchedBalance * rate);
      }
    } catch (error) {
      console.error('Failed to fetch balance', error);
      toast.error(t('errors.somethingWentWrong'));
    }
  };

  const minWithdraw = 10000; // Display units
  const maxWithdraw = balance; // Display units
  const fee = amount * (withdrawalFeePercent / 100);

  const quickAmounts = [10000, 25000, 40000, 100000, 200000, 500000];

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleConfirmWithdraw = () => {
    if (amount < minWithdraw || amount > maxWithdraw) {
      toast.error(`${t('withdraw.errorCheck')} (Min ${formatCurrency(minWithdraw / rate)})`);
      return;
    }

    if (selectedMethod === 'mobile') {
      if (!selectedOperator) {
        toast.error('Veuillez sélectionner un opérateur');
        return;
      }
      if (!phoneNumber || phoneNumber.length < 9) {
        toast.error('Numéro de téléphone invalide');
        return;
      }
    } else if (selectedMethod === 'bank') {
      if (!iban || iban.length < 10) {
        toast.error('IBAN invalide');
        return;
      }
    }

    setShowOtp(true);
  };

  const handleVerifyOtp = async () => {
    setIsProcessing(true);
    try {
      // Submit withdrawal request to backend
      const details = selectedMethod === 'mobile'
        ? `${selectedOperator?.toUpperCase()} : ${phoneNumber}`
        : `IBAN : ${iban}`;

      // Convert back to base currency (EUR) for API
      const amountInBaseCurrency = amount / rate;

      await api.post('/wallet/withdraw', {
        amount: amountInBaseCurrency,
        method: selectedMethod,
        details
      });

      setIsProcessing(false);
      setIsComplete(true);
      toast.success(t('withdraw.success'));

      setTimeout(onComplete, 2000);
    } catch (error: any) {
      setIsProcessing(false);
      toast.error(error.response?.data?.message || t('withdraw.failed'));
    }
  };

  if (isComplete) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen flex flex-col items-center justify-center p-6 gradient-dark"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
          className="w-24 h-24 rounded-full gradient-primary flex items-center justify-center mb-6 shadow-glow"
        >
          <Check className="w-12 h-12 text-primary-foreground" />
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-title text-foreground text-center mb-2"
        >
          {t('withdraw.initiatedTitle')}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-caption text-muted-foreground text-center"
        >
          {t('withdraw.initiatedMessage')}
        </motion.p>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-4 text-headline text-primary font-bold tabular-nums"
        >
          {formatCurrency((amount - fee) / rate)}
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="min-h-screen p-4 safe-top safe-bottom"
      style={{ paddingTop: '2.5rem' }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="w-10 h-10 rounded-full glass-card flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-title text-foreground">{t('withdraw.title')}</h1>
      </div>

      {/* Balance Display */}
      <GlassCard variant="solid" className="mb-6 text-center">
        <p className="text-caption text-muted-foreground mb-1">{t('withdraw.availableBalance')}</p>
        <p className="text-display font-bold text-foreground tabular-nums glow-text">
          {formatCurrency(balance / rate)}
        </p>
      </GlassCard>

      {/* Amount Slider */}
      <div className="mb-6">
        <h3 className="text-headline text-foreground mb-3">{t('withdraw.amountToWithdraw')}</h3>
        <GlassCard className="space-y-4">
          <div className="text-center relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="text-display font-bold text-primary tabular-nums bg-transparent text-center w-full focus:outline-none focus:border-b border-primary/20"
              placeholder="0"
            />
            <span className="text-sm text-muted-foreground absolute right-4 top-1/2 -translate-y-1/2">{currency === 'XOF' ? 'FCFA' : currency}</span>
          </div>

          <input
            type="range"
            min={minWithdraw}
            max={Math.max(minWithdraw, maxWithdraw)}
            step={100}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, hsl(165, 86%, 56%) ${maxWithdraw > 0 ? (amount / maxWithdraw) * 100 : 0}%, hsl(165, 30%, 20%) ${maxWithdraw > 0 ? (amount / maxWithdraw) * 100 : 0}%)`,
            }}
          />

          <div className="flex items-center justify-between text-caption text-muted-foreground">
            <span>{formatCurrency(minWithdraw / rate)}</span>
            <span>{formatCurrency(maxWithdraw / rate)}</span>
          </div>

          {/* Quick Amount Buttons */}
          <div className="grid grid-cols-3 gap-2">
            {quickAmounts.map((quickAmount) => (
              <button
                key={quickAmount}
                onClick={() => setAmount(Math.min(quickAmount, maxWithdraw))}
                disabled={quickAmount > maxWithdraw}
                className={`flex-1 py-3 rounded-xl text-caption font-medium transition-all disabled:opacity-30 ${amount === quickAmount
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
                  }`}
              >
                {new Intl.NumberFormat('fr-FR').format(quickAmount)} {currency === 'XOF' ? 'F' : currency}
              </button>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Payment Method Selection - ONLY MOBILE */}
      <div className="mb-6">
        <h3 className="text-headline text-foreground mb-3">{t('withdraw.paymentMethod') || "Méthode de retrait"}</h3>
        <div className="py-3 px-4 bg-card rounded-xl border border-primary/20 text-primary font-medium flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            <span>Mobile Money</span>
          </div>
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
        </div>

        <GlassCard className="space-y-4">
          <label className="text-caption text-muted-foreground">Opérateur</label>
          <div className="grid grid-cols-2 gap-3 mb-2">
            {mobileOperators.map((op: any) => (
              <button
                key={op.id}
                onClick={() => setSelectedOperator(op.id)}
                className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${selectedOperator === op.id
                  ? 'bg-card/50 border-primary'
                  : 'bg-transparent border-border/20 hover:bg-card/30'}`}
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center opacity-80" style={{ backgroundColor: op.color }}>
                  <Smartphone className="w-4 h-4 text-white" />
                </div>
                <span className="text-xs font-bold">{op.name}</span>
              </button>
            ))}
          </div>

          <label className="text-caption text-muted-foreground">Numéro de téléphone</label>
          <div className="relative">
            <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="699000000"
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-muted/30 border border-border/20 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>
        </GlassCard>
      </div>

      {/* Fee Preview */}
      <GlassCard className="mb-6 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-body text-muted-foreground">{t('withdraw.amount')}</span>
          <span className="text-body text-foreground tabular-nums">{formatCurrency(amount / rate)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-body text-muted-foreground">{t('withdraw.fee')} ({withdrawalFeePercent}%)</span>
          <span className="text-body text-destructive tabular-nums">-{formatCurrency(fee / rate)}</span>
        </div>
        <div className="border-t border-border/30 pt-3">
          <div className="flex items-center justify-between">
            <span className="text-headline text-foreground">{t('withdraw.youWillReceive')}</span>
            <span className="text-headline text-primary font-bold tabular-nums">{formatCurrency((amount - fee) / rate)}</span>
          </div>
        </div>
      </GlassCard>

      {/* Warning */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-warning/10 border border-warning/20 mb-6">
        <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
        <p className="text-caption text-warning">{t('withdraw.warning')}</p>
      </div>

      {/* Confirm Button */}
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={handleConfirmWithdraw}
        disabled={
          !phoneNumber || !selectedOperator || amount < minWithdraw || amount > maxWithdraw
        }
        className="w-full btn-primary flex items-center justify-center gap-2 py-4 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Lock className="w-4 h-4" />
        {t('withdraw.confirm')}
      </motion.button>

      {/* OTP Modal */}
      <AnimatePresence>
        {showOtp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="w-full max-w-md"
            >
              <GlassCard variant="solid" className="rounded-t-[28px]">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-headline text-foreground">{t('withdraw.verifyOtp')}</h2>
                  <button
                    onClick={() => setShowOtp(false)}
                    className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>

                <p className="text-caption text-muted-foreground mb-6 text-center">
                  {t('withdraw.enterOtp')}
                </p>

                <div className="flex gap-2 justify-center mb-6">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      className="w-12 h-14 rounded-xl bg-muted/30 border border-border/30 text-center text-title text-foreground font-bold focus:outline-none focus:border-primary transition-colors"
                    />
                  ))}
                </div>

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleVerifyOtp}
                  disabled={isProcessing || otp.some(d => !d)}
                  className="w-full btn-primary flex items-center justify-center gap-2 py-4 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      {t('withdraw.verifyAndWithdraw')}
                    </>
                  )}
                </motion.button>

                <button className="w-full text-center text-caption text-primary mt-4 hover:underline">
                  {t('withdraw.resendCode')}
                </button>
              </GlassCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default WithdrawScreen;
