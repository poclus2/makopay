import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Search, Users, ChevronRight, Loader2, TrendingUp, Wallet, Clock, Share2, Copy } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '@/contexts/CurrencyContext';
import NetworkRank from '../makopay/NetworkRank';
import GlassCard from '../makopay/GlassCard';

interface Referral {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  kycStatus: string;
  createdAt: string;
  referrals?: Referral[];
}

interface NetworkData {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  kycStatus: string;
  referralCode: string;
  sponsor?: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
  referrals: Referral[];
  commissionsReceived?: Array<{
    amount: string;
    createdAt: string;
  }>;
}

export const NetworkScreen = () => {
  const { t } = useTranslation();
  const { formatCurrency } = useCurrency();
  const [networkData, setNetworkData] = useState<NetworkData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'All' | 'L1' | 'L2' | 'L3'>('All');

  useEffect(() => {
    fetchNetwork();
  }, []);

  const fetchNetwork = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/mlm/network');
      setNetworkData(data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load network');
    } finally {
      setLoading(false);
    }
  };

  const getDisplayName = (user: Referral | NetworkData) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.email;
  };

  const getInitials = (user: Referral | NetworkData) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    return user.email[0].toUpperCase();
  };

  const getTeamMembers = () => {
    if (!networkData) return [];

    const members: Array<Referral & { level: 'L1' | 'L2' | 'L3' }> = [];

    // Level 1 - Direct referrals
    networkData.referrals.forEach(ref => {
      members.push({ ...ref, level: 'L1' });

      // Level 2 - Indirect referrals
      if (ref.referrals) {
        ref.referrals.forEach(subRef => {
          members.push({ ...subRef, level: 'L2' });

          // Level 3 - If exists
          if (subRef.referrals) {
            subRef.referrals.forEach(subSubRef => {
              members.push({ ...subSubRef, level: 'L3' });
            });
          }
        });
      }
    });

    return members;
  };

  const filteredMembers = () => {
    const members = getTeamMembers();
    if (activeFilter === 'All') return members;
    return members.filter(m => m.level === activeFilter);
  };

  const calculateStats = () => {
    const members = getTeamMembers();
    const totalTeam = members.length;
    const l1Count = members.filter(m => m.level === 'L1').length;
    const l2Count = members.filter(m => m.level === 'L2').length;
    const l3Count = members.filter(m => m.level === 'L3').length;

    // Calculate total commissions from wallet (would need to be passed from wallet API)
    const totalCommissions = networkData?.commissionsReceived?.reduce(
      (sum, comm) => sum + Number(comm.amount),
      0
    ) || 0;

    // Estimate network volume (this is simplified - in reality would need order data)
    const networkVolume = totalCommissions / 0.07; // Assuming average 7% commission rate

    return {
      totalTeam,
      l1Count,
      l2Count,
      l3Count,
      totalCommissions,
      networkVolume,
    };
  };

  const getRecentCommissions = () => {
    if (!networkData?.commissionsReceived) return [];

    return networkData.commissionsReceived.slice(0, 5).map((comm, idx) => ({
      id: idx,
      user: 'Team Member',
      amount: Number(comm.amount),
      level: 'L1', // Simplified - would need to track actual source
      date: new Date(comm.createdAt).toLocaleDateString(),
    }));
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

  if (!networkData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-body text-muted-foreground">Failed to load network</p>
        </div>
      </div>
    );
  }

  const stats = calculateStats();
  const members = filteredMembers();
  const recentCommissions = getRecentCommissions();

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
        <h1 className="text-title text-foreground">{t('network.title')}</h1>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-11 h-11 rounded-2xl bg-card/60 backdrop-blur-sm border border-border/30 flex items-center justify-center transition-all duration-300 hover:border-primary/40 hover:shadow-[0_0_20px_hsl(165_86%_56%/0.2)]"
        >
          <Search className="w-5 h-5 text-foreground" />
        </motion.button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <GlassCard className="text-center py-3">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center mx-auto mb-2">
            <Users className="w-4 h-4 text-primary" />
          </div>
          <p className="text-xxs text-muted-foreground">{t('network.totalTeam')}</p>
          <p className="text-headline font-bold text-foreground">{stats.totalTeam}</p>
        </GlassCard>

        <GlassCard className="text-center py-3">
          <div className="w-8 h-8 rounded-lg bg-secondary/20 flex items-center justify-center mx-auto mb-2">
            <TrendingUp className="w-4 h-4 text-secondary" />
          </div>
          <p className="text-xxs text-muted-foreground">{t('network.networkVolume')}</p>
          <p className="text-headline font-bold text-foreground tabular-nums">{formatCurrency(stats.networkVolume)}</p>
        </GlassCard>

        <GlassCard className="text-center py-3">
          <div className="w-8 h-8 rounded-lg bg-warning/20 flex items-center justify-center mx-auto mb-2">
            <Wallet className="w-4 h-4 text-warning" />
          </div>
          <p className="text-xxs text-muted-foreground">{t('network.totalEarnings')}</p>
          <p className="text-headline font-bold text-primary tabular-nums">{formatCurrency(stats.totalCommissions)}</p>
        </GlassCard>
      </div>

      {/* Referral Code */}
      <GlassCard variant="solid" className="mb-6">
        <p className="text-caption text-muted-foreground mb-1">{t('profile.referralCode')}</p>
        <p className="text-body font-bold text-primary">{networkData.referralCode}</p>
        <p className="text-xxs text-muted-foreground mt-1">{t('network.shareReferralCode')}</p>
      </GlassCard>

      {/* Share Referral Link */}
      <GlassCard variant="solid" className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-caption text-muted-foreground mb-1">{t('network.shareLink')}</p>
            <p className="text-xs text-muted-foreground">{t('network.inviteFriends')}</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              const link = `${window.location.origin}/auth/register?ref=${networkData.referralCode}`;
              navigator.clipboard.writeText(link);
              toast.success(t('network.linkCopied'));
            }}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-secondary text-primary-foreground font-semibold flex items-center gap-2 shadow-[0_4px_15px_hsl(165_86%_56%/0.4)]"
          >
            <Share2 className="w-4 h-4" />
            {t('network.share')}
          </motion.button>
        </div>
      </GlassCard>

      {/* Team Section */}
      <div className="space-y-4 mb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-headline text-foreground">{t('network.yourTeam')} ({stats.totalTeam})</h2>
        </div>

        {/* Level Filter */}
        <div className="flex gap-2">
          {(['All', 'L1', 'L2', 'L3'] as const).map((level) => (
            <motion.button
              key={level}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveFilter(level)}
              className={`
                px-5 py-2.5 rounded-full text-caption font-semibold transition-all duration-300 relative overflow-hidden
                ${activeFilter === level
                  ? 'bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-[0_4px_15px_hsl(165_86%_56%/0.4)]'
                  : 'bg-card/60 backdrop-blur-sm text-muted-foreground border border-border/30 hover:border-primary/40 hover:text-foreground hover:shadow-[0_4px_15px_hsl(165_86%_56%/0.15)]'
                }
              `}
            >
              {activeFilter === level && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 4 }}
                />
              )}
              <span className="relative z-10">{level}</span>
            </motion.button>
          ))}
        </div>

        {/* Team List */}
        <div className="space-y-2">
          {members.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-16 h-16 rounded-2xl bg-muted/30 flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-body text-muted-foreground text-center">
                {t('network.noTeamMembers')}
              </p>
              <p className="text-caption text-muted-foreground text-center mt-2">
                {t('network.shareReferralCode')}
              </p>
            </div>
          ) : (
            members.map((member, index) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <GlassCard className="flex items-center gap-3 py-3">
                  <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-semibold">
                    {getInitials(member)}
                  </div>
                  <div className="flex-1">
                    <p className="text-body font-medium text-foreground">{getDisplayName(member)}</p>
                    <div className="flex items-center gap-2">
                      <span className="badge-active text-xxs">{member.level}</span>
                      <span className="text-xxs text-muted-foreground">
                        {t('network.joined')} {new Date(member.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </GlassCard>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Commission History */}
      {recentCommissions.length > 0 && (
        <div className="space-y-4 pb-24">
          <div className="flex items-center justify-between">
            <h2 className="text-headline text-foreground">{t('network.recentCommissions')}</h2>
          </div>

          <div className="space-y-2">
            {recentCommissions.map((commission, index) => (
              <motion.div
                key={commission.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <GlassCard className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <Users className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-body font-medium text-foreground">{t('network.commissionEarned')}</p>
                      <div className="flex items-center gap-2 text-xxs text-muted-foreground">
                        <span className="text-primary">{commission.level}</span>
                        <span>•</span>
                        <span>{commission.date}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-body font-bold text-primary tabular-nums">+{formatCurrency(commission.amount)}</p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default NetworkScreen;