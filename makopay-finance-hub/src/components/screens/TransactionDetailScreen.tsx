import { motion } from 'framer-motion';
import { ArrowLeft, Check, Copy, Share2, Printer, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '@/contexts/CurrencyContext';
import { toast } from 'sonner';

interface TransactionDetailScreenProps {
    transaction: {
        type: string;
        description: string;
        amount: number;
        reference: string;
        status: string;
        date: string;
        isCredit: boolean;
        currency?: string;
        phoneNumber?: string;
    };
    onBack: () => void;
}

const TransactionDetailScreen = ({ transaction, onBack }: TransactionDetailScreenProps) => {
    const { t } = useTranslation();
    const { formatCurrency: formatDefaultCurrency } = useCurrency();

    const formatAmount = (amount: number, currencyCode?: string) => {
        if (currencyCode === 'XAF' || currencyCode === 'FCFA') {
            return `${new Intl.NumberFormat('fr-FR').format(amount)} FCFA`;
        }
        return formatDefaultCurrency(amount);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(transaction.reference);
        toast.success('Référence copiée !');
    };

    const handleShare = () => {
        // Implement share logic if available, otherwise toast
        if (navigator.share) {
            navigator.share({
                title: 'Transaction MakoPay',
                text: `Transaction ${transaction.reference} - ${formatAmount(transaction.amount, transaction.currency)}`,
            });
        } else {
            toast.info('Partage non supporté sur ce navigateur');
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            style={{ paddingTop: '2.5rem' }}
        >
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={onBack}
                    className="w-10 h-10 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/40 flex items-center justify-center"
                >
                    <ArrowLeft className="w-5 h-5 text-foreground" />
                </motion.button>
                <h1 className="text-xl font-bold text-foreground">Détails de la transaction</h1>
            </div>

            {/* Main Content */}
            <div className="flex flex-col items-center mb-8">
                <div className="w-20 h-20 rounded-3xl bg-primary/20 flex items-center justify-center mb-4">
                    {/* Dynamic Icon based on type could go here, for now using Users as per screenshot or generic */}
                    <div className="text-3xl">
                        {transaction.type === 'commission' ? '👥' :
                            transaction.type === 'deposit' ? '💰' :
                                transaction.type === 'withdrawal' ? '🏦' : '📄'}
                    </div>
                </div>

                <h2 className={`text-3xl font-bold mb-1 ${transaction.isCredit ? 'text-primary' : 'text-foreground'}`}>
                    {transaction.isCredit ? '+' : '-'}{formatAmount(transaction.amount, transaction.currency)}
                </h2>
                <p className="text-muted-foreground mb-4">{transaction.description}</p>

                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 border border-primary/30">
                    <Check className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold text-primary capitalize">
                        {transaction.status === 'completed' ? 'Succès' :
                            transaction.status === 'pending' ? 'En attente' :
                                transaction.status === 'failed' ? 'Échec' : transaction.status}
                    </span>
                </div>
            </div>

            {/* Details Card */}
            <div className="bg-card/30 rounded-3xl p-6 border border-border/40 space-y-6 mb-8">
                {/* Row 1: Type */}
                <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Type</span>
                    <span className="font-semibold capitalize">{transaction.type}</span>
                </div>

                {/* Row 2: Date */}
                <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Date</span>
                    <span className="font-semibold">{transaction.date}</span>
                </div>

                {/* Row 3: Reference */}
                <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Référence</span>
                    <div className="flex items-center gap-2">
                        <span className="font-semibold">{transaction.reference}</span>
                        <button onClick={handleCopy} className="p-1.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                            <Copy className="w-3 h-3 text-muted-foreground" />
                        </button>
                    </div>
                </div>

                {/* Additional Row: Phone Number or Account for Withdrawal/Deposit */}
                {(transaction.type === 'withdrawal' || (transaction.type === 'deposit' && transaction.phoneNumber)) && (
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Compte / Numéro</span>
                        <span className="font-semibold">
                            {transaction.type === 'withdrawal' ? transaction.reference : transaction.phoneNumber}
                        </span>
                    </div>
                )}

                <div className="h-px bg-border/40 my-2" />

                {/* Row 4: Montant */}
                <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Montant</span>
                    <span className={`font-bold ${transaction.isCredit ? 'text-primary' : 'text-foreground'}`}>
                        {transaction.isCredit ? '+' : '-'}{formatAmount(transaction.amount, transaction.currency)}
                    </span>
                </div>

                {/* Row 5: Frais */}
                <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Frais</span>
                    <span className="font-semibold">
                        {transaction.type === 'withdrawal'
                            ? formatAmount(transaction.amount * 0.015, transaction.currency)
                            : formatAmount(0, transaction.currency)}
                    </span>
                </div>
            </div>

            {/* Footer Actions */}
            <div className="mt-auto">
                <Button
                    onClick={handleShare}
                    className="w-full py-6 rounded-2xl text-lg font-bold bg-transparent border border-primary/30 text-white hover:bg-primary/10 mb-6"
                >
                    <Share2 className="w-5 h-5 mr-2" />
                    Partager
                </Button>

                <div className="flex items-center justify-center gap-2 text-muted-foreground/50 text-xs">
                    <Lock className="w-3 h-3" />
                    <span>Sécurisé par MakoPay</span>
                </div>
            </div>

        </motion.div>
    );
};

export default TransactionDetailScreen;
