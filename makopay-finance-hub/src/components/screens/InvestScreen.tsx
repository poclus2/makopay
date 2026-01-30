import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Filter, TrendingUp, Wallet, Clock, Loader2, Search } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '@/contexts/CurrencyContext';
import InvestmentCard from '../makopay/InvestmentCard';
import GlassCard from '../makopay/GlassCard';

interface InvestScreenProps {
  onInvestmentClick?: (investment: any) => void;
  onPlanClick?: (planId: string) => void;
}

interface InvestmentPlan {
  id: string;
  name: string;
  durationDays: number;
  yieldPercent: string;
  payoutFrequency: string;
  minAmount: string;
  maxAmount?: string;
}

interface Investment {
  id: string;
  userId: string;
  orderId: string;
  planId: string;
  principal: string;
  principalAmount?: string;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'SUSPENDED';
  startDate: string;
  endDate: string;
  plan: InvestmentPlan;
  payouts?: { amount: string }[];
  lastPayoutAt?: string;
}

export const InvestScreen = ({ onInvestmentClick, onPlanClick }: InvestScreenProps) => {
  const { t } = useTranslation();
  const { formatCurrency } = useCurrency();
  const [activeTab, setActiveTab] = useState<'opportunities' | 'investments'>('opportunities');
  const [plans, setPlans] = useState<InvestmentPlan[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'opportunities') {
        const { data } = await api.get('/investments/plans');
        setPlans(data);
      } else {
        const { data } = await api.get('/investments');
        setInvestments(data);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const getPrincipal = (inv: any) => {
    return Number(inv.principalAmount || inv.principal || 0);
  };

  const calculateStats = () => {
    const activeCount = investments.filter(i => i.status === 'ACTIVE').length;
    const totalInvested = investments.reduce((sum, inv) => sum + getPrincipal(inv), 0);
    // Realized earnings from payouts (Active investments only)
    const estimatedEarnings = investments.reduce((sum, inv) => {
      if (inv.status === 'ACTIVE' && inv.payouts && inv.payouts.length > 0) {
        return sum + inv.payouts.reduce((pSum, payout) => pSum + Number(payout.amount), 0);
      }
      return sum;
    }, 0);

    return { activeCount, totalInvested, estimatedEarnings };
  };

  const calculateProgress = (startDateStr: string, durationDays: number) => {
    const start = new Date(startDateStr).getTime();
    const now = new Date().getTime();
    const durationMs = durationDays * 24 * 60 * 60 * 1000;

    if (now < start) return 0;

    const progress = ((now - start) / durationMs) * 100;
    return Math.min(Math.max(progress, 0), 100);
  };

  const calculateNextPayout = (investment: Investment) => {
    const { plan, lastPayoutAt, startDate } = investment;
    const baseDate = lastPayoutAt ? new Date(lastPayoutAt) : new Date(startDate);

    let nextDate = new Date(baseDate);
    // Ensure we start from a valid date, fallback to now if invalid
    if (isNaN(nextDate.getTime())) nextDate = new Date();

    switch (plan.payoutFrequency) {
      case 'HOURLY':
        nextDate.setHours(nextDate.getHours() + 1);
        break;
      case 'DAILY':
        nextDate.setDate(nextDate.getDate() + 1);
        break;
      case 'WEEKLY':
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case 'MONTHLY':
        nextDate.setDate(nextDate.getDate() + 30);
        break;
      default:
        // fallback
        nextDate.setDate(nextDate.getDate() + 1);
    }

    const now = new Date();
    const isToday = nextDate.toDateString() === now.toDateString();

    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isTomorrow = nextDate.toDateString() === tomorrow.toDateString();

    const timeStr = nextDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (isToday) return `${t('common.today', 'Today')} ${timeStr}`;
    if (isTomorrow) return `${t('common.tomorrow', 'Demain')} ${timeStr}`;
    return `${nextDate.toLocaleDateString()} ${timeStr}`;
  };

  const stats = calculateStats();
  const getDurationMonths = (days: number) => Math.round(days / 30);

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
        <h1 className="text-title text-foreground">{t('invest.title')}</h1>
        <button className="w-10 h-10 rounded-full glass-card flex items-center justify-center">
          <Filter className="w-5 h-5 text-foreground" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('opportunities')}
          className={`flex-1 py-3 rounded-xl font-semibold transition-all ${activeTab === 'opportunities'
            ? 'bg-primary text-primary-foreground shadow-glow'
            : 'glass-card text-muted-foreground'
            }`}
        >
          {t('invest.availablePlans', 'Opportunities')}
        </button>
        <button
          onClick={() => setActiveTab('investments')}
          className={`flex-1 py-3 rounded-xl font-semibold transition-all ${activeTab === 'investments'
            ? 'bg-primary text-primary-foreground shadow-glow'
            : 'glass-card text-muted-foreground'
            }`}
        >
          {t('invest.myInvestments')}
        </button>
      </div>

      {/* Summary Cards */}
      {activeTab === 'investments' && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <GlassCard className="text-center py-3">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center mx-auto mb-2">
                <TrendingUp className="w-4 h-4 text-primary" />
              </div>
              <p className="text-xxs text-muted-foreground">{t('invest.active', 'Active')}</p>
              <p className="text-body font-bold text-foreground tabular-nums">{stats.activeCount}</p>
            </GlassCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <GlassCard className="text-center py-3">
              <div className="w-8 h-8 rounded-lg bg-secondary/20 flex items-center justify-center mx-auto mb-2">
                <Wallet className="w-4 h-4 text-secondary" />
              </div>
              <p className="text-xxs text-muted-foreground">{t('invest.totalInvested')}</p>
              <p className="text-body font-bold text-foreground tabular-nums">{formatCurrency(stats.totalInvested)}</p>
            </GlassCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <GlassCard className="text-center py-3">
              <div className="w-8 h-8 rounded-lg bg-warning/20 flex items-center justify-center mx-auto mb-2">
                <Clock className="w-4 h-4 text-warning" />
              </div>
              <p className="text-xxs text-muted-foreground">{t('invest.totalReturns')}</p>
              <p className="text-body font-bold text-primary tabular-nums">{formatCurrency(stats.estimatedEarnings)}</p>
            </GlassCard>
          </motion.div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      )}

      {/* Opportunities Tab Content */}
      {!loading && activeTab === 'opportunities' && (
        <div className="space-y-4 pb-24">
          <h2 className="text-headline text-foreground">{t('invest.availablePlans')}</h2>
          {plans.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-16 h-16 rounded-2xl bg-muted/30 flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-body text-muted-foreground text-center">
                {t('invest.noPlans', 'No investment plans available')}
              </p>
            </div>
          ) : (
            plans.map((plan, index) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                onClick={() => onPlanClick?.(plan.id)}
                className="cursor-pointer"
              >
                <GlassCard className="p-4 transform transition-all active:scale-[0.98]">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-body font-semibold text-foreground">{plan.name}</h3>
                      <p className="text-caption text-muted-foreground">{plan.payoutFrequency} Payouts</p>
                    </div>
                    <span className="badge-active">{Number(plan.yieldPercent)}% Yield</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <p className="text-xxs text-muted-foreground">{t('invest.duration')}</p>
                      <p className="text-body font-bold text-foreground">{getDurationMonths(plan.durationDays)}{t('invest.months')}</p>
                    </div>
                    <div>
                      <p className="text-xxs text-muted-foreground">{t('invest.minInvestment', 'Min')}</p>
                      <p className="text-body font-bold text-foreground">{formatCurrency(Number(plan.minAmount))}</p>
                    </div>
                    {plan.maxAmount && (
                      <div>
                        <p className="text-xxs text-muted-foreground">{t('invest.maxInvestment', 'Max')}</p>
                        <p className="text-body font-bold text-foreground">{formatCurrency(Number(plan.maxAmount))}</p>
                      </div>
                    )}
                  </div>
                  <p className="text-caption text-muted-foreground mt-3">
                    💡 Purchase products with this plan to start investing
                  </p>
                </GlassCard>
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* My Investments Tab Content */}
      {!loading && activeTab === 'investments' && (
        <div className="space-y-4 pb-24">
          <h2 className="text-headline text-foreground">{t('invest.myInvestments')}</h2>
          {investments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-16 h-16 rounded-2xl bg-muted/30 flex items-center justify-center mb-4">
                <TrendingUp className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-body text-muted-foreground text-center">
                {t('invest.noActiveInvestments', 'No active investments yet')}
              </p>
              <p className="text-caption text-muted-foreground text-center mt-2">
                {t('invest.startInvestingHelp', 'Purchase products from the Shop to start investing')}
              </p>
            </div>
          ) : (
            investments.map((investment, index) => {
              const principal = getPrincipal(investment);
              const totalMonths = Math.max(1, getDurationMonths(investment.plan.durationDays || 30));
              const progress = calculateProgress(investment.startDate, investment.plan.durationDays || 30);
              const nextPayoutTime = calculateNextPayout(investment);

              return (
                <motion.div
                  key={investment.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  onClick={() => onInvestmentClick?.(investment)}
                  className="cursor-pointer"
                >
                  <InvestmentCard
                    name={investment.plan.name}
                    plan={investment.plan.name}
                    status={investment.status.toLowerCase() as 'active' | 'pending'}
                    amount={principal}
                    yield={Number(investment.plan.yieldPercent)}
                    duration={totalMonths}
                    progress={Math.round(progress)}
                    nextPayout={nextPayoutTime}
                  />
                </motion.div>
              );
            })
          )}
        </div>
      )}
    </motion.div>
  );
};

export default InvestScreen;