import { motion } from 'framer-motion';
import { useState } from 'react';
import {
  ArrowLeft, User, Shield, CheckCircle, AlertCircle,
  ChevronRight, Lock, Globe, MessageCircle, FileText,
  LogOut, Smartphone, ToggleLeft, ToggleRight, Camera, Sun, Moon,
  Copy, Check, Languages, ChevronDown
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import GlassCard from '../makopay/GlassCard';
import { useTheme } from '@/contexts/ThemeContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import ChangePasswordModal from '../makopay/ChangePasswordModal';

interface ProfileScreenProps {
  onBack: () => void;
  onLogout: () => void;
}

import { useNavigate } from 'react-router-dom';

export const ProfileScreen = ({ onBack, onLogout }: ProfileScreenProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const [is2FAEnabled, setIs2FAEnabled] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const [copiedCode, setCopiedCode] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { currency, setCurrency, availableCurrencies } = useCurrency();

  const currentLanguage = i18n.language;

  const changeLanguage = () => {
    const newLang = currentLanguage === 'fr' ? 'en' : 'fr';
    i18n.changeLanguage(newLang);
    localStorage.setItem('language', newLang);
    toast.success(
      newLang === 'fr'
        ? 'Langue changée en Français'
        : 'Language changed to English'
    );
  };

  const getUserName = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user?.firstName) return user.firstName;
    if (user?.email) return user.email.split('@')[0];
    return t('common.profile');
  };

  const getUserInitial = () => {
    if (user?.firstName) return user.firstName[0].toUpperCase();
    if (user?.email) return user.email[0].toUpperCase();
    return 'U';
  };

  const getJoinedDate = () => {
    if (!user?.createdAt) return t('profile.recently', 'Recently');
    const date = new Date(user.createdAt);
    return date.toLocaleDateString(currentLanguage === 'fr' ? 'fr-FR' : 'en-US', {
      month: 'long',
      year: 'numeric'
    });
  };

  const getKycStatus = (): 'verified' | 'pending' | 'rejected' => {
    if (!user?.kycStatus) return 'pending';
    return user.kycStatus.toLowerCase() as 'verified' | 'pending' | 'rejected';
  };

  const copyReferralCode = () => {
    if (user?.referralCode) {
      navigator.clipboard.writeText(user.referralCode);
      setCopiedCode(true);
      toast.success(t('profile.copiedToClipboard'));
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const kycStatusConfig = {
    verified: {
      icon: CheckCircle,
      label: t('profile.verified'),
      color: 'text-primary',
      bg: 'bg-primary/20',
    },
    pending: {
      icon: AlertCircle,
      label: t('profile.pending'),
      color: 'text-warning',
      bg: 'bg-warning/20',
    },
    rejected: {
      icon: AlertCircle,
      label: t('profile.rejected'),
      color: 'text-destructive',
      bg: 'bg-destructive/20',
    },
  };

  const kycConfig = kycStatusConfig[getKycStatus()];
  const KycIcon = kycConfig.icon;

  const menuItems = [
    {
      section: t('profile.accountInfo'),
      items: [
        user?.referralCode && {
          id: 'referral',
          icon: User,
          label: t('profile.referralCode'),
          value: user.referralCode,
          action: copyReferralCode,
          actionIcon: copiedCode ? Check : Copy,
        },
      ].filter(Boolean),
    },
    {
      section: t('profile.security'),
      items: [
        {
          id: 'kyc',
          icon: Shield,
          label: t('profile.kycStatus'),
          value: kycConfig.label,
          valueColor: kycConfig.color,
          action: () => navigate('/kyc'),
          arrow: true,
        },
        {
          id: '2fa',
          icon: Smartphone,
          label: t('profile.twoFactorAuth'),
          toggle: true,
          enabled: is2FAEnabled,
          onToggle: () => setIs2FAEnabled(!is2FAEnabled),
        },
        {
          id: 'password',
          icon: Lock,
          label: t('profile.changePassword'),
          arrow: true,
          action: () => setShowPasswordModal(true),
        },
      ],
    },
    {
      section: t('profile.preferences'),
      items: [
        {
          id: 'theme',
          icon: theme === 'dark' ? Moon : Sun,
          label: t('profile.theme'),
          toggle: true,
          enabled: theme === 'dark',
          toggleLabels: { on: t('profile.dark'), off: t('profile.light') },
          onToggle: toggleTheme,
        },
        {
          id: 'language',
          icon: Languages,
          label: t('profile.language'),
          toggle: true,
          enabled: currentLanguage === 'fr',
          toggleLabels: { on: 'Français', off: 'English' },
          onToggle: changeLanguage,
        },
        {
          id: 'currency',
          icon: Globe,
          label: t('profile.currency', 'Devise'),
          // toggle: true removed to allow customRender to work
          customRender: (
            <div className="relative group/select">
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as any)}
                className="appearance-none bg-background/50 border border-border/50 text-caption font-medium outline-none text-right pl-3 pr-8 py-1 rounded-lg cursor-pointer hover:bg-background/80 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                {availableCurrencies.map(c => (
                  <option key={c.code} value={c.code} className="bg-background text-foreground">
                    {c.code} ({c.symbol})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground group-hover/select:text-foreground transition-colors" />
            </div>
          )
        },
      ],
    },
    {
      section: t('profile.support'),
      items: [
        {
          id: 'chat',
          icon: MessageCircle,
          label: t('profile.supportChat'),
          arrow: true,
          action: () => navigate('/support'),
        },
        {
          id: 'legal',
          icon: FileText,
          label: t('profile.legalTerms'),
          arrow: true,
        },
      ],
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="min-h-screen p-4 safe-top safe-bottom"
      style={{ paddingTop: '2.5rem' }}
    >
      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="w-10 h-10 rounded-full glass-card flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-title text-foreground">{t('profile.title')}</h1>
      </div>

      {/* Profile Card */}
      <GlassCard variant="solid" glow className="mb-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center text-2xl font-bold text-primary-foreground shadow-glow">
              {getUserInitial()}
            </div>
            <button className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary flex items-center justify-center border-2 border-background">
              <Camera className="w-4 h-4 text-primary-foreground" />
            </button>
          </div>
          <div className="flex-1">
            <h2 className="text-headline text-foreground mb-1">{getUserName()}</h2>
            <p className="text-caption text-muted-foreground mb-2">
              {user?.email || user?.phoneNumber}
            </p>
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${kycConfig.bg}`}>
                <KycIcon className={`w-3 h-3 ${kycConfig.color}`} />
                <span className={`text-xxs font-semibold ${kycConfig.color}`}>{kycConfig.label}</span>
              </div>
              <span className="text-xxs text-muted-foreground">{t('profile.since')} {getJoinedDate()}</span>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Menu Sections */}
      {menuItems.map((section, sectionIndex) => (
        section.items.length > 0 && (
          <motion.div
            key={section.section}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * sectionIndex }}
            className="mb-6"
          >
            <h3 className="text-caption text-muted-foreground mb-2 px-1">{section.section}</h3>
            <GlassCard className="divide-y divide-border/20">
              {section.items.map((item: any) => {
                const Icon = item.icon;
                const ActionIcon = item.actionIcon;

                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                    onClick={item.action}
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-body text-foreground">{item.label}</p>
                    </div>

                    {item.toggle ? (
                      <button
                        onClick={item.onToggle}
                        className="flex items-center gap-2"
                      >
                        {item.toggleLabels && (
                          <span className={`text-caption ${item.enabled ? 'text-primary' : 'text-muted-foreground'}`}>
                            {item.enabled ? item.toggleLabels.on : item.toggleLabels.off}
                          </span>
                        )}
                        {item.enabled ? (
                          <ToggleRight className="w-8 h-8 text-primary" />
                        ) : (
                          <ToggleLeft className="w-8 h-8 text-muted-foreground" />
                        )}
                      </button>
                    ) : item.customRender ? (
                      item.customRender
                    ) : item.value ? (
                      <div className="flex items-center gap-2">
                        <span className={`text-caption ${item.valueColor || 'text-muted-foreground'}`}>
                          {item.value}
                        </span>
                        {item.actionIcon && ActionIcon && (
                          <button
                            onClick={item.action}
                            className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-primary/10 transition-colors"
                          >
                            <ActionIcon className="w-4 h-4 text-primary" />
                          </button>
                        )}
                        {item.arrow && <ChevronRight className="w-5 h-5 text-muted-foreground" />}
                      </div>
                    ) : item.arrow ? (
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    ) : null}
                  </div>
                );
              })}
            </GlassCard>
          </motion.div>
        )
      ))}

      {/* Logout Button */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        whileTap={{ scale: 0.98 }}
        onClick={onLogout}
        className="w-full py-4 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center gap-2 text-destructive font-semibold transition-all hover:bg-destructive/20"
      >
        <LogOut className="w-5 h-5" />
        {t('auth.signOut')}
      </motion.button>

      {/* App Version */}
      <p className="text-center text-xxs text-muted-foreground mt-6">
        MakoPay v1.0.0 • {t('profile.madeWith')} 💚
      </p>
    </motion.div>
  );
};

export default ProfileScreen;