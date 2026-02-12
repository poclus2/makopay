import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import { CheckCircle, XCircle, Clock, History, CreditCard, User, Search } from 'lucide-react'
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

interface User {
    id: string
    firstName: string
    lastName: string
    email: string
    phoneNumber: string
    wallet: {
        balance: string
    } | null
}

export default function DepositsPage() {
    const queryClient = useQueryClient()
    const [activeTab, setActiveTab] = useState<'pending' | 'history' | 'manual'>('pending')
    const [processingId, setProcessingId] = useState<string | null>(null)

    // Manual Deposit State
    const [selectedUser, setSelectedUser] = useState<string>('')
    const [manualAmount, setManualAmount] = useState<string>('')
    const [manualMessage, setManualMessage] = useState<string>('')
    const [userSearch, setUserSearch] = useState('')

    // Queries
    const { data: pendingDeposits, isLoading: isLoadingPending } = useQuery<Deposit[]>({
        queryKey: ['pendingDeposits'],
        queryFn: async () => (await api.get('/admin/deposits/pending')).data,
        refetchInterval: 5000,
        enabled: activeTab === 'pending'
    })

    const { data: historyDeposits, isLoading: isLoadingHistory } = useQuery<Deposit[]>({
        queryKey: ['depositHistory'],
        queryFn: async () => (await api.get('/admin/deposits/history')).data,
        enabled: activeTab === 'history'
    })

    const { data: users } = useQuery<User[]>({
        queryKey: ['users'],
        queryFn: async () => (await api.get('/admin/users')).data,
        enabled: activeTab === 'manual'
    })

    // Mutations
    const approveMutation = useMutation({
        mutationFn: async (depositId: string) => api.post(`/admin/deposits/${depositId}/approve`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pendingDeposits'] })
            queryClient.invalidateQueries({ queryKey: ['depositHistory'] })
            setProcessingId(null)
        },
        onError: () => setProcessingId(null)
    })

    const rejectMutation = useMutation({
        mutationFn: async (depositId: string) => api.post(`/admin/deposits/${depositId}/reject`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pendingDeposits'] })
            queryClient.invalidateQueries({ queryKey: ['depositHistory'] })
            setProcessingId(null)
        },
        onError: () => setProcessingId(null)
    })

    const manualDepositMutation = useMutation({
        mutationFn: async (data: { userId: string, amount: number, message: string }) => {
            return api.post('/admin/deposits/manual', { ...data, currency: 'XAF' })
        },
        onSuccess: () => {
            alert('Recharge effectuée avec succès!')
            setSelectedUser('')
            setManualAmount('')
            setManualMessage('')
            queryClient.invalidateQueries({ queryKey: ['depositHistory'] })
        },
        onError: () => alert('Erreur lors de la recharge')
    })

    // Handlers
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

    const handleManualSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedUser || !manualAmount) return
        if (confirm(`Recharger ${manualAmount} XAF pour cet utilisateur ?`)) {
            manualDepositMutation.mutate({
                userId: selectedUser,
                amount: parseFloat(manualAmount),
                message: manualMessage
            })
        }
    }

    // Filtered Users for Manual Recharge
    const filteredUsers = users?.filter(u =>
        u.firstName?.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.lastName?.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.phoneNumber?.includes(userSearch) ||
        u.email?.toLowerCase().includes(userSearch.toLowerCase())
    ) || []

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Gestion des Dépôts</h1>
            </div>

            {/* Tabs */}
            <div className="flex space-x-4 mb-8 border-b border-gray-200 pb-1">
                <button
                    onClick={() => setActiveTab('pending')}
                    className={`pb-2 px-4 font-medium flex items-center gap-2 ${activeTab === 'pending'
                            ? 'text-teal-600 border-b-2 border-teal-600'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <Clock size={18} />
                    En Attente
                    {pendingDeposits?.length ? (
                        <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded-full">
                            {pendingDeposits.length}
                        </span>
                    ) : null}
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`pb-2 px-4 font-medium flex items-center gap-2 ${activeTab === 'history'
                            ? 'text-teal-600 border-b-2 border-teal-600'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <History size={18} />
                    Historique
                </button>
                <button
                    onClick={() => setActiveTab('manual')}
                    className={`pb-2 px-4 font-medium flex items-center gap-2 ${activeTab === 'manual'
                            ? 'text-teal-600 border-b-2 border-teal-600'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <CreditCard size={18} />
                    Recharge Manuelle
                </button>
            </div>

            {/* Content Pending */}
            {activeTab === 'pending' && (
                <>
                    {isLoadingPending ? (
                        <div className="animate-pulse space-y-4">
                            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                            <div className="h-64 bg-gray-200 rounded"></div>
                        </div>
                    ) : !pendingDeposits || pendingDeposits.length === 0 ? (
                        <div className="bg-white rounded-xl shadow-md p-12 text-center">
                            <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 text-lg">Aucun dépôt en attente</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl shadow-md overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Utilisateur</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Montant</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Méthode</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Ref</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Date</th>
                                        <th className="px-6 py-4 text-right text-sm font-semibold text-gray-600">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {pendingDeposits.map((deposit) => (
                                        <tr key={deposit.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="font-medium text-gray-800">{deposit.user.firstName} {deposit.user.lastName}</p>
                                                    <p className="text-sm text-gray-500">{deposit.user.phoneNumber}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="font-semibold text-gray-800">{Number(deposit.amount).toLocaleString()} {deposit.currency}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">{deposit.method}</span>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-mono text-gray-600">{deposit.referenceCode}</td>
                                            <td className="px-6 py-4 text-sm text-gray-600">{new Date(deposit.createdAt).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 flex justify-end gap-2">
                                                <button onClick={() => handleApprove(deposit.id)} disabled={processingId === deposit.id} className="p-2 bg-green-100 text-green-700 rounded hover:bg-green-200 disabled:opacity-50"><CheckCircle size={20} /></button>
                                                <button onClick={() => handleReject(deposit.id)} disabled={processingId === deposit.id} className="p-2 bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50"><XCircle size={20} /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}

            {/* Content History */}
            {activeTab === 'history' && (
                <>
                    {isLoadingHistory ? (
                        <div className="animate-pulse h-64 bg-gray-200 rounded"></div>
                    ) : !historyDeposits || historyDeposits.length === 0 ? (
                        <div className="bg-white rounded-xl shadow-md p-12 text-center text-gray-500">Aucun historique disponible</div>
                    ) : (
                        <div className="bg-white rounded-xl shadow-md overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Utilisateur</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Montant</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Méthode</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Statut</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {historyDeposits.map((deposit) => (
                                        <tr key={deposit.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="font-medium text-gray-800">{deposit.user.firstName} {deposit.user.lastName}</p>
                                                    <p className="text-sm text-gray-500">{deposit.user.phoneNumber}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-semibold text-gray-800">{Number(deposit.amount).toLocaleString()} {deposit.currency}</td>
                                            <td className="px-6 py-4 text-sm text-gray-600">{deposit.method}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${deposit.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                                        deposit.status === 'REJECTED' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {deposit.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">{new Date(deposit.createdAt).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}

            {/* Content Manual Recharge */}
            {activeTab === 'manual' && (
                <div className="max-w-4xl mx-auto">
                    <div className="bg-white rounded-xl shadow-md p-8">
                        <h2 className="text-xl font-bold mb-6 text-gray-800 flex items-center gap-2">
                            <CreditCard className="text-teal-600" />
                            Effectuer une Recharge Manuelle
                        </h2>

                        <form onSubmit={handleManualSubmit} className="space-y-6">
                            {/* User Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Rechercher un Utilisateur</label>
                                <div className="relative mb-2">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <input
                                        type="text"
                                        placeholder="Nom, Email ou Téléphone..."
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
                                        value={userSearch}
                                        onChange={(e) => setUserSearch(e.target.value)}
                                    />
                                </div>
                                <div className="border border-gray-200 rounded-md max-h-60 overflow-y-auto">
                                    {!users ? (
                                        <div className="p-4 text-center text-gray-500">Chargement...</div>
                                    ) : filteredUsers.length === 0 ? (
                                        <div className="p-4 text-center text-gray-500">Aucun utilisateur trouvé</div>
                                    ) : (
                                        filteredUsers.map(u => (
                                            <div
                                                key={u.id}
                                                onClick={() => setSelectedUser(u.id)}
                                                className={`p-3 cursor-pointer hover:bg-teal-50 flex justify-between items-center ${selectedUser === u.id ? 'bg-teal-50 border-l-4 border-teal-500' : ''}`}
                                            >
                                                <div>
                                                    <p className="font-medium text-gray-800">{u.firstName} {u.lastName}</p>
                                                    <p className="text-xs text-gray-500">{u.phoneNumber} • {u.email}</p>
                                                </div>
                                                {selectedUser === u.id && <CheckCircle className="w-5 h-5 text-teal-600" />}
                                            </div>
                                        ))
                                    )}
                                </div>
                                {selectedUser && <p className="text-xs text-teal-600 mt-1 font-medium">Utilisateur sélectionné ID: {selectedUser}</p>}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Montant (XAF)</label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        value={manualAmount}
                                        onChange={(e) => setManualAmount(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
                                        placeholder="ex: 5000"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Motif / Message</label>
                                    <input
                                        type="text"
                                        value={manualMessage}
                                        onChange={(e) => setManualMessage(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
                                        placeholder="ex: Bonus Exceptionnel"
                                    />
                                </div>
                            </div>

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={!selectedUser || !manualAmount || manualDepositMutation.isPending}
                                    className="w-full bg-teal-600 text-white py-3 px-4 rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50 font-medium transition-colors flex justify-center items-center gap-2"
                                >
                                    {manualDepositMutation.isPending ? 'Traitement...' : 'Valider la Recharge'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
