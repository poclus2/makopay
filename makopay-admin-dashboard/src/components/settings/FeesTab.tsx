import { useState, useEffect } from 'react';
import { Save, Percent, AlertCircle } from 'lucide-react';
import api from '../../lib/api';
import { toast } from 'sonner';

interface Fees {
    depositFeePercent: number;
    withdrawalFeePercent: number;
    orderFeePercent: number;
}

export function FeesTab() {
    const [fees, setFees] = useState<Fees>({
        depositFeePercent: 0,
        withdrawalFeePercent: 0,
        orderFeePercent: 0
    });
    const [locationFees, setLocationFees] = useState<Fees>({ // For resetting or comparing? Not needed for simple form
        depositFeePercent: 0,
        withdrawalFeePercent: 0,
        orderFeePercent: 0
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchFees();
    }, []);

    const fetchFees = async () => {
        try {
            const { data } = await api.get('/settings/fees');
            setFees(data);
            setLocationFees(data);
        } catch (error) {
            console.error('Failed to fetch fees', error);
            toast.error('Impossible de charger les frais');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.put('/settings/fees', fees);
            toast.success('Frais mis à jour avec succès');
            setLocationFees(fees);
        } catch (error) {
            console.error('Failed to update fees', error);
            toast.error('Erreur lors de la mise à jour');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-slate-500">Chargement des paramètres...</div>;
    }

    return (
        <div className="max-w-4xl space-y-8">
            <div>
                <h2 className="text-xl font-semibold text-slate-900">Frais & Commissions</h2>
                <p className="text-sm text-slate-500 mt-1">
                    Définissez les frais appliqués automatiquement aux transactions.
                    <br />
                    <span className="text-amber-600 flex items-center gap-1 mt-1 text-xs">
                        <AlertCircle size={12} />
                        Les changements s'appliquent immédiatement aux nouvelles transactions.
                    </span>
                </p>
            </div>

            <form onSubmit={handleSave} className="space-y-6 bg-white p-6 rounded-xl border border-slate-200">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {/* Deposit Fee */}
                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-slate-700">Frais de Dépôt (%)</label>
                        <div className="relative">
                            <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                value={fees.depositFeePercent}
                                onChange={(e) => setFees({ ...fees, depositFeePercent: parseFloat(e.target.value) || 0 })}
                                className="w-full pl-4 pr-10 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                            />
                            <div className="absolute inset-y-0 right-0 p-3 flex items-center pointer-events-none text-slate-400">
                                <Percent size={16} />
                            </div>
                        </div>
                        <p className="text-xs text-slate-500">
                            Appliqué sur le montant brut envoyé par l'utilisateur.
                        </p>
                    </div>

                    {/* Withdrawal Fee */}
                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-slate-700">Frais de Retrait (%)</label>
                        <div className="relative">
                            <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                value={fees.withdrawalFeePercent}
                                onChange={(e) => setFees({ ...fees, withdrawalFeePercent: parseFloat(e.target.value) || 0 })}
                                className="w-full pl-4 pr-10 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                            />
                            <div className="absolute inset-y-0 right-0 p-3 flex items-center pointer-events-none text-slate-400">
                                <Percent size={16} />
                            </div>
                        </div>
                        <p className="text-xs text-slate-500">
                            Ajouté au montant lors de la demande de retrait.
                        </p>
                    </div>

                    {/* Order Fee */}
                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-slate-700">Frais e-commerce (%)</label>
                        <div className="relative">
                            <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                value={fees.orderFeePercent}
                                onChange={(e) => setFees({ ...fees, orderFeePercent: parseFloat(e.target.value) || 0 })}
                                className="w-full pl-4 pr-10 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                            />
                            <div className="absolute inset-y-0 right-0 p-3 flex items-center pointer-events-none text-slate-400">
                                <Percent size={16} />
                            </div>
                        </div>
                        <p className="text-xs text-slate-500">
                            Commission sur les achats de produits (futur usage).
                        </p>
                    </div>
                </div>

                <div className="pt-4 flex justify-end">
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 font-medium"
                    >
                        <Save size={18} />
                        {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
                    </button>
                </div>
            </form>
        </div>
    );
}
