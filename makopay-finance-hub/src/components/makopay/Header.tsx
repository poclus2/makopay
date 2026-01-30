import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Moon, Sun, CheckCircle } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import NotificationDropdown from './NotificationDropdown';

interface HeaderProps {
  userName: string;
  isVerified?: boolean;
  onProfileClick?: () => void;
}

export const Header = ({ userName = 'Alex', isVerified = true, onProfileClick }: HeaderProps) => {
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const { data: notificationData } = useQuery({
    queryKey: ['notifications-count'],
    queryFn: async () => {
      const response = await api.get('/notifications');
      return response.data;
    },
    refetchInterval: 30000,
  });

  const unreadCount = notificationData?.unreadCount || 0;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('dashboard.goodMorning');
    if (hour < 18) return t('dashboard.goodAfternoon');
    return t('dashboard.goodEvening');
  };

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between mb-6 relative"
    >
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={onProfileClick}
        className="flex items-center gap-3"
      >
        <div className="relative">
          <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-lg shadow-glow">
            {userName.charAt(0)}
          </div>
          {isVerified && (
            <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center border-2 border-background">
              <CheckCircle className="w-3 h-3 text-primary-foreground" />
            </div>
          )}
        </div>
        <div>
          <p className="text-caption text-muted-foreground">{getGreeting()}</p>
          <div className="flex items-center gap-2">
            <h1 className="text-headline text-foreground">{userName}</h1>
            {isVerified && (
              <span className="badge-active text-xxs">{t('profile.verified')}</span>
            )}
          </div>
        </div>
      </motion.button>

      <div className="flex items-center gap-2">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
          className="relative w-10 h-10 rounded-full glass-card flex items-center justify-center"
        >
          <motion.div
            animate={isNotificationsOpen ? { rotate: [0, -10, 10, -10, 0] } : {}}
            transition={{ duration: 0.5 }}
          >
            <Bell className="w-5 h-5 text-foreground" />
          </motion.div>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute top-2 right-2 w-2 h-2 rounded-full bg-destructive"
            >
              <motion.span
                animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="absolute inset-0 rounded-full bg-destructive"
              />
            </motion.span>
          )}
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={toggleTheme}
          className="w-10 h-10 rounded-full glass-card flex items-center justify-center overflow-hidden"
        >
          <AnimatePresence mode="wait" initial={false}>
            {theme === 'dark' ? (
              <motion.div
                key="moon"
                initial={{ y: -20, opacity: 0, rotate: -90 }}
                animate={{ y: 0, opacity: 1, rotate: 0 }}
                exit={{ y: 20, opacity: 0, rotate: 90 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
              >
                <Moon className="w-5 h-5 text-foreground" />
              </motion.div>
            ) : (
              <motion.div
                key="sun"
                initial={{ y: -20, opacity: 0, rotate: -90 }}
                animate={{ y: 0, opacity: 1, rotate: 0 }}
                exit={{ y: 20, opacity: 0, rotate: 90 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
              >
                <Sun className="w-5 h-5 text-warning" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>

        <NotificationDropdown
          isOpen={isNotificationsOpen}
          onClose={() => setIsNotificationsOpen(false)}
        />
      </div>
    </motion.header>
  );
};

export default Header;