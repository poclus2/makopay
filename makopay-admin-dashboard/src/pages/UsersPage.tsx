import { useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import { format } from 'date-fns'
import { Search, User as UserIcon, X, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

interface User {
    id: string
    firstName: string
    lastName: string
    email: string
    phoneNumber: string
    createdAt: string
    wallet: {
        balance: number
    } | null
    kycStatus?: string
    kycData?: any
}

export default function UsersPage() {
    const [searchTerm, setSearchTerm] = useState('')

    const { data: users, isLoading, error } = useQuery<User[]>({
        queryKey: ['users'],
        queryFn: async () => {
            const { data } = await api.get('/admin/users')
            return data
        },
    })

    // Filter users based on search term
    const filteredUsers = users?.filter(user =>
        user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phoneNumber.includes(searchTerm)
    )

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
                Failed to load users: {(error as any).message}
            </div>
        )
    }

    return (
        <div className="p-8 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Utilisateurs</h1>
                    <p className="text-slate-500">Gestion des utilisateurs de la plateforme</p>
                </div>
            </div>

            <div className="flex items-center space-x-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <Search className="h-5 w-5 text-slate-400" />
                <input
                    type="text"
                    placeholder="Rechercher par nom, email ou téléphone..."
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
                                <th className="p-4 text-sm font-semibold text-slate-600">Utilisateur</th>
                                <th className="p-4 text-sm font-semibold text-slate-600">Email</th>
                                <th className="p-4 text-sm font-semibold text-slate-600">Téléphone</th>
                                <th className="p-4 text-sm font-semibold text-slate-600">Solde</th>
                                <th className="p-4 text-sm font-semibold text-slate-600">Inscrit le</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {filteredUsers?.map((user) => (
                                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-medium shadow-sm">
                                                {user.firstName[0]}
                                                {user.lastName[0]}
                                            </div>
                                            <div>
                                                <div className="font-medium text-slate-800">
                                                    {user.firstName} {user.lastName}
                                                </div>
                                                <div className="text-xs text-slate-500">ID: {user.id.slice(0, 8)}...</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 text-slate-600">{user.email}</td>
                                    <td className="p-4 text-slate-600">{user.phoneNumber}</td>
                                    <td className="p-4 text-slate-800 font-medium">
                                        {new Intl.NumberFormat('fr-FR', {
                                            style: 'currency',
                                            currency: 'XAF',
                                        }).format(user.wallet?.balance || 0)}
                                    </td>
                                    <td className="p-4 text-slate-500 text-sm">
                                        {format(new Date(user.createdAt), 'PPP')}
                                    </td>
                                    <td className="p-4 text-right">
                                        {/* KYC Modal temporarily disabled */}
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${user.kycStatus === 'VERIFIED' ? 'bg-green-100 text-green-700' :
                                            user.kycStatus === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                                user.kycStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-slate-100 text-slate-500'
                                            }`}>
                                            {user.kycStatus || 'Non soumis'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {filteredUsers?.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-slate-400">
                                        <div className="flex flex-col items-center justify-center space-y-3">
                                            <UserIcon className="h-12 w-12 opacity-20" />
                                            <p>Aucun utilisateur trouvé</p>
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
