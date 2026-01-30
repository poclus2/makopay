import { motion } from 'framer-motion';
import { ArrowRight, Clock, ShoppingBag, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '@/contexts/CurrencyContext';
import GlassCard from './GlassCard';

const deals = [
  {
    id: 1,
    name: 'Premium Coffee Kit',
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=300&h=200&fit=crop',
    yield: 8.5,
    duration: 6,
    price: 299,
  },
  {
    id: 2,
    name: 'Luxury Watch Box',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=200&fit=crop',
    yield: 12,
    duration: 12,
    price: 599,
  },
  {
    id: 3,
    name: 'Tech Gadget Bundle',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=200&fit=crop',
    yield: 10,
    duration: 9,
    price: 449,
  },
];

interface FeaturedDealsProps {
  deals?: Array<{
    id: string;
    name: string;
    image: string;
    yield: number;
    duration: number;
    price: number;
  }>;
  onDealClick?: (dealId: string) => void;
  onViewAll?: () => void;
}

export const FeaturedDeals = ({ deals: propDeals, onDealClick, onViewAll }: FeaturedDealsProps) => {
  const { t } = useTranslation();
  const { formatCurrency } = useCurrency();
  // Use provided deals or fallback to demo data
  const deals = propDeals && propDeals.length > 0 ? propDeals : [
    {
      id: '1',
      name: 'Premium Coffee Kit',
      image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=300&h=200&fit=crop',
      yield: 8.5,
      duration: 6,
      price: 299,
    },
    {
      id: '2',
      name: 'Luxury Watch Box',
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=200&fit=crop',
      yield: 12,
      duration: 12,
      price: 599,
    },
    {
      id: '3',
      name: 'Tech Gadget Bundle',
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=200&fit=crop',
      yield: 10,
      duration: 9,
      price: 449,
    },
  ];
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-headline text-foreground">{t('dashboard.featuredDeals')}</h3>
        <button
          onClick={onViewAll}
          className="flex items-center gap-1 text-caption text-primary hover:underline"
        >
          {t('common.viewAll')} <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2 -mx-4 px-4">
        {deals.map((deal, index) => (
          <motion.div
            key={deal.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + index * 0.1 }}
            className="min-w-[200px]"
          >
            <GlassCard onClick={() => onDealClick?.(deal.id)} className="p-0 overflow-hidden group cursor-pointer">
              <div className="relative h-28 overflow-hidden">
                <img
                  src={deal.image}
                  alt={deal.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                <div className="absolute top-2 right-2 flex gap-1">
                  <span className="badge-active flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {deal.yield}%
                  </span>
                </div>
              </div>
              <div className="p-3">
                <h4 className="text-body font-semibold text-foreground mb-1 truncate">{deal.name}</h4>
                <div className="flex items-center gap-1 text-xxs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {deal.duration}mo
                </div>
                <div className="flex items-center justify-between mt-3">
                  <p className="text-body font-bold text-foreground tabular-nums">{formatCurrency(deal.price)}</p>
                  <button className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-glow">
                    <ShoppingBag className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default FeaturedDeals;