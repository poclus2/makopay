import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import {
    ArrowLeft, ArrowRight, User, Phone, Lock, Globe,
    Users, QrCode, FileCheck, CheckCircle, Loader2, Eye, EyeOff, Mail
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useTranslation } from 'react-i18next';
import GlassCard from '@/components/makopay/GlassCard';

const steps = [
    { id: 1, title: 'auth.identity', icon: User },
    { id: 2, title: 'auth.network', icon: Users },
    { id: 3, title: 'auth.legal', icon: FileCheck },
];

const Register = () => {
    const [currentStep, setCurrentStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [countryCode, setCountryCode] = useState('+237'); // Cameroun par défaut
    const [phoneNumber, setPhoneNumber] = useState('');
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [searchParams] = useSearchParams();

    // Pre-fill referral code from URL parameter
    useEffect(() => {
        const refCode = searchParams.get('ref');
        if (refCode) {
            setFormData(prev => ({ ...prev, sponsorId: refCode }));
        }
    }, [searchParams]);

    // Form data
    const [formData, setFormData] = useState({
        fullName: '',
        email: '', // Optional
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
            if (currentStep === 1) {
                if (!formData.fullName || !formData.phoneNumber || !formData.password) {
                    toast.error(t('auth.fillIdentityFields'));
                    return;
                }
            }
            setCurrentStep(prev => prev + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(prev => prev - 1);
        } else {
            navigate('/auth/login');
        }
    };

    const handleComplete = async () => {
        if (!formData.termsAccepted || !formData.kycAccepted) {
            toast.error(t('auth.acceptTermsAndKYC'));
            return;
        }

        setIsLoading(true);

        try {
            // Split Full Name
            const names = formData.fullName.trim().split(' ');
            const firstName = names[0];
            const lastName = names.slice(1).join(' ') || '';

            const fullPhoneNumber = countryCode + phoneNumber;

            const payload: any = {
                phoneNumber: fullPhoneNumber,
                password: formData.password,
                firstName,
                lastName,
            };

            // Only include optional fields if they have values
            if (formData.email && formData.email.trim()) {
                payload.email = formData.email.trim();
            }
            if (formData.sponsorId && formData.sponsorId.trim()) {
                payload.referralCode = formData.sponsorId.trim();
            }

            const response = await api.post("/auth/register", payload);

            if (response.data.requiresVerification) {
                toast.success(t('auth.verificationRequired') || 'Please verify your phone number');
                navigate("/auth/verify-phone", {
                    state: { phoneNumber: fullPhoneNumber }
                });
            } else {
                toast.success(t('auth.accountCreated'));
                navigate("/auth/login");
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || t('auth.registrationFailed'));
        } finally {
            setIsLoading(false);
        }
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
                            <h2 className="text-headline text-foreground">{t('auth.yourIdentity')}</h2>
                            <p className="text-caption text-muted-foreground">{t('auth.tellUsAboutYourself')}</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-caption text-muted-foreground">{t('auth.fullName')}</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <input
                                    type="text"
                                    value={formData.fullName}
                                    onChange={(e) => updateForm('fullName', e.target.value)}
                                    placeholder={t('auth.fullNamePlaceholder')}
                                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-muted/30 border border-border/20 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-caption text-muted-foreground">{t('auth.phoneNumber')}</label>
                            <div className="flex gap-2">
                                {/* Country Code Selector */}
                                <div className="w-32">
                                    <select
                                        value={countryCode}
                                        onChange={(e) => setCountryCode(e.target.value)}
                                        className="w-full px-3 py-3 rounded-xl bg-muted/30 border border-border/20 text-foreground focus:outline-none focus:border-primary/50 transition-colors appearance-none text-sm"
                                    >
                                        <option value="+237">🇨🇲 +237</option>
                                        <option value="+225">🇨🇮 +225</option>
                                        <option value="+221">🇸🇳 +221</option>
                                        <option value="+33">🇫🇷 +33</option>
                                        <option value="+32">🇧🇪 +32</option>
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
                            <label className="text-caption text-muted-foreground">{t('auth.email')} ({t('common.optional') || 'Optional'})</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => updateForm('email', e.target.value)}
                                    placeholder={t('auth.emailPlaceholder')}
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
                                </button>
                            </div>
                        </div>

                        {/* Country removed or optional for now */}
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
                            <div className="w-14 h-14 rounded-2xl bg-secondary/20 flex items-center justify-center mx-auto mb-3">
                                <Users className="w-7 h-7 text-secondary" />
                            </div>
                            <h2 className="text-headline text-foreground">{t('auth.joinNetwork')}</h2>
                            <p className="text-caption text-muted-foreground">{t('auth.addSponsorCode')}</p>
                        </div>

                        <GlassCard className="p-4 border-dashed border-2 border-border/30">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                                    <Users className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <h4 className="text-body font-semibold text-foreground">{t('auth.network')}</h4>
                                    <p className="text-caption text-muted-foreground mt-1">
                                        {t('auth.sponsorCodeHelp')}
                                    </p>
                                </div>
                            </div>
                        </GlassCard>

                        <div className="space-y-2">
                            <label className="text-caption text-muted-foreground">{t('auth.sponsorCode')}</label>
                            <div className="relative">
                                <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <input
                                    type="text"
                                    value={formData.sponsorId}
                                    onChange={(e) => updateForm('sponsorId', e.target.value)}
                                    placeholder={t('auth.sponsorCodePlaceholder')}
                                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-muted/30 border border-border/20 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
                                />
                            </div>
                        </div>

                        <motion.button
                            whileTap={{ scale: 0.98 }}
                            className="w-full btn-secondary flex items-center justify-center gap-2 py-4"
                        >
                            <QrCode className="w-5 h-5" />
                            {t('auth.scanQRCode')}
                        </motion.button>
                        <p className="text-xxs text-center text-muted-foreground">
                            {t('auth.skipSponsor')}
                        </p>
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
                            <div className="w-14 h-14 rounded-2xl bg-warning/20 flex items-center justify-center mx-auto mb-3">
                                <FileCheck className="w-7 h-7 text-warning" />
                            </div>
                            <h2 className="text-headline text-foreground">{t('auth.termsAndConditions')}</h2>
                            <p className="text-caption text-muted-foreground">{t('auth.reviewAndAccept')}</p>
                        </div>

                        <GlassCard className="p-4">
                            <label className="flex items-start gap-3 cursor-pointer">
                                <div className="relative mt-0.5">
                                    <input
                                        type="checkbox"
                                        checked={formData.termsAccepted}
                                        onChange={(e) => updateForm('termsAccepted', e.target.checked)}
                                        className="sr-only"
                                    />
                                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${formData.termsAccepted
                                        ? 'bg-primary border-primary'
                                        : 'border-border/50 bg-muted/30'
                                        }`}>
                                        {formData.termsAccepted && <CheckCircle className="w-3 h-3 text-primary-foreground" />}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-body text-foreground">{t('auth.acceptTerms')} {t('auth.termsOfService')}</p>
                                    <p className="text-caption text-muted-foreground">
                                        {t('common.read')} <button className="text-primary hover:underline">{t('auth.termsOfService')}</button> {t('auth.and')}{' '}
                                        <button className="text-primary hover:underline">{t('auth.privacyPolicy')}</button>
                                    </p>
                                </div>
                            </label>
                        </GlassCard>

                        <GlassCard className="p-4">
                            <label className="flex items-start gap-3 cursor-pointer">
                                <div className="relative mt-0.5">
                                    <input
                                        type="checkbox"
                                        checked={formData.kycAccepted}
                                        onChange={(e) => updateForm('kycAccepted', e.target.checked)}
                                        className="sr-only"
                                    />
                                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${formData.kycAccepted
                                        ? 'bg-primary border-primary'
                                        : 'border-border/50 bg-muted/30'
                                        }`}>
                                        {formData.kycAccepted && <CheckCircle className="w-3 h-3 text-primary-foreground" />}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-body text-foreground">{t('auth.kycNotice')}</p>
                                    <p className="text-caption text-muted-foreground">
                                        {t('auth.acceptKYC')}
                                    </p>
                                </div>
                            </label>
                        </GlassCard>

                        <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                            <p className="text-caption text-primary text-center">
                                🔒 {t('auth.securedBy')}
                            </p>
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
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
            </div>

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-10 mb-6"
            >
                <button
                    onClick={handleBack}
                    className="w-10 h-10 rounded-full glass-card flex items-center justify-center mb-4"
                >
                    <ArrowLeft className="w-5 h-5 text-foreground" />
                </button>

                {/* Progress Steps */}
                <div className="flex items-center justify-between">
                    {steps.map((step, index) => {
                        const Icon = step.icon;
                        const isActive = currentStep === step.id;
                        const isCompleted = currentStep > step.id;

                        return (
                            <div key={step.id} className="flex items-center">
                                <div className="flex flex-col items-center">
                                    <motion.div
                                        animate={{
                                            scale: isActive ? 1.1 : 1,
                                            backgroundColor: isCompleted || isActive
                                                ? 'hsl(165, 86%, 56%)'
                                                : 'hsl(165, 30%, 20%)',
                                        }}
                                        className="w-10 h-10 rounded-full flex items-center justify-center"
                                    >
                                        {isCompleted ? (
                                            <CheckCircle className="w-5 h-5 text-primary-foreground" />
                                        ) : (
                                            <Icon className={`w-5 h-5 ${isActive ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                                        )}
                                    </motion.div>
                                    <span className={`text-xxs mt-1 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                                        {t(step.title)}
                                    </span>
                                </div>
                                {index < steps.length - 1 && (
                                    <div className={`w-12 h-0.5 mx-2 ${isCompleted ? 'bg-primary' : 'bg-muted'}`} />
                                )}
                            </div>
                        );
                    })}
                </div>
            </motion.div>

            {/* Form Content */}
            <div className="flex-1 relative z-10">
                <GlassCard variant="solid" className="h-full">
                    <AnimatePresence mode="wait">
                        {renderStep()}
                    </AnimatePresence>
                </GlassCard>
            </div>

            {/* Actions */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="relative z-10 mt-6"
            >
                {currentStep < 3 ? (
                    <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={handleNext}
                        className="w-full btn-primary flex items-center justify-center gap-2 py-4"
                    >
                        {t('common.next')}
                        <ArrowRight className="w-5 h-5" />
                    </motion.button>
                ) : (
                    <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={handleComplete}
                        disabled={isLoading || !formData.termsAccepted || !formData.kycAccepted}
                        className="w-full btn-primary flex items-center justify-center gap-2 py-4 disabled:opacity-50 disabled:cursor-not-allowed"
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
            </motion.div>
        </motion.div>
    );
};

export default Register;
