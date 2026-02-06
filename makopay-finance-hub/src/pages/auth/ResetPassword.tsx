import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, Check, Loader2, ArrowLeft } from 'lucide-react';
import { useTranslation } from "react-i18next";
import GlassCard from "@/components/makopay/GlassCard";

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const phoneNumber = searchParams.get('phone') || '';

    const [otpCode, setOtpCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const navigate = useNavigate();
    const { t } = useTranslation();

    const handleResendCode = async () => {
        setResendLoading(true);
        try {
            await api.post("/auth/forgot-password", { phoneNumber });
            toast.success(t('auth.codeResent'));
        } catch (error: any) {
            toast.error(error.response?.data?.message || t('auth.errorSendingCode'));
        } finally {
            setResendLoading(false);
        }
    };

    const handleResetPassword = async () => {
        if (!otpCode || !newPassword || !confirmPassword) {
            toast.error(t('auth.fillAllFields'));
            return;
        }

        if (newPassword.length < 6) {
            toast.error(t('auth.passwordTooShort'));
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error(t('auth.passwordMismatch'));
            return;
        }

        setLoading(true);
        try {
            await api.post("/auth/reset-password", {
                phoneNumber,
                otpCode,
                newPassword
            });
            toast.success(t('auth.passwordUpdated'));
            navigate('/auth/login');
        } catch (error: any) {
            toast.error(error.response?.data?.message || t('auth.invalidCode'));
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
                onClick={() => navigate('/auth/forgot-password')}
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
                    <Lock className="w-8 h-8 text-background" />
                </div>
                <h1 className="text-title text-foreground glow-text">{t('auth.resetPasswordTitle')}</h1>
                <p className="text-caption text-muted-foreground mt-1">
                    {t('auth.codeSentTo')} {phoneNumber}
                </p>
            </motion.div>

            {/* Form */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="relative z-10"
            >
                <GlassCard variant="solid" className="space-y-4">
                    {/* OTP Field */}
                    <div className="space-y-2">
                        <label className="text-caption text-muted-foreground">{t('auth.enterCode')}</label>
                        <input
                            type="text"
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="000000"
                            maxLength={6}
                            className="w-full px-4 py-3 rounded-xl bg-muted/30 border border-border/20 text-foreground text-center text-2xl font-mono tracking-widest placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
                        />
                    </div>

                    {/* New Password Field */}
                    <div className="space-y-2">
                        <label className="text-caption text-muted-foreground">{t('auth.newPassword')}</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
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

                    {/* Confirm Password Field */}
                    <div className="space-y-2">
                        <label className="text-caption text-muted-foreground">{t('auth.confirmPassword')}</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full pl-12 pr-12 py-3 rounded-xl bg-muted/30 border border-border/20 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
                                onKeyDown={(e) => e.key === 'Enter' && handleResetPassword()}
                            />
                            {confirmPassword && newPassword === confirmPassword && (
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500">
                                    <Check className="w-5 h-5" />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Reset Button */}
                    <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={handleResetPassword}
                        disabled={loading}
                        className="w-full btn-primary flex items-center justify-center gap-2 py-4"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                {t('common.processing')}
                            </>
                        ) : (
                            <>
                                <Check className="w-4 h-4" />
                                {t('auth.resetPassword')}
                            </>
                        )}
                    </motion.button>

                    {/* Resend Code */}
                    <button
                        onClick={handleResendCode}
                        disabled={resendLoading}
                        className="w-full text-xs text-primary hover:underline disabled:opacity-50"
                    >
                        {resendLoading ? t('common.sending') : t('auth.resendCode')}
                    </button>
                </GlassCard>
            </motion.div>
        </motion.div>
    );
};

export default ResetPassword;
