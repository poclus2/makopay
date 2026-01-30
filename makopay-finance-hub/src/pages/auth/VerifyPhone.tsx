import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, ArrowRight, Loader2, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import GlassCard from '@/components/makopay/GlassCard';

const VerifyPhone = () => {
    const [code, setCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();
    const { t } = useTranslation();

    const phoneNumber = location.state?.phoneNumber;

    useEffect(() => {
        if (!phoneNumber) {
            toast.error(t('auth.missingPhoneNumber') || 'Phone number missing');
            navigate('/auth/register');
        }
    }, [phoneNumber, navigate, t]);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (resendCooldown > 0) {
            interval = setInterval(() => {
                setResendCooldown((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [resendCooldown]);

    const handleVerify = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!code || code.length < 6) return;

        setIsLoading(true);
        try {
            const response = await api.post('/auth/verify-phone', {
                phoneNumber,
                code
            });

            const { access_token, user } = response.data;
            login(access_token, user);
            toast.success(t('auth.verificationSuccess') || 'Phone verified successfully!');
            navigate('/dashboard');
        } catch (error: any) {
            toast.error(error.response?.data?.message || t('auth.verificationFailed') || 'Verification failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        if (resendCooldown > 0) return;

        try {
            await api.post('/auth/resend-code', { phoneNumber });
            toast.success(t('auth.codeResent') || 'Code resent successfully');
            setResendCooldown(60);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to resend code');
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen flex flex-col items-center justify-center p-6 gradient-dark"
        >
            {/* Background Glow */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md relative z-10"
            >
                <div className="text-center mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-4">
                        <ShieldCheck className="w-8 h-8 text-primary" />
                    </div>
                    <h1 className="text-2xl font-bold text-foreground mb-2">
                        {t('auth.verifyPhone') || 'Verify Phone'}
                    </h1>
                    <p className="text-muted-foreground">
                        {t('auth.enterCodeSentTo') || 'Enter the code sent to'} <span className="text-foreground font-medium">{phoneNumber}</span>
                    </p>
                </div>

                <GlassCard className="p-6">
                    <form onSubmit={handleVerify} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm text-muted-foreground">
                                {t('auth.verificationCode') || 'Verification Code'}
                            </label>
                            <input
                                type="text"
                                value={code}
                                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                placeholder="123456"
                                className="w-full text-center text-2xl tracking-widest py-3 rounded-xl bg-muted/30 border border-border/20 text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary/50 transition-colors"
                                autoFocus
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading || code.length < 6}
                            className="w-full btn-primary flex items-center justify-center gap-2 py-4 disabled:opacity-50"
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    {t('common.verify') || 'Verify'}
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <button
                            onClick={handleResend}
                            disabled={resendCooldown > 0}
                            className={`text-sm flex items-center justify-center gap-2 mx-auto ${resendCooldown > 0 ? 'text-muted-foreground cursor-not-allowed' : 'text-primary hover:underline'
                                }`}
                        >
                            <RefreshCw className={`w-4 h-4 ${resendCooldown > 0 ? 'animate-spin' : ''}`} />
                            {resendCooldown > 0
                                ? `${t('auth.resendIn') || 'Resend in'} ${resendCooldown}s`
                                : t('auth.resendCode') || 'Resend Code'
                            }
                        </button>
                    </div>
                </GlassCard>
            </motion.div>
        </motion.div>
    );
};

export default VerifyPhone;
