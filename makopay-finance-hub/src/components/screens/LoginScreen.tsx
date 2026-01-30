import { motion } from 'framer-motion';
import { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, Fingerprint, ArrowRight, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import GlassCard from '../makopay/GlassCard';

interface LoginScreenProps {
  onLogin: () => void;
  onRegister: () => void;
}

export const LoginScreen = ({ onLogin, onRegister }: LoginScreenProps) => {
  const { t, i18n } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const toggleLanguage = () => {
    const newLang = i18n.language === 'fr' ? 'en' : 'fr';
    i18n.changeLanguage(newLang);
    localStorage.setItem('language', newLang);
  };

  const handleLogin = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsLoading(false);
    onLogin();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex flex-col justify-center p-6 gradient-dark"
    >
      {/* Background Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-primary/15 rounded-full blur-3xl" />
      </div>

      {/* Language Toggle */}
      <div className="absolute top-6 right-6 z-20">
        <button
          onClick={toggleLanguage}
          className="px-3 py-1.5 rounded-full glass-card flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-primary transition-colors"
        >
          <span className={i18n.language === 'fr' ? 'text-primary' : ''}>FR</span>
          <span>/</span>
          <span className={i18n.language === 'en' ? 'text-primary' : ''}>EN</span>
        </button>
      </div>

      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8 relative z-10"
      >
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow bg-black/50">
          <img src="/logo.png" alt="MakoPay Logo" className="w-16 h-16 object-contain" />
        </div>
        <h1 className="text-title text-foreground glow-text">{t('auth.welcomeBack')}</h1>
        <p className="text-caption text-muted-foreground mt-1">{t('auth.accessEcosystem', 'Access your financial ecosystem')}</p>
      </motion.div>

      {/* Login Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="relative z-10"
      >
        <GlassCard variant="solid" className="space-y-4">
          {/* Email Field */}
          <div className="space-y-2">
            <label className="text-caption text-muted-foreground">{t('auth.email')}</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('auth.emailPlaceholder', 'your@email.com')}
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-muted/30 border border-border/20 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <label className="text-caption text-muted-foreground">{t('auth.password')}</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-12 pr-12 py-3 rounded-xl bg-muted/30 border border-border/20 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Forgot Password */}
          <div className="text-right">
            <button className="text-caption text-primary hover:underline">{t('auth.forgotPassword')}</button>
          </div>

          {/* Login Button */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full btn-primary flex items-center justify-center gap-2 py-4"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Lock className="w-4 h-4" />
                {t('auth.signIn')}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </motion.button>

          {/* Divider */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-border/30" />
            <span className="text-xxs text-muted-foreground">{t('auth.orContinue', 'or continue with')}</span>
            <div className="flex-1 h-px bg-border/30" />
          </div>

          {/* Biometric Button */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            className="w-full btn-secondary flex items-center justify-center gap-2 py-4"
          >
            <Fingerprint className="w-5 h-5" />
            {t('auth.useBiometrics', 'Use Biometrics')}
          </motion.button>
        </GlassCard>
      </motion.div>

      {/* Register Link */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-center mt-6 relative z-10"
      >
        <p className="text-caption text-muted-foreground">
          {t('auth.dontHaveAccount')}{' '}
          <button onClick={onRegister} className="text-primary font-semibold hover:underline">
            {t('auth.createOne', 'Create one')}
          </button>
        </p>
      </motion.div>

      {/* Security Badge */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex items-center justify-center gap-2 mt-8 relative z-10"
      >
        <Lock className="w-3 h-3 text-muted-foreground" />
        <span className="text-xxs text-muted-foreground">{t('auth.securedBy', 'Secured by MakoPay')}</span>
      </motion.div>
    </motion.div>
  );
};

export default LoginScreen;