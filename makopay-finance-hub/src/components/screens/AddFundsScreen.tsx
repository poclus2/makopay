import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CreditCard, Building2, Smartphone, QrCode, Copy, Check, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '@/contexts/CurrencyContext';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Loader2 } from 'lucide-react';

interface AddFundsScreenProps {
  onBack: () => void;
  onComplete: () => void;
}

const quickAmounts = [1000, 5000, 10000, 25000, 50000];

const mobileOperators = [
  {
    id: 'orange',
    name: 'Orange Money',
    color: '#FF7900',
    instructionTemplate: "#150*1*1*686665098*{amount}#",
    description: "Composez le code USSD ci-dessous",
    logo: Smartphone
  },
  {
    id: 'mtn',
    name: 'MTN Mobile Money',
    color: '#FFCC00',
    instructionTemplate: "*126*1*1*653304851*{amount}*codesecret#",
    description: "Composez le code USSD ci-dessous",
    logo: Smartphone
  }
];

type Step = 'amount' | 'operator' | 'instructions' | 'success';

export const AddFundsScreen = ({ onBack, onComplete }: AddFundsScreenProps) => {
  const { t } = useTranslation();
  const { currency, formatCurrency } = useCurrency();

  const [step, setStep] = useState<Step>('amount');
  const [selectedMethod, setSelectedMethod] = useState<string | null>('mobile');
  const [selectedOperator, setSelectedOperator] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [copied, setCopied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [depositResult, setDepositResult] = useState<any>(null);
  const [payerPhoneNumber, setPayerPhoneNumber] = useState('');

  const paymentMethods = [
    { id: 'card', icon: CreditCard, label: t('addFunds.methods.card.label'), description: t('addFunds.methods.card.description'), disabled: true },
    { id: 'bank', icon: Building2, label: t('addFunds.methods.bank.label'), description: t('addFunds.methods.bank.description'), disabled: true },
    { id: 'mobile', icon: Smartphone, label: t('addFunds.methods.mobile.label'), description: t('addFunds.methods.mobile.description'), disabled: false },
    { id: 'qr', icon: QrCode, label: t('addFunds.methods.qr.label'), description: t('addFunds.methods.qr.description'), disabled: true },
  ];

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success(t('addFunds.copySuccess'));
    setTimeout(() => setCopied(false), 2000);
  };

  const currentOperator = mobileOperators.find(op => op.id === selectedOperator);
  const displayCurrency = selectedMethod === 'mobile' ? 'FCFA' : currency;

  const handleSubmit = async () => {
    if (!amount || !selectedMethod) return;

    setIsProcessing(true);
    try {
      const { data } = await api.post('/wallet/deposit', {
        amount: Number(amount),
        method: selectedMethod,
        payerPhoneNumber,
        currency: selectedMethod === 'mobile' ? 'XAF' : 'EUR',
      });
      setDepositResult(data);
      setStep('success');
      toast.success(t('common.success'));
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('errors.somethingWentWrong'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBack = () => {
    if (step === 'instructions') {
      setStep('operator');
      return;
    }
    if (step === 'operator') {
      setStep('amount');
      return;
    }
    onBack();
  };

  const handleContinue = () => {
    if (step === 'amount' && selectedMethod === 'mobile') {
      setStep('operator');
    }
  };

  // Render Success View
  if (step === 'success' && depositResult) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen p-4 safe-top safe-bottom flex flex-col items-center justify-center text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mb-6"
        >
          <Check className="w-12 h-12 text-primary" />
        </motion.div>

        <h2 className="text-2xl font-bold text-foreground mb-2">Demande envoyée !</h2>
        <p className="text-muted-foreground mb-8">
          Votre demande de dépôt de <span className="text-primary font-bold">
            {selectedMethod === 'mobile'
              ? `${new Intl.NumberFormat('fr-FR').format(Number(amount))} ${displayCurrency}`
              : formatCurrency(Number(amount))}
          </span> a été enregistrée.
        </p>

        <div className="w-full max-w-sm bg-card/50 p-6 rounded-2xl border border-border/40 mb-8">
          <p className="text-sm text-muted-foreground mb-2">{t('addFunds.referenceCode')}</p>
          <div className="flex items-center justify-between bg-muted/30 p-3 rounded-xl">
            <code className="text-lg font-mono font-bold text-foreground">{depositResult.referenceCode}</code>
            <button onClick={() => handleCopy(depositResult.referenceCode)} className="p-2 hover:bg-muted/50 rounded-lg">
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
            </button>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-8 max-w-xs mx-auto">
          Veuillez conserver ce code de référence. Votre compte sera crédité après validation.
        </p>

        <Button onClick={onComplete} className="w-full max-w-sm py-6 rounded-2xl text-lg font-bold">
          Retour au portefeuille
        </Button>
      </motion.div>
    );
  }

  const getTitle = () => {
    switch (step) {
      case 'operator': return "Choisir l'opérateur";
      case 'instructions': return "Instructions";
      default: return t('addFunds.title');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="min-h-screen p-4 safe-top safe-bottom"
      style={{ paddingTop: '2.5rem' }}
    >
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleBack}
          className="w-10 h-10 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/40 flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </motion.button>
        <div>
          <h1 className="text-xl font-bold text-foreground">{getTitle()}</h1>
          <p className="text-sm text-muted-foreground">{t('addFunds.subtitle')}</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 'amount' && (
          <motion.div
            key="amount"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            {/* Amount Input */}
            <div className="mb-6">
              <div className="relative p-6 rounded-3xl bg-gradient-to-br from-primary/20 to-secondary/10 border border-primary/30 backdrop-blur-sm">
                <label className="text-sm text-muted-foreground mb-2 block">{t('addFunds.amountToAdd')}</label>
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-bold text-primary">{displayCurrency}</span>
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    className="text-4xl font-bold bg-transparent border-none text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-0 p-0 h-auto"
                  />
                </div>

                {/* Quick amounts */}
                <div className="flex flex-wrap gap-2 mt-4">
                  {quickAmounts.map((quickAmount) => (
                    <motion.button
                      key={quickAmount}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setAmount(quickAmount.toString())}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${amount === quickAmount.toString()
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card/50 text-foreground border border-border/40 hover:border-primary/50'
                        }`}
                    >
                      {new Intl.NumberFormat('fr-FR').format(quickAmount)}
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">{t('addFunds.paymentMethod')}</h2>
              <div className="grid grid-cols-2 gap-3">
                {paymentMethods.map((method, index) => {
                  const Icon = method.icon;
                  const isSelected = selectedMethod === method.id;

                  return (
                    <motion.button
                      key={method.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + index * 0.05 }}
                      whileTap={{ scale: (method as any).disabled ? 1 : 0.95 }}
                      onClick={() => !(method as any).disabled && setSelectedMethod(method.id)}
                      disabled={(method as any).disabled}
                      className={`relative p-4 rounded-2xl text-left transition-all overflow-hidden ${isSelected
                        ? 'bg-gradient-to-br from-primary/30 to-secondary/20 border-2 border-primary shadow-[0_0_20px_hsl(165_86%_56%/0.3)]'
                        : (method as any).disabled
                          ? 'bg-card/20 border border-border/20 opacity-50 cursor-not-allowed'
                          : 'bg-card/50 backdrop-blur-sm border border-border/40 hover:border-primary/50'
                        }`}
                    >
                      {isSelected && (
                        <motion.div
                          layoutId="selectedMethod"
                          className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent"
                        />
                      )}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${isSelected ? 'bg-primary/20' : 'bg-muted/50'
                        }`}>
                        <Icon className={`w-5 h-5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                      </div>
                      <p className="font-semibold text-foreground text-sm">{method.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{method.description}</p>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Continue Button */}
            <div className="mt-8">
              <Button
                onClick={handleContinue}
                disabled={!amount || !selectedMethod}
                className="w-full py-6 rounded-2xl text-lg font-bold shadow-lg"
              >
                Continuer
              </Button>
            </div>
          </motion.div>
        )}

        {step === 'operator' && (
          <motion.div
            key="operator"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <h2 className="text-lg font-semibold text-foreground mb-4">Sélectionnez votre opérateur</h2>
            <div className="flex flex-col gap-3">
              {mobileOperators.map((op, index) => (
                <motion.button
                  key={op.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setSelectedOperator(op.id);
                    setStep('instructions');
                  }}
                  className="flex items-center p-4 rounded-2xl bg-card/50 border border-border/40 hover:border-primary/50 transition-all"
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mr-4" style={{ backgroundColor: `${op.color}20` }}>
                    <Smartphone className="w-6 h-6" style={{ color: op.color }} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-bold text-foreground">{op.name}</p>
                    <p className="text-xs text-muted-foreground">Cameroun</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {step === 'instructions' && currentOperator && (
          <motion.div
            key="instructions"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col h-full"
          >
            <div className="bg-card/30 p-6 rounded-3xl border border-border/40 mb-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${currentOperator.color}20` }}>
                  <Smartphone className="w-5 h-5" style={{ color: currentOperator.color }} />
                </div>
                <h3 className="font-bold text-lg">{currentOperator.name}</h3>
              </div>

              <div className="space-y-4">
                <p className="text-sm text-foreground/80">
                  Merci de saisir le code suivant pour effectuer votre dépôt sur notre plateforme :
                </p>

                <div className="bg-black/20 p-4 rounded-xl text-center backdrop-blur-sm border border-white/5">
                  <p className="text-xs text-muted-foreground mb-1">Code USSD à composer</p>
                  <div className="flex items-center justify-center gap-3">
                    <code className="text-xl font-mono font-bold text-primary">
                      {currentOperator.instructionTemplate.replace('{amount}', amount)}
                    </code>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => handleCopy(currentOperator.instructionTemplate.replace('{amount}', amount))}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <p className="text-sm text-foreground/80">
                  Ensuite insérez votre code secret pour valider votre dépôt.
                </p>

                <div className="flex items-start gap-3 bg-blue-500/10 p-3 rounded-lg border border-blue-500/20">
                  <div className="w-5 h-5 mt-0.5 text-blue-400">ℹ️</div>
                  <p className="text-xs text-blue-200/80 leading-relaxed">
                    Votre dépôt sera automatiquement crédité sur votre compte une fois la transaction validée par le réseau.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-auto pb-8">
              <div className="mb-6">
                <label className="text-sm text-foreground/80 mb-2 block">
                  Numéro de téléphone payeur
                </label>
                <Input
                  placeholder="Ex: 699000000"
                  value={payerPhoneNumber}
                  onChange={(e) => setPayerPhoneNumber(e.target.value)}
                  className="bg-card/50 border-border/40 text-foreground"
                />
              </div>

              <p className="text-center text-sm text-muted-foreground mb-4">
                Avez-vous effectué le paiement ?
              </p>
              <Button
                onClick={handleSubmit}
                disabled={isProcessing || !payerPhoneNumber || payerPhoneNumber.length < 9}
                className="w-full py-6 rounded-2xl text-lg font-bold bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-[0_4px_20px_hsl(165_86%_56%/0.4)] disabled:opacity-50"
              >
                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : "J'ai effectué le paiement"}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AddFundsScreen;
