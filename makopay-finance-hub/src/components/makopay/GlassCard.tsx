import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GlassCardProps extends HTMLMotionProps<"div"> {
  variant?: 'default' | 'solid' | 'highlight';
  glow?: boolean;
  children: React.ReactNode;
}

export const GlassCard = ({ 
  variant = 'default', 
  glow = false, 
  className, 
  children,
  ...props 
}: GlassCardProps) => {
  const variants = {
    default: 'glass-card',
    solid: 'glass-card-solid',
    highlight: 'glass-card border-primary/30',
  };

  return (
    <motion.div
      className={cn(
        variants[variant],
        glow && 'glow-primary',
        'p-4',
        className
      )}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default GlassCard;