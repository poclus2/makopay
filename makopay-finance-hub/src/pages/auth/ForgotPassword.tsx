import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { motion } from 'framer-motion';
import { Phone, ArrowRight, Loader2, ArrowLeft } from 'lucide-react';
import { useTranslation } from "react-i18next";
import GlassCard from "@/components/makopay/GlassCard";

const ForgotPassword = () => {
    const [countryCode, setCountryCode] = useState('+237');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { t } = useTranslation();

    const handleSendCode = async () => {
        if (!phoneNumber) {
            toast.error(t('auth.enterPhone'));
            return;
        }

        const fullPhoneNumber = countryCode + phoneNumber;

        setLoading(true);
        try {
            await api.post("/auth/forgot-password", { phoneNumber: fullPhoneNumber });
            toast.success(t('auth.codeSent'));
            navigate(`/auth/reset-password?phone=${encodeURIComponent(fullPhoneNumber)}`);
        } catch (error: any) {
            toast.error(error.response?.data?.message || t('auth.errorSendingCode'));
        } finally {
            setLoading(false);
        }
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

            {/* Back Button */}
            <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => navigate('/auth/login')}
                className="absolute top-6 left-6 p-2 rounded-xl bg-muted/30 text-foreground hover:bg-muted/50 transition-colors z-10"
            >
                <ArrowLeft className="w-5 h-5" />
            </motion.button>

            {/* Logo */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-8 relative z-10"
            >
                <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4 shadow-glow">
                    <svg viewBox="0 0 48 48" className="w-10 h-10" fill="none">
                        <path d="M24 4L4 14v20l20 10 20-10V14L24 4z" stroke="hsl(165, 33%, 3%)" strokeWidth="2" fill="none" />
                        <circle cx="24" cy="20" r="6" fill="hsl(165, 33%, 3%)" />
                    </svg>
                </div>
                <h1 className="text-title text-foreground glow-text">{t('auth.forgotPasswordTitle')}</h1>
                <p className="text-caption text-muted-foreground mt-1">{t('auth.enterPhoneForCode')}</p>
            </motion.div>

            {/* Form */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="relative z-10"
            >
                <GlassCard variant="solid" className="space-y-6">
                    {/* Phone Field */}
                    <div className="space-y-2">
                        <label className="text-caption text-muted-foreground">{t('auth.phoneNumber')}</label>
                        <div className="flex gap-2">
                            <select
                                value={countryCode}
                                onChange={(e) => setCountryCode(e.target.value)}
                                className="w-24 px-3 py-3 rounded-xl bg-muted/30 border border-border/20 text-foreground focus:outline-none focus:border-primary/50 transition-colors"
                            >
                                <option value="+237">CM +237</option>
                                <option value="+33">FR +33</option>
                                <option value="+1">US +1</option>
                            </select>
                            <div className="relative flex-1">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <input
                                    type="tel"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    placeholder="674673634"
                                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-muted/30 border border-border/20 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
                                    onKeyDown={(e) => e.key === 'Enter' && handleSendCode()}
                                />
                            </div>
                        </div>
                        <p className="text-xxs text-muted-foreground">
                            {t('auth.codeWillBeSent')}
                        </p>
                    </div>

                    {/* Send Code Button */}
                    <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={handleSendCode}
                        disabled={loading}
                        className="w-full btn-primary flex items-center justify-center gap-2 py-4"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                {t('common.sending')}
                            </>
                        ) : (
                            <>
                                {t('auth.sendCode')}
                                <ArrowRight className="w-4 h-4" />
                            </>
                        )}
                    </motion.button>
                </GlassCard>
            </motion.div>

            {/* Back to Login Link */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-center mt-6 relative z-10"
            >
                <button
                    onClick={() => navigate('/auth/login')}
                    className="text-caption text-primary hover:underline"
                >
                    {t('auth.backToLogin')}
                </button>
            </motion.div>
        </motion.div>
    );
};

export default ForgotPassword;
