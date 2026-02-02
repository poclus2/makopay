import { useQuery } from '@tanstack/react-query'
import api from '../lib/api'
import { format } from 'date-fns'
import { Search, TrendingUp, CheckCircle, DollarSign, Loader2 } from 'lucide-react'
import { useState } from 'react'

interface Investment {
    id: string
    status: 'ACTIVE' | 'COMPLETED'
    principalAmount: number
    startDate: string
    endDate: string
    lastPayoutAt: string | null
    user: {
        id: string
        firstName: string
        lastName: string
        email: string
        referralCode: string
    }
    plan: {
        id: string
        name: string
        yieldPercent: number
        durationDays: number
    }
    payouts: Array<{
        amount: number
        payoutDate: string
    }>
}

interface InvestmentStats {
    activeCount: number
    completedCount: number
    totalVolume: number
}

interface KPICardProps {
    title: string
    value: string | number
    icon: any
    color: 'blue' | 'green' | 'purple'
}

function KPICard({ title, value, icon: Icon, color }: KPICardProps) {
    const colors = {
        blue: 'bg-blue-50 text-blue-600',
        green: 'bg-green-50 text-green-600',
        purple: 'bg-purple-50 text-purple-600',
    }

    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-slate-500">{title}</p>
                    <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
                </div>
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colors[color]}`}>
                    <Icon className="w-6 h-6" />
                </div>
            </div>
        </div>
    )
}

export default function InvestmentsPage() {
    const [searchTerm, setSearchTerm] = useState('')

    // Fetch stats
    const { data: stats } = useQuery<InvestmentStats>({
        queryKey: ['investment-stats'],
        queryFn: async () => {
            const { data } = await api.get('/investments/admin/stats')
            return data
        }
    })

    // Fetch investments
    const { data: investments, isLoading, error } = useQuery<Investment[]>({
        queryKey: ['admin-investments', searchTerm],
        queryFn: async () => {
            const { data } = await api.get('/investments/admin/all', {
                params: { search: searchTerm || undefined }
            })
            return data
        }
    })

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA'
    }

    const totalPayouts = (payouts: any[]) => {
        return payouts.reduce((sum, p) => sum + Number(p.amount), 0)
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
                Failed to load investments: {(error as any).message}
            </div>
        )
    }

    return (
        <div className="p-8 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Investissements</h1>
                <p className="text-slate-500">Gestion de tous les investissements de la plateforme</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <KPICard
                    title="Investissements Actifs"
                    value={stats?.activeCount || 0}
                    icon={TrendingUp}
                    color="blue"
                />
                <KPICard
                    title="Investissements Terminés"
                    value={stats?.completedCount || 0}
                    icon={CheckCircle}
                    color="green"
                />
                <KPICard
                    title="Volume Total"
                    value={formatCurrency(Number(stats?.totalVolume || 0))}
                    icon={DollarSign}
                    color="purple"
                />
            </div>

            {/* Search Bar */}
            <div className="flex items-center space-x-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <Search className="h-5 w-5 text-slate-400" />
                <input
                    type="text"
                    placeholder="Rechercher par nom ou code de référence..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-transparent border-none focus:ring-0 text-slate-800 placeholder-slate-400 flex-1 outline-none"
                />
            </div>

            {/* Table */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                                    Utilisateur
                                </th>
                                <th className="px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                                    Plan
                                </th>
                                <th className="px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                                    Principal
                                </th>
                                <th className="px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                                    Rendements Payés
                                </th>
                                <th className="px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                                    Statut
                                </th>
                                <th className="px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                                    Date Début
                                </th>
                                <th className="px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                                    Date Fin
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {investments?.map((inv) => (
                                <tr key={inv.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div>
                                            <div className="text-sm font-medium text-slate-800">
                                                {inv.user.firstName} {inv.user.lastName}
                                            </div>
                                            <div className="text-xs text-slate-500">
                                                {inv.user.referralCode}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-slate-800">{inv.plan.name}</div>
                                        <div className="text-xs text-slate-500">
                                            {inv.plan.yieldPercent}% / mois
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-slate-800">
                                            {formatCurrency(Number(inv.principalAmount))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-green-600">
                                            {formatCurrency(totalPayouts(inv.payouts))}
                                        </div>
                                        <div className="text-xs text-slate-500">
                                            {inv.payouts.length} paiement(s)
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span
                                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${inv.status === 'ACTIVE'
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-gray-100 text-gray-800'
                                                }`}
                                        >
                                            {inv.status === 'ACTIVE' ? 'Actif' : 'Terminé'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                        {format(new Date(inv.startDate), 'dd/MM/yyyy')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                        {format(new Date(inv.endDate), 'dd/MM/yyyy')}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {investments?.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-slate-500">Aucun investissement trouvé</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Summary */}
            {investments && investments.length > 0 && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <p className="text-sm text-slate-600">
                        Total: <span className="font-semibold">{investments.length}</span> investissement(s)
                    </p>
                </div>
            )}
        </div>
    )
}
