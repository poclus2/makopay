import { motion } from 'framer-motion';
import { Award, TrendingUp, Users, Coins } from 'lucide-react';
import GlassCard from './GlassCard';

interface NetworkRankProps {
  rank: string;
  personalSales: number;
  networkVolume: number;
  totalCommissions: number;
}

export const NetworkRank = ({
  rank = 'Gold Partner',
  personalSales = 12500,
  networkVolume = 89400,
  totalCommissions = 3240,
}: NetworkRankProps) => {
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  return (
    <div className="space-y-4">
      {/* Rank Badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative"
      >
        <GlassCard variant="highlight" glow className="text-center py-6">
          <div className="absolute inset-0 overflow-hidden rounded-3xl">
            <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-60 h-60 bg-primary/20 rounded-full blur-3xl animate-pulse-glow" />
          </div>
          <div className="relative z-10">
            <motion.div
              initial={{ rotate: -10, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
              className="inline-flex items-center justify-center w-20 h-20 rounded-full gradient-primary mb-4 shadow-glow"
            >
              <Award className="w-10 h-10 text-primary-foreground" />
            </motion.div>
            <h3 className="text-title text-foreground glow-text mb-1">{rank}</h3>
            <p className="text-caption text-muted-foreground">Your current network rank</p>
          </div>
        </GlassCard>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <GlassCard className="text-center">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center mx-auto mb-2">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <p className="text-xxs text-muted-foreground mb-1">Personal Sales</p>
            <p className="text-body font-bold text-foreground tabular-nums">{formatNumber(personalSales)}</p>
          </GlassCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <GlassCard className="text-center">
            <div className="w-10 h-10 rounded-xl bg-secondary/20 flex items-center justify-center mx-auto mb-2">
              <Users className="w-5 h-5 text-secondary" />
            </div>
            <p className="text-xxs text-muted-foreground mb-1">Network Volume</p>
            <p className="text-body font-bold text-foreground tabular-nums">{formatNumber(networkVolume)}</p>
          </GlassCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <GlassCard className="text-center">
            <div className="w-10 h-10 rounded-xl bg-warning/20 flex items-center justify-center mx-auto mb-2">
              <Coins className="w-5 h-5 text-warning" />
            </div>
            <p className="text-xxs text-muted-foreground mb-1">Commissions</p>
            <p className="text-body font-bold text-primary tabular-nums">{formatNumber(totalCommissions)}</p>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
};

export default NetworkRank;