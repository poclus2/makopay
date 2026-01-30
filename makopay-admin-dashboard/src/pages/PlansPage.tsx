import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import { Plus, Edit2, Trash2, X, TrendingUp } from 'lucide-react'
import { useState } from 'react'

const XOF_RATE = 655.957;

interface InvestmentPlan {
    id: string
    name: string
    durationDays: number
    yieldPercent: number
    payoutFrequency: string
    minAmount: number
    maxAmount?: number
    createdAt: string
}

export default function PlansPage() {
    const queryClient = useQueryClient()
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingPlan, setEditingPlan] = useState<InvestmentPlan | null>(null)
    const [formData, setFormData] = useState({
        name: '',
        durationDays: 30,
        yieldPercent: 5,
        payoutFrequency: 'DAILY',
        minAmount: 5000,
        maxAmount: ''
    })

    const { data: plans, isLoading } = useQuery<InvestmentPlan[]>({
        queryKey: ['plans'],
        queryFn: async () => {
            const { data } = await api.get('/investments/plans')
            return data
        },
    })

    const createMutation = useMutation({
        mutationFn: async (data: any) => {
            return api.post('/investments/plans', data)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['plans'] })
            closeModal()
        }
    })

    const updateMutation = useMutation({
        mutationFn: async (data: any) => {
            const { id, ...rest } = data
            return api.patch(`/investments/plans/${id}`, rest)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['plans'] })
            closeModal()
        }
    })

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            return api.delete(`/investments/plans/${id}`)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['plans'] })
        }
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        const payload = {
            ...formData,
            // Convert XAF to EUR
            maxAmount: formData.maxAmount ? Number(formData.maxAmount) / XOF_RATE : undefined,
            minAmount: Number(formData.minAmount) / XOF_RATE,
            yieldPercent: Number(formData.yieldPercent),
            durationDays: Number(formData.durationDays),
        }

        if (editingPlan) {
            updateMutation.mutate({ id: editingPlan.id, ...payload })
        } else {
            createMutation.mutate(payload)
        }
    }

    const openEditModal = (plan: InvestmentPlan) => {
        setEditingPlan(plan)
        setFormData({
            name: plan.name,
            durationDays: Number(plan.durationDays),
            yieldPercent: Number(plan.yieldPercent),
            payoutFrequency: plan.payoutFrequency,
            // Convert EUR to XAF
            minAmount: Math.round(Number(plan.minAmount) * XOF_RATE),
            maxAmount: plan.maxAmount ? String(Math.round(Number(plan.maxAmount) * XOF_RATE)) : ''
        })
        setIsModalOpen(true)
    }

    const closeModal = () => {
        setIsModalOpen(false)
        setEditingPlan(null)
        setFormData({
            name: '',
            durationDays: 30,
            yieldPercent: 5,
            payoutFrequency: 'DAILY',
            minAmount: 5000,
            maxAmount: ''
        })
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        )
    }

    return (
        <div className="p-8 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Plans d'Investissement</h1>
                    <p className="text-slate-500">Gérez les offres d'investissement (Montants en FCFA)</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    <Plus size={20} />
                    Nouveau Plan
                </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50">
                                <th className="p-4 text-sm font-semibold text-slate-600">Nom</th>
                                <th className="p-4 text-sm font-semibold text-slate-600">Rendement</th>
                                <th className="p-4 text-sm font-semibold text-slate-600">Durée</th>
                                <th className="p-4 text-sm font-semibold text-slate-600">Min. Invest (FCFA)</th>
                                <th className="p-4 text-sm font-semibold text-slate-600">Fréquence</th>
                                <th className="p-4 text-sm font-semibold text-slate-600 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {plans?.map((plan) => (
                                <tr key={plan.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-4 font-medium text-slate-800">{plan.name}</td>
                                    <td className="p-4 text-green-600 font-semibold">{Number(plan.yieldPercent)}%</td>
                                    <td className="p-4 text-slate-600">{plan.durationDays} jours</td>
                                    <td className="p-4 text-slate-800 font-medium">
                                        {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(plan.minAmount * XOF_RATE)}
                                    </td>
                                    <td className="p-4 text-slate-600">
                                        <span className="px-2 py-1 bg-slate-100 rounded text-xs font-medium">
                                            {plan.payoutFrequency}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => openEditModal(plan)}
                                                className="p-2 hover:bg-indigo-50 text-indigo-600 rounded-lg transition-colors"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce plan ?')) {
                                                        deleteMutation.mutate(plan.id)
                                                    }
                                                }}
                                                className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {plans?.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center text-slate-400">
                                        <div className="flex flex-col items-center justify-center space-y-3">
                                            <TrendingUp className="h-12 w-12 opacity-20" />
                                            <p>Aucun plan d'investissement</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h2 className="text-lg font-semibold text-slate-800">
                                {editingPlan ? 'Modifier le Plan' : 'Nouveau Plan d\'Investissement'}
                            </h2>
                            <button onClick={closeModal} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                                <X size={20} className="text-slate-500" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Nom du Plan</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                                    placeholder="ex: Premium Growth"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Rendement (%)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        required
                                        value={formData.yieldPercent}
                                        onChange={(e) => setFormData({ ...formData, yieldPercent: Number(e.target.value) })}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Durée (Jours)</label>
                                    <input
                                        type="number"
                                        required
                                        value={formData.durationDays}
                                        onChange={(e) => setFormData({ ...formData, durationDays: Number(e.target.value) })}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Montant Min (FCFA)</label>
                                    <input
                                        type="number"
                                        required
                                        value={formData.minAmount}
                                        onChange={(e) => setFormData({ ...formData, minAmount: Number(e.target.value) })}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                                    />
                                    <p className="text-xs text-slate-500 mt-1">
                                        ~ {(Number(formData.minAmount) / XOF_RATE).toFixed(2)} €
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Montant Max (FCFA)</label>
                                    <input
                                        type="number"
                                        value={formData.maxAmount}
                                        onChange={(e) => setFormData({ ...formData, maxAmount: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Fréquence de Paiement</label>
                                <select
                                    value={formData.payoutFrequency}
                                    onChange={(e) => setFormData({ ...formData, payoutFrequency: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                                >
                                    <option value="HOURLY">Horaire (HOURLY)</option>
                                    <option value="DAILY">Quotidien (DAILY)</option>
                                    <option value="WEEKLY">Hebdomadaire (WEEKLY)</option>
                                    <option value="MONTHLY">Mensuel (MONTHLY)</option>
                                    <option value="YEARLY">Annuel (YEARLY)</option>
                                </select>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={createMutation.isPending || updateMutation.isPending}
                                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                                >
                                    {createMutation.isPending || updateMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
