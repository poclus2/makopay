import { motion } from 'framer-motion';
import { ArrowUpRight, Plus, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface QuickActionsProps {
  onAction?: (actionId: string) => void;
}

export const QuickActions = ({ onAction }: QuickActionsProps) => {
  const { t } = useTranslation();

  const actions = [
    { id: 'cashout', icon: ArrowUpRight, label: t('dashboard.cashout'), variant: 'glass' as const },
    { id: 'addfunds', icon: Plus, label: t('dashboard.addFunds'), variant: 'outline' as const },
    { id: 'invest', icon: TrendingUp, label: t('common.invest'), variant: 'primary' as const },
  ];

  return (
    <div className="flex items-center gap-3">
      {actions.map((action, index) => {
        const Icon = action.icon;
        const isPrimary = action.variant === 'primary';
        const isOutline = action.variant === 'outline';

        return (
          <motion.button
            key={action.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + index * 0.1 }}
            whileTap={{ scale: 0.95 }}
            whileHover={{ y: -3, scale: 1.02 }}
            onClick={() => onAction?.(action.id)}
            className={`
              relative flex items-center gap-2 flex-1 justify-center py-3 px-4 rounded-2xl font-semibold text-sm
              transition-all duration-300 overflow-hidden
              ${isPrimary
                ? 'bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-[0_4px_20px_hsl(165_86%_56%/0.4)]'
                : isOutline
                  ? 'bg-transparent border-2 border-primary/40 text-primary hover:border-primary hover:bg-primary/10'
                  : 'bg-card/70 backdrop-blur-sm border border-border/40 text-foreground hover:border-primary/40 hover:bg-card'
              }
            `}
          >
            {/* Shimmer effect for primary */}
            {isPrimary && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full"
                animate={{ translateX: ['−100%', '200%'] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              />
            )}
            <Icon className={`w-4 h-4 relative z-10 ${isPrimary ? '' : isOutline ? 'text-primary' : ''}`} />
            <span className="relative z-10">{action.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
};

export default QuickActions;