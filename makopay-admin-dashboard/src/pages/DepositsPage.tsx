import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import { CheckCircle, XCircle, Clock } from 'lucide-react'
import { useState } from 'react'

interface Deposit {
    id: string
    userId: string
    amount: string
    currency: string
    method: string
    referenceCode: string
    payerPhoneNumber: string | null
    status: string
    createdAt: string
    user: {
        firstName: string
        lastName: string
        email: string
        phoneNumber: string
    }
}

export default function DepositsPage() {
    const queryClient = useQueryClient()
    const [processingId, setProcessingId] = useState<string | null>(null)

    const { data: deposits, isLoading } = useQuery<Deposit[]>({
        queryKey: ['pendingDeposits'],
        queryFn: async () => {
            const { data } = await api.get('/admin/deposits/pending')
            return data
        },
        refetchInterval: 5000, // Refresh every 5 seconds
    })

    const approveMutation = useMutation({
        mutationFn: async (depositId: string) => {
            return api.post(`/admin/deposits/${depositId}/approve`)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pendingDeposits'] })
            setProcessingId(null)
        },
        onError: () => {
            setProcessingId(null)
        },
    })

    const rejectMutation = useMutation({
        mutationFn: async (depositId: string) => {
            return api.post(`/admin/deposits/${depositId}/reject`)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pendingDeposits'] })
            setProcessingId(null)
        },
        onError: () => {
            setProcessingId(null)
        },
    })

    const handleApprove = (depositId: string) => {
        if (confirm('Confirmer l\'approbation de ce dépôt?')) {
            setProcessingId(depositId)
            approveMutation.mutate(depositId)
        }
    }

    const handleReject = (depositId: string) => {
        if (confirm('Confirmer le rejet de ce dépôt?')) {
            setProcessingId(depositId)
            rejectMutation.mutate(depositId)
        }
    }

    if (isLoading) {
        return (
            <div className="p-8">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-64 bg-gray-200 rounded"></div>
                </div>
            </div>
        )
    }

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Dépôts en Attente</h1>
                <span className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full font-semibold">
                    {deposits?.length || 0} en attente
                </span>
            </div>

            {!deposits || deposits.length === 0 ? (
                <div className="bg-white rounded-xl shadow-md p-12 text-center">
                    <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">Aucun dépôt en attente</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                                    Utilisateur
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                                    Montant
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                                    Méthode
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                                    Numéro Paiement
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                                    Référence
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                                    Date
                                </th>
                                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-600">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {deposits.map((deposit) => (
                                <tr key={deposit.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div>
                                            <p className="font-medium text-gray-800">
                                                {deposit.user.firstName} {deposit.user.lastName}
                                            </p>
                                            <p className="text-sm text-gray-500">{deposit.user.phoneNumber}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="font-semibold text-gray-800">
                                            {Number(deposit.amount).toLocaleString()} {deposit.currency}
                                        </p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                                            {deposit.method}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm text-gray-600 font-medium">
                                            {deposit.payerPhoneNumber || '-'}
                                        </p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm font-mono text-gray-600">
                                            {deposit.referenceCode}
                                        </p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm text-gray-600">
                                            {new Date(deposit.createdAt).toLocaleDateString()}
                                        </p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => handleApprove(deposit.id)}
                                                disabled={processingId === deposit.id}
                                                className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 disabled:opacity-50 transition-colors"
                                                title="Approuver"
                                            >
                                                <CheckCircle size={20} />
                                            </button>
                                            <button
                                                onClick={() => handleReject(deposit.id)}
                                                disabled={processingId === deposit.id}
                                                className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:opacity-50 transition-colors"
                                                title="Rejeter"
                                            >
                                                <XCircle size={20} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
