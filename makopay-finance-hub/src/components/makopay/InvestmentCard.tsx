import { motion } from 'framer-motion';
import { Clock, TrendingUp, ChevronRight, HelpCircle } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import GlassCard from './GlassCard';

interface InvestmentCardProps {
  name: string;
  plan: string;
  status: 'active' | 'pending' | 'completed';
  amount: number;
  yield: number;
  duration: number;
  progress: number;
  nextPayout: string;
}

export const InvestmentCard = ({
  name = 'Premium Coffee Kit',
  plan = 'Growth Plan',
  status = 'active',
  amount = 500,
  yield: yieldPercent = 8.5,
  duration = 6,
  progress = 65,
  nextPayout = '3d 14h',
}: InvestmentCardProps) => {
  const { formatCurrency } = useCurrency();
  const statusBadge = {
    active: 'badge-active',
    pending: 'badge-pending',
    completed: 'badge-completed',
  };

  const segments = 5;

  return (
    <GlassCard variant="solid" className="group cursor-pointer hover:border-primary/30 transition-all">
      <div className="flex items-start justify-between mb-3">
        {/* ... (previous code remains effectively the same, just keeping context) */}
        <div>
          <h4 className="text-body font-semibold text-foreground mb-1">{name}</h4>
          <p className="text-caption text-muted-foreground">{plan}</p>
        </div>
        <span className={statusBadge[status]}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center">
          <p className="text-xxs text-muted-foreground mb-1">Amount</p>
          <p className="text-body font-semibold text-foreground tabular-nums">{formatCurrency(amount)}</p>
        </div>
        <div className="text-center border-x border-border/30">
          <p className="text-xxs text-muted-foreground mb-1">Yield</p>
          <p className="text-body font-semibold text-primary tabular-nums">{yieldPercent}%</p>
        </div>
        <div className="text-center">
          <p className="text-xxs text-muted-foreground mb-1">Duration</p>
          <p className="text-body font-semibold text-foreground">{duration}mo</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xxs text-muted-foreground">Progress</span>
          <span className="text-xxs text-primary font-semibold">{progress}%</span>
        </div>
        <div className="flex gap-1 h-2 w-full">
          {Array.from({ length: segments }).map((_, i) => {
            // Calculate fill for this segment (0-20% of total -> 0-100% of segment)
            const segmentValue = 100 / segments; // 20
            const segmentMin = i * segmentValue; // 0, 20, 40, 60, 80
            const segmentMax = (i + 1) * segmentValue; // 20, 40, 60, 80, 100

            let fillPercentage = 0;
            if (progress >= segmentMax) {
              fillPercentage = 100;
            } else if (progress > segmentMin) {
              fillPercentage = ((progress - segmentMin) / segmentValue) * 100;
            }

            return (
              <div key={i} className="flex-1 bg-secondary/20 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${fillPercentage}%` }}
                  transition={{ duration: 1, ease: 'easeOut', delay: i * 0.1 }}
                  className="h-full bg-primary rounded-full"
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Next Payout */}
      <div className="flex items-center justify-between pt-3 border-t border-border/30">
        <div className="flex items-center gap-2 text-caption text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span>Next payout: <strong className="text-foreground">{nextPayout}</strong></span>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-1 rounded-full hover:bg-muted/50 transition-colors">
            <HelpCircle className="w-4 h-4 text-muted-foreground" />
          </button>
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
      </div>
    </GlassCard>
  );
};

export default InvestmentCard;