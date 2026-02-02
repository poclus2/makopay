import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import {
  ArrowLeft, ArrowRight, User, Mail, Lock, Globe,
  Users, QrCode, FileCheck, CheckCircle, Loader2, Eye, EyeOff
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import GlassCard from '../makopay/GlassCard';

interface RegisterScreenProps {
  onComplete: () => void;
  onBack: () => void;
}

export const RegisterScreen = ({ onComplete, onBack }: RegisterScreenProps) => {
  const { t, i18n } = useTranslation();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [countryCode, setCountryCode] = useState('+237'); // Cameroun par défaut
  const [phoneNumber, setPhoneNumber] = useState('');

  const toggleLanguage = () => {
    const newLang = i18n.language === 'fr' ? 'en' : 'fr';
    i18n.changeLanguage(newLang);
    localStorage.setItem('language', newLang);
  };

  const steps = [
    { id: 1, title: t('auth.identity', 'Identity'), icon: User },
    { id: 2, title: t('auth.network', 'Network'), icon: Users },
    { id: 3, title: t('auth.legal', 'Legal'), icon: FileCheck },
  ];

  // Form data
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    country: '',
    sponsorId: '',
    termsAccepted: false,
    kycAccepted: false,
  });

  const updateForm = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    } else {
      onBack();
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsLoading(false);
    onComplete();
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-3">
                <User className="w-7 h-7 text-primary" />
              </div>
              <h2 className="text-headline text-foreground">{t('auth.yourIdentity', 'Your Identity')}</h2>
              <p className="text-caption text-muted-foreground">{t('auth.tellUsAboutYourself', 'Tell us about yourself')}</p>
            </div>

            <div className="space-y-2">
              <label className="text-caption text-muted-foreground">{t('auth.fullName', 'Full Name')}</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => updateForm('fullName', e.target.value)}
                  placeholder={t('auth.fullNamePlaceholder', 'John Doe')}
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-muted/30 border border-border/20 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-caption text-muted-foreground">{t('auth.email')}</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateForm('email', e.target.value)}
                  placeholder={t('auth.emailPlaceholder', 'your@email.com')}
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-muted/30 border border-border/20 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-caption text-muted-foreground">{t('auth.password')}</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => updateForm('password', e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-12 py-3 rounded-xl bg-muted/30 border border-border/20 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>              </div>
            </div>

            <div className="space-y-2">
              <label className="text-caption text-muted-foreground">{t('auth.phoneNumber', 'Phone Number')}</label>
              <div className="flex gap-2">
                {/* Country Code Selector */}
                <div className="w-32">
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="w-full px-3 py-3 rounded-xl bg-muted/30 border border-border/20 text-foreground focus:outline-none focus:border-primary/50 transition-colors appearance-none text-sm"
                  >
                    <option value="+237">???? +237</option>
                    <option value="+225">???? +225</option>
                    <option value="+221">? +221</option>
                    <option value="+33"> +33</option>
                    <option value="+32"> +32</option>
                  </select>
                </div>
                
                {/* Phone Number Input */}
                <div className="flex-1">
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, ''); // Only digits
                      if (value.length <= 9) {
                        setPhoneNumber(value);
                      }
                    }}
                    placeholder="699000000"
                    maxLength={9}
                    className="w-full px-4 py-3 rounded-xl bg-muted/30 border border-border/20 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
                  />
                </div>
              </div>
              <p className="text-xxs text-muted-foreground">
                {t('auth.phoneFullNumber', 'Full number')}: {countryCode}{phoneNumber || '699000000'}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-caption text-muted-foreground">{t('auth.country', 'Country')}</label>
              <div className="relative">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <select
                  value={formData.country}
                  onChange={(e) => updateForm('country', e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-muted/30 border border-border/20 text-foreground focus:outline-none focus:border-primary/50 transition-colors appearance-none"
                >
                  <option value="" className="bg-background">{t('auth.selectCountry', 'Select country')}</option>
                  <option value="FR" className="bg-background">France</option>
                  <option value="DE" className="bg-background">Germany</option>
                  <option value="ES" className="bg-background">Spain</option>
                  <option value="IT" className="bg-background">Italy</option>
                  <option value="UK" className="bg-background">United Kingdom</option>
                </select>
              </div>
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-3">
                <Users className="w-7 h-7 text-primary" />
              </div>
              <h2 className="text-headline text-foreground">{t('auth.joinNetwork', 'Join Our Network')}</h2>
              <p className="text-caption text-muted-foreground">{t('auth.addSponsorCode', 'Add your sponsor code (optional)')}</p>
            </div>

            <div className="space-y-2">
              <label className="text-caption text-muted-foreground">{t('auth.sponsorCode')}</label>
              <div className="relative">
                <QrCode className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  value={formData.sponsorId}
                  onChange={(e) => updateForm('sponsorId', e.target.value)}
                  placeholder={t('auth.sponsorCodePlaceholder', 'Enter sponsor code')}
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-muted/30 border border-border/20 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>
              <p className="text-xxs text-muted-foreground">{t('auth.sponsorCodeHelp', 'Connect with an existing member for network benefits')}</p>
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-3">
                <FileCheck className="w-7 h-7 text-primary" />
              </div>
              <h2 className="text-headline text-foreground">{t('auth.termsAndConditions', 'Terms & Conditions')}</h2>
              <p className="text-caption text-muted-foreground">{t('auth.reviewAndAccept', 'Review and accept our policies')}</p>
            </div>

            <div className="space-y-3">
              <label className="flex items-start gap-3 p-4 rounded-xl bg-muted/20 border border-border/20 cursor-pointer hover:bg-muted/30 transition-colors">
                <input
                  type="checkbox"
                  checked={formData.termsAccepted}
                  onChange={(e) => updateForm('termsAccepted', e.target.checked)}
                  className="mt-0.5 w-5 h-5 rounded border-2 border-primary/50 text-primary focus:ring-2 focus:ring-primary/50"
                />
                <span className="text-caption text-foreground">
                  {t('auth.acceptTerms', 'I accept the')}{' '}
                  <a href="#" className="text-primary hover:underline">{t('auth.termsOfService', 'Terms of Service')}</a>
                  {' '}{t('auth.and', 'and')}{' '}
                  <a href="#" className="text-primary hover:underline">{t('auth.privacyPolicy', 'Privacy Policy')}</a>
                </span>
              </label>

              <label className="flex items-start gap-3 p-4 rounded-xl bg-muted/20 border border-border/20 cursor-pointer hover:bg-muted/30 transition-colors">
                <input
                  type="checkbox"
                  checked={formData.kycAccepted}
                  onChange={(e) => updateForm('kycAccepted', e.target.checked)}
                  className="mt-0.5 w-5 h-5 rounded border-2 border-primary/50 text-primary focus:ring-2 focus:ring-primary/50"
                />
                <span className="text-caption text-foreground">
                  {t('auth.acceptKYC', 'I consent to KYC verification processes')}
                </span>
              </label>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex flex-col p-6 gradient-dark"
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

      {/* Header */}
      <div className="flex items-center justify-between mb-8 relative z-10">
        <button onClick={handleBack} className="w-10 h-10 rounded-full glass-card flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-title text-foreground">{t('auth.createAccount')}</h1>
        <div className="w-10" />
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8 relative z-10">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = currentStep === step.id;
          const isCompleted = currentStep > step.id;

          return (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all ${isActive
                    ? 'bg-primary text-primary-foreground shadow-glow'
                    : isCompleted
                      ? 'bg-primary/30 text-primary'
                      : 'bg-muted/30 text-muted-foreground'
                    }`}
                >
                  {isCompleted ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </div>
                <span
                  className={`text-xxs ${isActive ? 'text-primary' : isCompleted ? 'text-primary' : 'text-muted-foreground'
                    }`}
                >
                  {step.title}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className="flex-1 h-0.5 mx-2">
                  <div className={`h-full ${isCompleted ? 'bg-primary' : 'bg-muted/30'} transition-colors`} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Form Content */}
      <div className="flex-1 relative z-10 mb-6">
        <AnimatePresence mode="wait">
          <GlassCard variant="solid">{renderStep()}</GlassCard>
        </AnimatePresence>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 relative z-10">
        {currentStep < 3 ? (
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleNext}
            className="flex-1 btn-primary flex items-center justify-center gap-2 py-4"
          >
            {t('common.next')}
            <ArrowRight className="w-5 h-5" />
          </motion.button>
        ) : (
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleComplete}
            disabled={!formData.termsAccepted || !formData.kycAccepted || isLoading}
            className="flex-1 btn-primary flex items-center justify-center gap-2 py-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                {t('auth.createAccount')}
              </>
            )}
          </motion.button>
        )}
      </div>

      {/* Login Link */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center mt-6 relative z-10"
      >
        <p className="text-caption text-muted-foreground">
          {t('auth.alreadyHaveAccount')}{' '}
          <button onClick={onBack} className="text-primary font-semibold hover:underline">
            {t('auth.signIn')}
          </button>
        </p>
      </motion.div>
    </motion.div>
  );
};

export default RegisterScreen;