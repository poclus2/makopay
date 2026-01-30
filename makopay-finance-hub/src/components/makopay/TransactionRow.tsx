import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownLeft, ShoppingBag, TrendingUp, Users, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCurrency } from '@/contexts/CurrencyContext';

interface TransactionRowProps {
  type: 'deposit' | 'withdrawal' | 'purchase' | 'investment' | 'commission';
  description: string;
  reference: string;
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  date: string;
  isCredit?: boolean;
  currency?: string;
}

const iconMap = {
  deposit: ArrowDownLeft,
  withdrawal: ArrowUpRight,
  purchase: ShoppingBag,
  investment: TrendingUp,
  commission: Users,
};

const colorMap = {
  deposit: 'text-primary bg-primary/20',
  withdrawal: 'text-destructive bg-destructive/20',
  purchase: 'text-warning bg-warning/20',
  investment: 'text-secondary bg-secondary/20',
  commission: 'text-primary bg-primary/20',
};

export const TransactionRow = ({
  type = 'deposit',
  description = 'Bank Transfer',
  reference = 'TXN-2024-001',
  amount = 500,
  status = 'completed',
  date = '2 hours ago',
  isCredit,
  currency,
}: TransactionRowProps) => {
  const Icon = iconMap[type];
  const { formatCurrency } = useCurrency();
  const isPositive = isCredit !== undefined ? isCredit : (type === 'deposit' || type === 'commission');

  const formatAmountValue = (val: number) => {
    if (currency === 'XAF' || currency === 'FCFA') {
      return `${new Intl.NumberFormat('fr-FR').format(val)} FCFA`;
    }
    return formatCurrency(val);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      whileTap={{ scale: 0.98 }}
      className="flex items-center gap-3 p-3 rounded-2xl bg-card/30 border border-border/10 hover:border-primary/20 transition-all cursor-pointer"
    >
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', colorMap[type])}>
        <Icon className="w-5 h-5" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-body font-medium text-foreground truncate">{description}</p>
        <div className="flex items-center gap-2 text-xxs text-muted-foreground">
          <span className="truncate">{reference}</span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {date}
          </span>
        </div>
      </div>

      <div className="text-right">
        <p className={cn(
          'text-body font-semibold tabular-nums',
          isPositive ? 'text-primary' : 'text-foreground'
        )}>
          {isPositive ? '+' : '-'}{formatAmountValue(Math.abs(amount))}
        </p>
        <span className={cn(
          'text-xxs font-medium',
          status === 'completed' && 'text-primary',
          status === 'pending' && 'text-warning',
          status === 'failed' && 'text-destructive',
        )}>
          {status === 'completed' ? 'Succès' :
            status === 'pending' ? 'En attente' :
              status === 'failed' ? 'Échec' : status}
        </span>
      </div>
    </motion.div>
  );
};

export default TransactionRow;