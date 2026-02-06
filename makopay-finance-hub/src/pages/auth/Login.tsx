import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { motion } from 'framer-motion';
import { Phone, Lock, Eye, EyeOff, Fingerprint, ArrowRight, Loader2 } from 'lucide-react';
import { useTranslation } from "react-i18next";
import GlassCard from "@/components/makopay/GlassCard";

const Login = () => {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const handleLogin = async () => {
        if (!phoneNumber || !password) {
            toast.error("Please fill in all fields");
            return;
        }

        setLoading(true);
        try {
            const { data } = await api.post("/auth/login", { phoneNumber, password });
            login(data.access_token, data.user);
            toast.success("Welcome back!");
            navigate("/dashboard");
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Login failed");
        } finally {
            setLoading(false);
        }
    };

    const onRegister = () => {
        navigate('/auth/register');
    }

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
                <h1 className="text-title text-foreground glow-text">{t('auth.welcomeBack')}</h1>
                <p className="text-caption text-muted-foreground mt-1">{t('auth.accessEcosystem')}</p>
            </motion.div>

            {/* Login Form */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="relative z-10"
            >
                <GlassCard variant="solid" className="space-y-4">
                    {/* Phone Field */}
                    <div className="space-y-2">
                        <label className="text-caption text-muted-foreground">{t('auth.phoneNumber')}</label>
                        <div className="relative">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <input
                                type="tel"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                placeholder="+1 234 567 8900"
                                className="w-full pl-12 pr-4 py-3 rounded-xl bg-muted/30 border border-border/20 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
                                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
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
                                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
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
                        <button
                            onClick={() => navigate('/auth/forgot-password')}
                            className="text-caption text-primary hover:underline"
                        >
                            {t('auth.forgotPassword')}
                        </button>
                    </div>

                    {/* Login Button */}
                    <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={handleLogin}
                        disabled={loading}
                        className="w-full btn-primary flex items-center justify-center gap-2 py-4"
                    >
                        {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                <Lock className="w-4 h-4" />
                                {t('auth.login')}
                                <ArrowRight className="w-4 h-4" />
                            </>
                        )}
                    </motion.button>

                    {/* Divider */}
                    <div className="flex items-center gap-4">
                        <div className="flex-1 h-px bg-border/30" />
                        <span className="text-xxs text-muted-foreground">{t('auth.orContinue')}</span>
                        <div className="flex-1 h-px bg-border/30" />
                    </div>

                    {/* Biometric Button */}
                    <motion.button
                        whileTap={{ scale: 0.98 }}
                        className="w-full btn-secondary flex items-center justify-center gap-2 py-4"
                    >
                        <Fingerprint className="w-5 h-5" />
                        {t('auth.useBiometrics')}
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
                        {t('auth.createOne')}
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
                <span className="text-xxs text-muted-foreground">{t('auth.securedBy')}</span>
            </motion.div>
        </motion.div>
    );
};

export default Login;
