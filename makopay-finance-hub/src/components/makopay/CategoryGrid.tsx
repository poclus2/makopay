import { motion } from 'framer-motion';
import { Wallet, TrendingUp, ShoppingBag, Users, Package, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';




interface CategoryGridProps {
  onCategoryClick?: (categoryId: string) => void;
}

export const CategoryGrid = ({ onCategoryClick }: CategoryGridProps) => {
  const { t } = useTranslation();

  const categories = [
    { id: 'wallet', icon: Wallet, label: t('common.wallet'), color: 'hsl(165, 86%, 56%)', gradient: 'from-emerald-500 to-teal-400' },
    { id: 'invest', icon: TrendingUp, label: t('common.investments'), color: 'hsl(187, 100%, 62%)', gradient: 'from-cyan-400 to-blue-500' },
    { id: 'shop', icon: ShoppingBag, label: t('common.shop'), color: 'hsl(42, 100%, 67%)', gradient: 'from-amber-400 to-orange-500' },
    { id: 'network', icon: Users, label: t('common.network'), color: 'hsl(280, 70%, 60%)', gradient: 'from-purple-500 to-pink-500' },
    { id: 'orders', icon: Package, label: t('common.orders'), color: 'hsl(340, 80%, 60%)', gradient: 'from-rose-500 to-red-500' },
    { id: 'profile', icon: Settings, label: t('common.settings'), color: 'hsl(200, 60%, 50%)', gradient: 'from-blue-400 to-indigo-500' },
  ];

  return (
    <motion.div
      initial="hidden"
      animate="show"
      className="grid grid-cols-3 gap-4"
      style={{ perspective: '1000px' }}
    >
      {categories.map((category, index) => {
        const Icon = category.icon;
        const row = Math.floor(index / 3);
        const col = index % 3;

        return (
          <motion.div
            key={category.id}
            initial={{
              opacity: 0,
              rotateX: 45,
              rotateY: col === 0 ? -15 : col === 2 ? 15 : 0,
              z: -200,
              y: 80,
              scale: 0.7,
            }}
            animate={{
              opacity: 1,
              rotateX: 0,
              rotateY: 0,
              z: 0,
              y: 0,
              scale: 1,
            }}
            transition={{
              delay: 0.1 + row * 0.15 + col * 0.08,
              duration: 0.8,
              ease: [0.23, 1, 0.32, 1],
            }}
            style={{ transformStyle: 'preserve-3d' }}
          >
            <motion.button
              onClick={() => onCategoryClick?.(category.id)}
              whileHover={{
                scale: 1.08,
                y: -8,
                rotateX: -5,
                rotateY: col === 0 ? 5 : col === 2 ? -5 : 0,
                z: 30,
              }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              className="w-full relative flex flex-col items-center justify-center py-6 px-2 cursor-pointer group rounded-3xl overflow-hidden"
              style={{
                background: 'linear-gradient(145deg, hsl(165 59% 14% / 0.8) 0%, hsl(165 40% 10% / 0.9) 100%)',
                border: '1px solid hsl(165 70% 56% / 0.15)',
                boxShadow: '0 4px 20px hsl(165 33% 3% / 0.5), inset 0 1px 0 hsl(165 70% 56% / 0.1)',
                transformStyle: 'preserve-3d',
              }}
            >
              {/* Animated background glow */}
              <motion.div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-500"
                style={{
                  background: `radial-gradient(circle at 50% 30%, ${category.color}25 0%, transparent 60%)`,
                }}
              />

              {/* Top shine effect */}
              <motion.div
                className="absolute top-0 left-0 right-0 h-px opacity-50"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.4 + row * 0.15 + col * 0.08, duration: 0.6 }}
                style={{
                  background: `linear-gradient(90deg, transparent, ${category.color}60, transparent)`,
                }}
              />

              {/* Icon container with gradient background */}
              <motion.div
                className={`relative w-14 h-14 rounded-2xl flex items-center justify-center mb-3 bg-gradient-to-br ${category.gradient} shadow-lg`}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  delay: 0.3 + row * 0.15 + col * 0.08,
                  duration: 0.6,
                  ease: [0.23, 1, 0.32, 1],
                }}
                whileHover={{ rotate: [0, -8, 8, 0], scale: 1.15 }}
                style={{
                  boxShadow: `0 8px 25px ${category.color}40`,
                  transform: 'translateZ(20px)',
                }}
              >
                {/* Inner glow */}
                <div className="absolute inset-0 rounded-2xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Icon */}
                <Icon
                  className="w-7 h-7 text-white relative z-10 drop-shadow-md transition-all duration-300 group-hover:scale-110"
                />

                {/* Pulse ring on hover */}
                <motion.div
                  className="absolute inset-0 rounded-2xl border-2 opacity-0 group-hover:opacity-100"
                  style={{ borderColor: category.color }}
                  animate={{ scale: [1, 1.3, 1], opacity: [0, 0.6, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              </motion.div>

              {/* Label with 3D effect */}
              <motion.span
                className="text-xs font-semibold text-foreground/90 relative z-10 transition-all duration-300 group-hover:text-foreground"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + row * 0.15 + col * 0.08 }}
                style={{ transform: 'translateZ(15px)' }}
              >
                {category.label}
              </motion.span>

              {/* Bottom accent line */}
              <motion.div
                className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 rounded-full"
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: '40%', opacity: 0 }}
                whileHover={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                style={{
                  background: `linear-gradient(90deg, transparent, ${category.color}, transparent)`,
                }}
              />

              {/* Floating particles on hover */}
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 rounded-full opacity-0 group-hover:opacity-100"
                  style={{
                    background: category.color,
                    left: `${30 + i * 20}%`,
                    bottom: '20%',
                  }}
                  animate={{
                    y: [0, -20, -40],
                    opacity: [0, 1, 0],
                    scale: [0, 1, 0.5],
                  }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    delay: i * 0.2,
                    ease: 'easeOut',
                  }}
                />
              ))}
            </motion.button>
          </motion.div>
        );
      })}
    </motion.div>
  );
};

export default CategoryGrid;