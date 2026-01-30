import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Eye, EyeOff, ArrowUpRight, ArrowDownLeft, Clock, Loader2, Search } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '@/contexts/CurrencyContext';
import TransactionRow from '../makopay/TransactionRow';
import GlassCard from '../makopay/GlassCard';

interface WalletScreenProps {
  onWithdraw?: () => void;
  onAddFunds?: () => void;
  onTransactionClick?: (transaction: any) => void;
}

interface WalletLedgerEntry {
  id: string;
  walletId: string;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'COMMISSION' | 'PAYOUT' | 'PURCHASE';
  source: 'INVESTMENT_PAYOUT' | 'MLM_COMMISSION' | 'WITHDRAWAL' | 'MANUAL' | 'ORDER_PAYMENT';
  amount: string;
  reference: string;
  balanceAfter: string;
  status: string;
  createdAt: string;
}

interface Wallet {
  id: string;
  userId: string;
  balance: string;
  createdAt: string;
  updatedAt: string;
  ledger: WalletLedgerEntry[];
  pendingDeposits?: {
    id: string;
    amount: string;
    referenceCode: string;
    createdAt: string;
    status: string;
    currency: string;
    payerPhoneNumber?: string;
  }[];
}

export const WalletScreen = ({ onWithdraw, onAddFunds, onTransactionClick }: WalletScreenProps) => {
  const { t } = useTranslation();
  const { formatCurrency } = useCurrency();
  const [isHidden, setIsHidden] = useState(false);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWallet();
  }, []);

  const fetchWallet = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/wallet');
      setWallet(data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load wallet');
    } finally {
      setLoading(false);
    }
  };

  const getBalance = () => {
    return wallet ? Number(wallet.balance) : 0;
  };

  const getPendingBalance = () => {
    let total = 0;

    // Add pending deposits (normalize to EUR)
    if (wallet?.pendingDeposits) {
      total += wallet.pendingDeposits.reduce((sum, dep) => {
        let amount = Number(dep.amount);
        if (dep.currency === 'XAF' || dep.currency === 'XOF') { // Handle CFA
          amount = amount / 655.957;
        }
        return sum + amount;
      }, 0);
    }

    // Only sum pending deposits. Ledger withdrawals are final deductions.

    return total;
  };

  const mapLedgerToTransaction = (entry: WalletLedgerEntry) => {
    const amount = Math.abs(Number(entry.amount));
    const isCredit = Number(entry.amount) > 0;

    // Map status from backend (default to completed if missing)
    const status = entry.status ? (entry.status.toLowerCase() as 'completed' | 'pending' | 'failed') : 'completed';

    let type: 'commission' | 'withdrawal' | 'investment' | 'deposit';
    let description: string;

    switch (entry.source) {
      case 'MLM_COMMISSION':
        type = 'commission';
        description = 'Commission Réseau';
        break;
      case 'INVESTMENT_PAYOUT':
        type = 'investment';
        description = 'Gain Investissement';
        break;
      case 'WITHDRAWAL':
        type = 'withdrawal';
        description = 'Retrait';
        break;
      case 'ORDER_PAYMENT':
        type = 'investment';
        description = 'Achat Produit';
        break;
      default:
        type = 'deposit';
        // If source starts with DEPOSIT, handle it
        description = entry.type === 'DEPOSIT' ? 'Dépôt' : entry.type;
    }

    return {
      type,
      description,
      reference: entry.reference,
      amount,
      status,
      date: new Date(entry.createdAt).toLocaleDateString(),
      isCredit,
    };
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

  const balance = getBalance();
  const pending = getPendingBalance();
  const hasTransactions = (wallet?.ledger && wallet.ledger.length > 0) || (wallet?.pendingDeposits && wallet.pendingDeposits.length > 0);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="min-h-screen p-4 safe-top safe-bottom"
      style={{ paddingTop: '2.5rem' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-title text-foreground">{t('wallet.title')}</h1>
        <button
          onClick={() => setIsHidden(!isHidden)}
          className="w-10 h-10 rounded-full glass-card flex items-center justify-center"
        >
          {isHidden ? (
            <EyeOff className="w-5 h-5 text-foreground" />
          ) : (
            <Eye className="w-5 h-5 text-foreground" />
          )}
        </button>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <GlassCard variant="solid" glow>
            <p className="text-caption text-muted-foreground mb-1">{t('wallet.available')}</p>
            <p className="text-title font-bold text-foreground tabular-nums glow-text">
              {isHidden ? '••••••' : formatCurrency(balance)}
            </p>
          </GlassCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <GlassCard>
            <p className="text-caption text-muted-foreground mb-1">{t('wallet.pending')}</p>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-warning" />
              <p className="text-title font-bold text-warning tabular-nums">
                {isHidden ? '••••' : formatCurrency(pending)}
              </p>
            </div>
          </GlassCard>
        </motion.div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mb-6">
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          whileTap={{ scale: 0.95 }}
          onClick={onAddFunds}
          className="flex-1 btn-primary flex items-center justify-center gap-2"
        >
          <ArrowDownLeft className="w-5 h-5" />
          {t('wallet.addFunds')}
        </motion.button>
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          whileTap={{ scale: 0.95 }}
          onClick={onWithdraw}
          className="flex-1 btn-secondary flex items-center justify-center gap-2"
        >
          <ArrowUpRight className="w-5 h-5" />
          {t('wallet.withdraw')}
        </motion.button>
      </div>

      {/* Transaction History */}
      <div className="space-y-4 pb-24">
        <div className="flex items-center justify-between">
          <h2 className="text-headline text-foreground">{t('wallet.recentTransactions')}</h2>
        </div>

        {!hasTransactions ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-muted/30 flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-body text-muted-foreground text-center">
              {t('wallet.noTransactions')}
            </p>
            <p className="text-caption text-muted-foreground text-center mt-2">
              Your transaction history will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Pending Deposits */}
            {wallet.pendingDeposits?.map((deposit) => {
              const transactionData = {
                type: 'deposit' as const,
                description: 'Dépôt (En attente)',
                reference: deposit.referenceCode,
                amount: Number(deposit.amount),
                status: 'pending' as const,
                date: new Date(deposit.createdAt).toLocaleDateString(),
                isCredit: true,
                currency: deposit.currency,
                phoneNumber: deposit.payerPhoneNumber,
              };
              return (
                <motion.div
                  key={deposit.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => onTransactionClick?.(transactionData)}
                >
                  <TransactionRow
                    {...transactionData}
                  />
                </motion.div>
              )
            })}

            {/* Completed Transactions */}
            {wallet.ledger.map((entry, index) => {
              const transactionData = mapLedgerToTransaction(entry);
              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  onClick={() => onTransactionClick?.(transactionData)}
                >
                  <TransactionRow {...transactionData} />
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default WalletScreen;