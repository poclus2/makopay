
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Check, X, Search, Wallet, AlertCircle, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

export default function WithdrawalsPage() {
    const queryClient = useQueryClient()
    const [searchTerm, setSearchTerm] = useState('')
    const [processingId, setProcessingId] = useState<string | null>(null)

    const { data: withdrawals, isLoading } = useQuery({
        queryKey: ['withdrawals', 'pending'],
        queryFn: async () => {
            const { data } = await api.get('/admin/withdrawals/pending')
            return data
        }
    })

    const approveMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.post(`/admin/withdrawals/${id}/approve`)
        },
        onSuccess: () => {
            toast.success('Retrait approuvé')
            queryClient.invalidateQueries({ queryKey: ['withdrawals'] })
            setProcessingId(null)
        },
        onError: () => {
            toast.error("Erreur lors de l'approbation")
            setProcessingId(null)
        }
    })

    const rejectMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.post(`/admin/withdrawals/${id}/reject`)
        },
        onSuccess: () => {
            toast.success('Retrait rejeté et remboursé')
            queryClient.invalidateQueries({ queryKey: ['withdrawals'] })
            setProcessingId(null)
        },
        onError: () => {
            toast.error("Erreur lors du rejet")
            setProcessingId(null)
        }
    })

    const handleAction = (id: string, action: 'approve' | 'reject') => {
        if (processingId) return

        if (action === 'approve') {
            if (window.confirm('Confirmer ce retrait ?')) {
                setProcessingId(id)
                approveMutation.mutate(id)
            }
        } else {
            if (window.confirm('Rejeter ce retrait ? Les fonds seront remboursés au client.')) {
                setProcessingId(id)
                rejectMutation.mutate(id)
            }
        }
    }

    // Filter withdrawals
    const filteredWithdrawals = withdrawals?.filter((w: any) =>
        w.wallet.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.wallet.user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.reference?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="animate-spin h-8 w-8 text-indigo-600" />
            </div>
        )
    }

    return (
        <div className="p-8 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Retraits</h1>
                    <p className="text-slate-500">Demandes de retrait en attente</p>
                </div>
            </div>

            <div className="flex items-center space-x-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <Search className="h-5 w-5 text-slate-400" />
                <input
                    type="text"
                    placeholder="Rechercher..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-transparent border-none focus:ring-0 text-slate-800 placeholder-slate-400 flex-1 outline-none"
                />
            </div>

            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50">
                                <th className="p-4 text-sm font-semibold text-slate-600">Date/Ref</th>
                                <th className="p-4 text-sm font-semibold text-slate-600">Utilisateur</th>
                                <th className="p-4 text-sm font-semibold text-slate-600">Montant</th>
                                <th className="p-4 text-sm font-semibold text-slate-600">Détails</th>
                                <th className="p-4 text-sm font-semibold text-slate-600 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {filteredWithdrawals?.map((w: any) => (
                                <tr key={w.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-4">
                                        <div className="font-mono text-sm font-medium text-slate-700">{w.reference || 'N/A'}</div>
                                        <div className="text-xs text-slate-500">
                                            {format(new Date(w.createdAt), 'PP p', { locale: fr })}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="font-medium text-slate-800">
                                            {w.wallet.user.firstName} {w.wallet.user.lastName}
                                        </div>
                                        <div className="text-xs text-slate-500">{w.wallet.user.email}</div>
                                    </td>
                                    <td className="p-4">
                                        <div className="font-bold text-slate-800">
                                            {/* Amount is stored as negative for withdrawals, display absolute */}
                                            {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(Math.abs(w.amount))}
                                        </div>
                                        <div className="text-xs text-slate-500">
                                            ~ {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(Math.abs(w.amount) * 655.957)}
                                        </div>
                                    </td>
                                    <td className="p-4 text-sm text-slate-600 max-w-[200px] truncate">
                                        {/* Assuming 'reference' or we might have stored method details in it? */}
                                        {/* In WalletController we stored: body.details || `REQ-...` in reference. */}
                                        {w.reference}
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleAction(w.id, 'approve')}
                                                disabled={!!processingId}
                                                className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50"
                                                title="Approuver"
                                            >
                                                {processingId === w.id ? <Loader2 className="animate-spin h-5 w-5" /> : <Check size={20} />}
                                            </button>
                                            <button
                                                onClick={() => handleAction(w.id, 'reject')}
                                                disabled={!!processingId}
                                                className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                                                title="Rejeter (Rembourser)"
                                            >
                                                <X size={20} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredWithdrawals?.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-slate-400">
                                        <div className="flex flex-col items-center justify-center space-y-3">
                                            <Wallet className="h-12 w-12 opacity-20" />
                                            <p>Aucune demande de retrait en attente</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
