import { motion } from 'framer-motion';
import { ChevronDown, TrendingUp, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import GlassCard from './GlassCard';

interface BalanceCardProps {
  balance: number;
  percentChange?: number;
  formatCurrency?: (amount: number) => string;
}

export const BalanceCard = ({
  balance,
  percentChange = 12.5,
  formatCurrency
}: BalanceCardProps) => {
  const { t } = useTranslation();
  const displayAmount = formatCurrency ? formatCurrency(balance) : `€${balance.toFixed(2)}`;
  const [isHidden, setIsHidden] = useState(false);



  return (
    <GlassCard variant="solid" glow className="relative overflow-hidden">
      {/* Background Glow Effect */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/20 rounded-full blur-3xl" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-secondary/10 rounded-full blur-2xl" />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center gap-2">
          <span className="text-caption text-muted-foreground">{t('dashboard.totalBalance')}</span>
          <button
            onClick={() => setIsHidden(!isHidden)}
            className="p-1 rounded-full hover:bg-primary/10 transition-colors"
          >
            {isHidden ? (
              <EyeOff className="w-4 h-4 text-muted-foreground" />
            ) : (
              <Eye className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
        </div>

      </div>

      {/* Balance Display */}
      <motion.div
        className="mb-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-baseline gap-2">
          <span className="text-display tabular-nums glow-text">
            {isHidden ? '••••••' : displayAmount}
          </span>
        </div>
      </motion.div>

      {/* Trend Indicator */}
      <motion.div
        className="flex items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-primary/20">
          <TrendingUp className="w-3 h-3 text-primary" />
          <span className="text-caption text-primary font-semibold">+{percentChange}%</span>
        </div>
        <span className="text-caption text-muted-foreground">{t('dashboard.vsLastMonth', 'vs last month')}</span>
      </motion.div>

      {/* Mini Sparkline */}
      <motion.div
        className="mt-4 h-12"
        initial={{ opacity: 0, scaleY: 0 }}
        animate={{ opacity: 1, scaleY: 1 }}
        transition={{ delay: 0.5 }}
      >
        <svg viewBox="0 0 200 40" className="w-full h-full">
          <defs>
            <linearGradient id="sparklineGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(165, 86%, 56%)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="hsl(165, 86%, 56%)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M0,35 L20,30 L40,32 L60,25 L80,28 L100,20 L120,22 L140,15 L160,18 L180,10 L200,5"
            fill="none"
            stroke="hsl(165, 86%, 56%)"
            strokeWidth="2"
            className="drop-shadow-[0_0_6px_hsl(165,86%,56%)]"
          />
          <path
            d="M0,35 L20,30 L40,32 L60,25 L80,28 L100,20 L120,22 L140,15 L160,18 L180,10 L200,5 L200,40 L0,40 Z"
            fill="url(#sparklineGradient)"
          />
        </svg>
      </motion.div>
    </GlassCard >
  );
};

export default BalanceCard;