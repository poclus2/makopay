import { motion } from 'framer-motion';
import { ArrowLeft, Clock, TrendingUp, Calendar, HelpCircle, Share2, CheckCircle, Circle, Loader2 } from 'lucide-react';
import GlassCard from '../makopay/GlassCard';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '@/contexts/CurrencyContext';

interface InvestmentDetailScreenProps {
  onBack: () => void;
  investment?: {
    id: string;
    userId: string;
    orderId: string;
    planId: string;
    principalAmount: string; // Matches DB
    status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'SUSPENDED';
    startDate: string;
    endDate: string | null;
    plan: {
      id: string;
      name: string;
      durationDays: number;
      yieldPercent: string;
      payoutFrequency: string;
      minAmount: string;
      maxAmount?: string;
    };
  };
}

export const InvestmentDetailScreen = ({ onBack, investment }: InvestmentDetailScreenProps) => {
  const { t } = useTranslation();
  const { formatCurrency } = useCurrency();
  const [chartType, setChartType] = useState<'earnings' | 'balance' | 'yield'>('earnings');

  if (!investment) {
    // ... (keep return null block)
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen p-4 flex items-center justify-center"
      >
        <div className="text-center">
          <p className="text-body text-muted-foreground">{t('invest.noInvestmentSelected') || 'No investment selected'}</p>
          <button onClick={onBack} className="btn-secondary mt-4">
            {t('common.back')}
          </button>
        </div>
      </motion.div>
    );
  }

  // Handle data fallbacks
  const principalAmount = Number(investment.principalAmount || (investment as any).principal || 0);
  const startDate = new Date(investment.startDate);
  const endDate = investment.endDate
    ? new Date(investment.endDate)
    : new Date(startDate.getTime() + investment.plan.durationDays * 24 * 60 * 60 * 1000);

  // Calculate payout amount based on frequency
  const getPayoutAmount = () => {
    const frequency = investment.plan.payoutFrequency;
    const monthlyRate = (principalAmount * Number(investment.plan.yieldPercent)) / 100;

    switch (frequency) {
      case 'HOURLY': return monthlyRate / (30 * 24);
      case 'DAILY': return monthlyRate / 30;
      case 'WEEKLY': return (monthlyRate / 30) * 7;
      case 'YEARLY': return monthlyRate * 12;
      case 'MONTHLY':
      default: return monthlyRate;
    }
  };

  const payoutAmount = getPayoutAmount();

  // Calculate stats
  const now = new Date().getTime();
  const start = startDate.getTime();
  const end = endDate.getTime();
  const durationMs = end - start;
  const elapsedMs = Math.max(0, now - start);

  // Precise Progress
  const progress = Math.min(Math.max(0, (elapsedMs / durationMs) * 100), 100);

  // Precise Earnings (Realized Payouts Calculation)
  // Aligned with Backend Cron Logic: Payouts happen at Grid Crossings
  let payoutsCount = 0;

  if (investment.plan.payoutFrequency === 'HOURLY') {
    // Hours crossed
    const currentHour = Math.floor(now / (60 * 60 * 1000));
    const startHour = Math.floor(start / (60 * 60 * 1000));
    payoutsCount = Math.max(0, currentHour - startHour);
  } else {
    // Days crossed (Midnight checks)
    // Note: Assuming backend runs on UTC or aligned system time. 
    // Using simple day buckets.
    const currentDay = Math.floor(now / (24 * 60 * 60 * 1000));
    const startDay = Math.floor(start / (24 * 60 * 60 * 1000));
    payoutsCount = Math.max(0, currentDay - startDay);
  }

  const totalEarned = payoutsCount * payoutAmount;

  // Display helpers
  const getDurationMonths = () => Math.round(investment.plan.durationDays / 30);
  const monthsRemaining = Math.max(getDurationMonths() - Math.floor(elapsedMs / (30 * 24 * 60 * 60 * 1000)), 0);
  const daysRemaining = Math.max(0, Math.ceil((durationMs - elapsedMs) / (24 * 60 * 60 * 1000)));

  const calculatePayoutTimeline = () => {
    const now = new Date().getTime();
    const start = startDate.getTime();
    const end = endDate.getTime();
    const frequency = investment.plan.payoutFrequency;

    // Determine interval and Grid Alignment
    let intervalMs = 0;
    let nextGridTime = 0;

    if (frequency === 'HOURLY') {
      intervalMs = 60 * 60 * 1000;
      // Align to next full hour
      const d = new Date();
      d.setMinutes(0, 0, 0);
      d.setHours(d.getHours() + 1);
      nextGridTime = d.getTime();
    } else {
      // All other frequencies (DAILY, WEEKLY, etc) are currently processed DAILY at Midnight by backend
      intervalMs = 24 * 60 * 60 * 1000;
      // Align to next Midnight
      const d = new Date();
      d.setHours(24, 0, 0, 0); // Next midnight
      nextGridTime = d.getTime();
    }

    const timeline = [];
    // amount is already calculated as payoutAmount above
    const amount = payoutAmount;

    // 1. Add Past Payouts (Calculate backwards from nextGridTime)
    // We show the last 3 virtual intervals
    for (let i = 3; i >= 1; i--) {
      const pastTime = nextGridTime - (i * intervalMs); // e.g. NextHour - 1h = ThisHour (which just passed or is passing)

      // Only show if it matches valid investment window
      if (pastTime >= start && pastTime < now) {
        timeline.push({
          id: pastTime,
          rawDate: new Date(pastTime),
          date: new Date(pastTime).toLocaleString('fr-FR', {
            month: 'short', day: 'numeric', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
          }),
          amount: amount,
          status: 'completed'
        });
      }
    }

    // 2. Add Pending Payout (The immediate next grid time)
    if (nextGridTime <= end) {
      timeline.push({
        id: nextGridTime,
        rawDate: new Date(nextGridTime),
        date: new Date(nextGridTime).toLocaleString('fr-FR', {
          month: 'short', day: 'numeric', year: 'numeric',
          hour: '2-digit', minute: '2-digit'
        }),
        amount: amount,
        status: 'pending'
      });
    }

    // 3. Add Upcoming Payouts (Next 2 grid times after pending)
    for (let i = 1; i <= 2; i++) {
      const upcomingTime = nextGridTime + (i * intervalMs);
      if (upcomingTime <= end) {
        timeline.push({
          id: upcomingTime,
          rawDate: new Date(upcomingTime),
          date: new Date(upcomingTime).toLocaleString('fr-FR', {
            month: 'short', day: 'numeric', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
          }),
          amount: amount,
          status: 'upcoming'
        });
      }
    }

    return timeline;
  };

  const payoutTimeline = calculatePayoutTimeline();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'badge-active';
      case 'COMPLETED': return 'badge-success';
      case 'CANCELLED': return 'badge-destructive';
      default: return 'badge-pending';
    }
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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="w-10 h-10 rounded-full glass-card flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div>
            <h1 className="text-headline text-foreground">{investment.plan.name}</h1>
            <p className="text-caption text-muted-foreground">Investment #{investment.id.slice(0, 8)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="w-10 h-10 rounded-full glass-card flex items-center justify-center">
            <Share2 className="w-5 h-5 text-foreground" />
          </button>
          <span className={getStatusColor(investment.status)}>{t(`invest.${investment.status.toLowerCase()}`) || investment.status}</span>
        </div>
      </div>

      {/* Hero Stats */}
      <GlassCard variant="solid" glow className="mb-6">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-caption text-muted-foreground mb-1">{t('invest.totalEarned')}</p>
            <p className="text-title font-bold text-primary tabular-nums glow-text">
              {formatCurrency(totalEarned)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-caption text-muted-foreground mb-1">{t('invest.timeRemaining')}</p>
            <p className="text-title font-bold text-foreground">{daysRemaining}j</p>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-caption text-muted-foreground">{t('invest.progress')}</span>
            <span className="text-caption text-primary font-semibold">{progress.toFixed(0)}%</span>
          </div>
          <div className="h-3 rounded-full bg-muted/50 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, delay: 0.3 }}
              className="h-full rounded-full gradient-primary shadow-glow"
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-caption text-muted-foreground">
          <span>{startDate.toLocaleDateString()}</span>
          <span>{endDate.toLocaleDateString()}</span>
        </div>
      </GlassCard>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <GlassCard className="text-center py-3">
          <p className="text-xxs text-muted-foreground mb-1">{t('invest.invested')}</p>
          <p className="text-body font-bold text-foreground tabular-nums">{formatCurrency(principalAmount)}</p>
        </GlassCard>
        <GlassCard className="text-center py-3">
          <p className="text-xxs text-muted-foreground mb-1">{t('invest.yield')}</p>
          <p className="text-body font-bold text-primary tabular-nums">{Number(investment.plan.yieldPercent)}%</p>
        </GlassCard>
        <GlassCard className="text-center py-3">
          <p className="text-xxs text-muted-foreground mb-1">{t('invest.duration')}</p>
          <p className="text-body font-bold text-foreground">{getDurationMonths()} {t('invest.months')}</p>
        </GlassCard>
      </div>

      {/* Chart */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-headline text-foreground">{t('invest.performance')}</h3>
          <div className="flex gap-1">
            {(['earnings', 'balance', 'yield'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setChartType(type)}
                className={`px-3 py-1 rounded-full text-xxs font-medium transition-all ${chartType === type
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/50 text-muted-foreground'
                  }`}
              >
                {t(`invest.chart.${type}`)}
              </button>
            ))}
          </div>
        </div>

        <GlassCard className="h-48">
          <svg viewBox="0 0 300 120" className="w-full h-full">
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(165, 86%, 56%)" stopOpacity="0.3" />
                <stop offset="100%" stopColor="hsl(165, 86%, 56%)" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Grid Lines */}
            {[0, 1, 2, 3, 4].map((i) => (
              <line
                key={i}
                x1="0"
                y1={i * 30}
                x2="300"
                y2={i * 30}
                stroke="hsl(165, 30%, 20%)"
                strokeWidth="0.5"
                strokeDasharray="4"
              />
            ))}

            {/* Area */}
            <motion.path
              initial={{ opacity: 0, pathLength: 0 }}
              animate={{ opacity: 1, pathLength: 1 }}
              transition={{ duration: 1.5 }}
              d="M0,100 L50,85 L100,90 L150,60 L200,50 L250,35 L300,20 L300,120 L0,120 Z"
              fill="url(#chartGradient)"
            />

            {/* Line */}
            <motion.path
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.5 }}
              d="M0,100 L50,85 L100,90 L150,60 L200,50 L250,35 L300,20"
              fill="none"
              stroke="hsl(165, 86%, 56%)"
              strokeWidth="2"
              className="drop-shadow-[0_0_8px_hsl(165,86%,56%)]"
            />

            {/* Data Points */}
            {[[0, 100], [50, 85], [100, 90], [150, 60], [200, 50], [250, 35], [300, 20]].map(([x, y], i) => (
              <motion.circle
                key={i}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                cx={x}
                cy={y}
                r="4"
                fill="hsl(165, 86%, 56%)"
                className="drop-shadow-[0_0_6px_hsl(165,86%,56%)]"
              />
            ))}
          </svg>
        </GlassCard>
      </div>

      <div className="mb-6">
        <h3 className="text-headline text-foreground mb-3">{t('invest.payoutTimeline')}</h3>
        <GlassCard className="space-y-0">

          {payoutTimeline.length === 0 ? (
            <div className="py-4 text-center text-muted-foreground">
              <p>{t('invest.noTimeline', 'No timeline available')}</p>
            </div>
          ) : (
            payoutTimeline.map((payout, index) => (
              <motion.div
                key={payout.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
                className={`flex items-center gap-4 py-3 ${index < payoutTimeline.length - 1 ? 'border-b border-border/20' : ''
                  }`}
              >
                {/* Timeline Dot */}
                <div className="relative">
                  {payout.status === 'completed' && (
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  {payout.status === 'pending' && (
                    <div className="w-6 h-6 rounded-full bg-warning/20 flex items-center justify-center">
                      <Loader2 className="w-4 h-4 text-warning animate-spin" />
                    </div>
                  )}
                  {payout.status === 'upcoming' && (
                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                      <Circle className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                  {index < payoutTimeline.length - 1 && (
                    <div className={`absolute top-7 left-1/2 -translate-x-1/2 w-0.5 h-8 ${payout.status === 'completed' ? 'bg-primary' : 'bg-muted'
                      }`} />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1">
                  <p className="text-body font-medium text-foreground">{payout.date}</p>
                  <p className="text-caption text-muted-foreground capitalize">{t(`invest.${payout.status}`) || payout.status}</p>
                </div>

                {/* Amount */}
                <p className={`text-body font-bold tabular-nums ${payout.status === 'completed' || payout.status === 'pending' ? 'text-primary' : 'text-muted-foreground'
                  }`}>
                  {formatCurrency(payout.amount)}
                </p>
              </motion.div>
            )))
          }
        </GlassCard>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pb-24">
        <motion.button
          whileTap={{ scale: 0.98 }}
          className="flex-1 btn-secondary flex items-center justify-center gap-2"
        >
          <HelpCircle className="w-5 h-5" />
          {t('invest.support')}
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.98 }}
          className="flex-1 btn-primary flex items-center justify-center gap-2"
          disabled={investment.status !== 'ACTIVE'}
        >
          <TrendingUp className="w-5 h-5" />
          {t('invest.reinvest')}
        </motion.button>
      </div>
    </motion.div>
  );
};

export default InvestmentDetailScreen;