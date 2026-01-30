import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, ShoppingBag, Wallet, Users, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Notification {
  id: string; // UUID from backend
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'TRANSACTION';
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
}

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

const getIcon = (type: Notification['type']) => {
  switch (type) {
    case 'SUCCESS':
      return <CheckCircle className="w-5 h-5 text-primary" />;
    case 'WARNING':
      return <AlertCircle className="w-5 h-5 text-warning" />;
    case 'TRANSACTION':
      return <Wallet className="w-5 h-5 text-secondary" />;
    case 'INFO':
    default:
      return <ShoppingBag className="w-5 h-5 text-muted-foreground" />;
  }
};

export const NotificationDropdown = ({ isOpen, onClose }: NotificationDropdownProps) => {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await api.get('/notifications');
      return response.data; // { notifications: [], unreadCount: 0 }
    },
    enabled: isOpen, // Only fetch when open, or maybe polling in background
    refetchInterval: 30000,
  });

  const notifications: Notification[] = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await api.patch('/notifications/read-all');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const handleMarkAsRead = (id: string, read: boolean) => {
    if (!read) {
      markReadMutation.mutate(id);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40"
          />

          {/* Dropdown */}
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="absolute right-0 top-14 w-80 max-h-[70vh] z-50 glass-card-solid overflow-hidden"
            style={{
              transformOrigin: 'top right',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border/30">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground">Notifications</h3>
                {unreadCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-medium"
                  >
                    {unreadCount}
                  </motion.span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllReadMutation.mutate()}
                    className="text-xs text-primary hover:underline"
                    disabled={markAllReadMutation.isPending}
                  >
                    {markAllReadMutation.isPending ? '...' : 'Tout lire'}
                  </button>
                )}
                <button onClick={onClose} className="p-1 rounded-full hover:bg-muted/50">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto max-h-[50vh] hide-scrollbar">
              {isLoading ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  Aucune notification
                </div>
              ) : (
                notifications.map((notification, index) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleMarkAsRead(notification.id, notification.read)}
                    className={`p-4 border-b border-border/20 cursor-pointer transition-colors hover:bg-muted/30 ${!notification.read ? 'bg-primary/5' : ''
                      }`}
                  >
                    <div className="flex gap-3">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: index * 0.05 + 0.1, type: 'spring' }}
                        className="flex-shrink-0 w-10 h-10 rounded-full glass-card flex items-center justify-center"
                      >
                        {getIcon(notification.type)}
                      </motion.div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm font-medium ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {notification.title}
                          </p>
                          {!notification.read && (
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5"
                            />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground/60 mt-1 capitalize">
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: fr })}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-border/30">
              <button className="w-full py-2 text-sm text-primary hover:underline">
                Voir toutes les notifications
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NotificationDropdown;
