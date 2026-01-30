import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Upload, Check, Camera, Shield, FileText, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import GlassCard from '../makopay/GlassCard';
import api from '@/lib/api';

export default function KycScreen({ onBack }: { onBack: () => void }) {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [documentType, setDocumentType] = useState<'CNI' | 'PASSPORT'>('CNI');
    const [images, setImages] = useState<{ front: string | null, back: string | null, selfie: string | null }>({
        front: null,
        back: null,
        selfie: null
    });
    const [loading, setLoading] = useState(false);

    const handleFileUpload = (type: 'front' | 'back' | 'selfie', e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // In a real app, upload to S3/Cloudinary here and get URL
            // For now, we simulate by creating a local object URL
            const url = URL.createObjectURL(file);
            setImages(prev => ({ ...prev, [type]: url }));
            toast.success("Document téléchargé");
        }
    };

    const handleSubmit = async () => {
        if (!images.front || (!images.back && documentType === 'CNI') || !images.selfie) {
            toast.error("Veuillez envoyer tous les documents requis");
            return;
        }

        setLoading(true);
        try {
            // Mock upload - in reality we would upload files first, then send URLs
            await api.post('/users/kyc', {
                documentType,
                frontUrl: images.front,
                backUrl: images.back,
                selfieUrl: images.selfie
            });
            toast.success("KYC soumis avec succès! En attente de validation.");
            onBack();
        } catch (error) {
            toast.error("Erreur lors de la soumission");
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="min-h-screen p-4 safe-top safe-bottom"
            style={{ paddingTop: '2.5rem' }}
        >
            <div className="flex items-center gap-3 mb-6">
                <button onClick={onBack} className="w-10 h-10 rounded-full glass-card flex items-center justify-center">
                    <ArrowLeft className="w-5 h-5 text-foreground" />
                </button>
                <h1 className="text-title text-foreground">Vérification KYC</h1>
            </div>

            <div className="space-y-6">
                <GlassCard className="p-4">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <Shield className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-body font-semibold text-foreground">Identité</h2>
                            <p className="text-caption text-muted-foreground">Vérifiez votre identité pour débloquer toutes les fonctionnalités.</p>
                        </div>
                    </div>
                </GlassCard>

                {/* Step 1: Info */}
                <GlassCard className="p-4 space-y-4">
                    <h3 className="text-body font-medium text-foreground">Type de document</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => setDocumentType('CNI')}
                            className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-colors ${documentType === 'CNI' ? 'bg-primary/10 border-primary text-primary' : 'bg-transparent border-border text-muted-foreground'}`}
                        >
                            <FileText className="w-6 h-6" />
                            <span className="text-xs font-semibold">CNI</span>
                        </button>
                        <button
                            onClick={() => setDocumentType('PASSPORT')}
                            className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-colors ${documentType === 'PASSPORT' ? 'bg-primary/10 border-primary text-primary' : 'bg-transparent border-border text-muted-foreground'}`}
                        >
                            <FileText className="w-6 h-6" />
                            <span className="text-xs font-semibold">Passeport</span>
                        </button>
                    </div>
                </GlassCard>

                {/* Step 2: Uploads */}
                <GlassCard className="p-4 space-y-6">
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-foreground flex items-center gap-2">
                            <FileText className="w-4 h-4 text-primary" />
                            Recto du document
                        </label>
                        <div className="relative h-32 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center bg-background/50 hover:bg-background/80 transition-colors">
                            {images.front ? (
                                <img src={images.front} alt="Front" className="w-full h-full object-cover rounded-xl" />
                            ) : (
                                <div className="text-center p-4 cursor-pointer">
                                    <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                                    <span className="text-xs text-muted-foreground">Appuyez pour télécharger</span>
                                </div>
                            )}
                            <input type="file" onChange={(e) => handleFileUpload('front', e)} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
                        </div>
                    </div>

                    {documentType === 'CNI' && (
                        <div className="space-y-3">
                            <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                <FileText className="w-4 h-4 text-primary" />
                                Verso du document
                            </label>
                            <div className="relative h-32 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center bg-background/50 hover:bg-background/80 transition-colors">
                                {images.back ? (
                                    <img src={images.back} alt="Back" className="w-full h-full object-cover rounded-xl" />
                                ) : (
                                    <div className="text-center p-4 cursor-pointer">
                                        <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                                        <span className="text-xs text-muted-foreground">Appuyez pour télécharger</span>
                                    </div>
                                )}
                                <input type="file" onChange={(e) => handleFileUpload('back', e)} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
                            </div>
                        </div>
                    )}

                    <div className="space-y-3">
                        <label className="text-sm font-medium text-foreground flex items-center gap-2">
                            <User className="w-4 h-4 text-primary" />
                            Selfie avec le document
                        </label>
                        <div className="relative h-48 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center bg-background/50 hover:bg-background/80 transition-colors">
                            {images.selfie ? (
                                <img src={images.selfie} alt="Selfie" className="w-full h-full object-cover rounded-xl" />
                            ) : (
                                <div className="text-center p-4 cursor-pointer">
                                    <Camera className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                                    <span className="text-xs text-muted-foreground">Prendre un selfie</span>
                                </div>
                            )}
                            <input type="file" onChange={(e) => handleFileUpload('selfie', e)} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*,capture=user" />
                        </div>
                    </div>
                </GlassCard>

                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-lg shadow-lg shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check className="w-5 h-5" />}
                    Soumettre verification
                </button>
            </div>
        </motion.div>
    );
}
