import { motion } from 'framer-motion';
import { Home, TrendingUp, ShoppingBag, Users, Wallet } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const BottomNav = ({ activeTab, onTabChange }: BottomNavProps) => {
  const { t } = useTranslation();

  const navItems = [
    { id: 'home', icon: Home, label: t('common.home') },
    { id: 'invest', icon: TrendingUp, label: t('common.invest') },
    { id: 'shop', icon: ShoppingBag, label: t('common.shop') },
    { id: 'network', icon: Users, label: t('common.network') },
    { id: 'wallet', icon: Wallet, label: t('common.wallet') },
  ];

  return (
    <motion.nav
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.3, type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed bottom-6 left-0 right-0 mx-auto w-fit z-50 px-2 py-1"
      style={{
        background: 'hsl(165 59% 14% / 0.9)',
        border: '1px solid hsl(165 70% 56% / 0.2)',
        backdropFilter: 'blur(20px)',
        borderRadius: '999px',
      }}
    >
      <div className="flex items-center gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <motion.button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                'relative flex flex-col items-center justify-center px-4 py-2 rounded-full transition-all duration-200',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
              whileTap={{ scale: 0.9 }}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 rounded-full bg-primary/10"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <Icon className={cn('w-5 h-5 relative z-10', isActive && 'drop-shadow-[0_0_8px_hsl(165,86%,56%)]')} />
              <span className="text-xxs mt-1 relative z-10 font-medium">{item.label}</span>
              {isActive && (
                <motion.div
                  layoutId="indicator"
                  className="absolute -bottom-1 w-5 h-0.5 rounded-full bg-primary shadow-glow-sm"
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </motion.nav>
  );
};

export default BottomNav;