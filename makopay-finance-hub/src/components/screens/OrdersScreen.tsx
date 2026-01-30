import { motion } from 'framer-motion';
import { ArrowLeft, Package, Clock, CheckCircle2, XCircle, Truck, Filter } from 'lucide-react';
import { useState } from 'react';

interface OrdersScreenProps {
  onBack: () => void;
  onOrderClick?: (orderId: string) => void;
}

type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

interface Order {
  id: string;
  product: string;
  image: string;
  amount: number;
  status: OrderStatus;
  date: string;
  yield?: number;
}

const orders: Order[] = [
  { id: 'ORD-001', product: 'iPhone 15 Pro Max', image: '📱', amount: 850000, status: 'delivered', date: '2024-01-15', yield: 12 },
  { id: 'ORD-002', product: 'MacBook Air M3', image: '💻', amount: 1200000, status: 'shipped', date: '2024-01-18', yield: 15 },
  { id: 'ORD-003', product: 'AirPods Pro 2', image: '🎧', amount: 180000, status: 'processing', date: '2024-01-20', yield: 8 },
  { id: 'ORD-004', product: 'iPad Pro 12.9"', image: '📲', amount: 950000, status: 'pending', date: '2024-01-22', yield: 10 },
  { id: 'ORD-005', product: 'Apple Watch Ultra', image: '⌚', amount: 650000, status: 'cancelled', date: '2024-01-10' },
];

const statusConfig: Record<OrderStatus, { label: string; color: string; icon: typeof Clock; bgColor: string }> = {
  pending: { label: 'En attente', color: 'text-yellow-400', icon: Clock, bgColor: 'bg-yellow-400/20' },
  processing: { label: 'En cours', color: 'text-blue-400', icon: Package, bgColor: 'bg-blue-400/20' },
  shipped: { label: 'Expédié', color: 'text-purple-400', icon: Truck, bgColor: 'bg-purple-400/20' },
  delivered: { label: 'Livré', color: 'text-primary', icon: CheckCircle2, bgColor: 'bg-primary/20' },
  cancelled: { label: 'Annulé', color: 'text-red-400', icon: XCircle, bgColor: 'bg-red-400/20' },
};

const filters: { id: OrderStatus | 'all'; label: string }[] = [
  { id: 'all', label: 'Tous' },
  { id: 'pending', label: 'En attente' },
  { id: 'processing', label: 'En cours' },
  { id: 'shipped', label: 'Expédié' },
  { id: 'delivered', label: 'Livré' },
];

export const OrdersScreen = ({ onBack, onOrderClick }: OrdersScreenProps) => {
  const [activeFilter, setActiveFilter] = useState<OrderStatus | 'all'>('all');

  const filteredOrders = activeFilter === 'all' 
    ? orders 
    : orders.filter(order => order.status === activeFilter);

  const totalInvested = orders
    .filter(o => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.amount, 0);

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="min-h-screen p-4 safe-top safe-bottom pb-32"
    >
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onBack}
          className="w-10 h-10 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/40 flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </motion.button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-foreground">Mes commandes</h1>
          <p className="text-sm text-muted-foreground">{orders.length} commandes au total</p>
        </div>
        <motion.button
          whileTap={{ scale: 0.9 }}
          className="w-10 h-10 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/40 flex items-center justify-center"
        >
          <Filter className="w-5 h-5 text-muted-foreground" />
        </motion.button>
      </div>

      {/* Stats Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6 p-5 rounded-3xl bg-gradient-to-br from-primary/20 to-secondary/10 border border-primary/30 backdrop-blur-sm"
      >
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-muted-foreground">Total investi</p>
            <p className="text-2xl font-bold text-foreground font-mono">
              {totalInvested.toLocaleString()} <span className="text-sm text-primary">CFA</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Rendement moyen</p>
            <p className="text-2xl font-bold text-primary font-mono">+11.25%</p>
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mb-6 overflow-x-auto scrollbar-hide"
      >
        <div className="flex gap-2 pb-2">
          {filters.map((filter) => (
            <motion.button
              key={filter.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveFilter(filter.id)}
              className={`relative px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                activeFilter === filter.id
                  ? 'text-primary-foreground'
                  : 'bg-card/50 text-muted-foreground border border-border/40 hover:border-primary/50'
              }`}
            >
              {activeFilter === filter.id && (
                <motion.div
                  layoutId="activeOrderFilter"
                  className="absolute inset-0 bg-gradient-to-r from-primary to-secondary rounded-full"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10">{filter.label}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Orders List */}
      <div className="space-y-3">
        {filteredOrders.map((order, index) => {
          const status = statusConfig[order.status];
          const StatusIcon = status.icon;
          
          return (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.05 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onOrderClick?.(order.id)}
              className="relative p-4 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/40 hover:border-primary/30 transition-all cursor-pointer group"
            >
              {/* Hover glow effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="relative flex items-center gap-4">
                {/* Product Image */}
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-muted/50 to-muted/30 flex items-center justify-center text-2xl">
                  {order.image}
                </div>
                
                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">{order.product}</p>
                  <p className="text-sm text-muted-foreground">{order.id} • {order.date}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${status.bgColor}`}>
                      <StatusIcon className={`w-3 h-3 ${status.color}`} />
                      <span className={`text-xs font-medium ${status.color}`}>{status.label}</span>
                    </div>
                    {order.yield && (
                      <span className="text-xs text-primary font-medium">+{order.yield}% yield</span>
                    )}
                  </div>
                </div>
                
                {/* Amount */}
                <div className="text-right">
                  <p className="font-bold text-foreground font-mono">
                    {order.amount.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">CFA</p>
                </div>
              </div>
              
              {/* Progress bar for shipped orders */}
              {order.status === 'shipped' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-3 pt-3 border-t border-border/40"
                >
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>En transit</span>
                    <span>75%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted/30 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: '75%' }}
                      transition={{ delay: 0.5, duration: 0.8 }}
                      className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
                    />
                  </div>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredOrders.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-16"
        >
          <div className="w-20 h-20 rounded-full bg-muted/30 flex items-center justify-center mb-4">
            <Package className="w-10 h-10 text-muted-foreground" />
          </div>
          <p className="text-lg font-semibold text-foreground">Aucune commande</p>
          <p className="text-sm text-muted-foreground">Pas de commandes avec ce filtre</p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default OrdersScreen;
