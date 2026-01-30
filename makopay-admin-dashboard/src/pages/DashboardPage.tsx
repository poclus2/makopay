import { useQuery } from '@tanstack/react-query'
import api from '../lib/api'
import { TrendingUp, Users, Wallet, Clock, ArrowUpRight, ArrowDownRight } from 'lucide-react'

interface Stats {
    totalUsers: number
    pendingDeposits: number
    totalVolume: string
}

export default function DashboardPage() {
    const { data: stats, isLoading } = useQuery<Stats>({
        queryKey: ['stats'],
        queryFn: async () => {
            const { data } = await api.get('/admin/stats')
            return data
        },
    })

    if (isLoading) {
        return (
            <div className="p-8">
                <div className="animate-pulse space-y-6">
                    <div className="h-8 bg-slate-200 rounded-lg w-1/4"></div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-40 bg-slate-200 rounded-2xl"></div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    const cards = [
        {
            title: 'Utilisateurs Totaux',
            value: stats?.totalUsers || 0,
            icon: Users,
            gradient: 'from-blue-500 to-cyan-500',
            bgGradient: 'from-blue-50 to-cyan-50',
            change: '+12%',
            isPositive: true,
        },
        {
            title: 'Dépôts en Attente',
            value: stats?.pendingDeposits || 0,
            icon: Clock,
            gradient: 'from-amber-500 to-orange-500',
            bgGradient: 'from-amber-50 to-orange-50',
            change: '+5',
            isPositive: false,
        },
        {
            title: 'Volume Total',
            value: `€${Number(stats?.totalVolume || 0).toLocaleString()}`,
            icon: TrendingUp,
            gradient: 'from-emerald-500 to-teal-500',
            bgGradient: 'from-emerald-50 to-teal-50',
            change: '+23%',
            isPositive: true,
        },
    ]

    return (
        <div className="p-8">
            {/* Page Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800 mb-2">Tableau de Bord</h1>
                <p className="text-slate-600">Vue d'ensemble de votre plateforme MakoPay</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {cards.map((card) => {
                    const Icon = card.icon
                    return (
                        <div
                            key={card.title}
                            className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all p-6 border border-slate-200"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div
                                    className={`p-3 rounded-xl bg-gradient-to-br ${card.bgGradient}`}
                                >
                                    <Icon className={`w-6 h-6 bg-gradient-to-br ${card.gradient} bg-clip-text text-transparent`} strokeWidth={2.5} />
                                </div>
                                <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${card.isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                                    }`}>
                                    {card.isPositive ? (
                                        <ArrowUpRight size={14} />
                                    ) : (
                                        <ArrowDownRight size={14} />
                                    )}
                                    {card.change}
                                </div>
                            </div>
                            <p className="text-slate-600 text-sm font-medium mb-1">{card.title}</p>
                            <p className="text-3xl font-bold text-slate-800">{card.value}</p>
                        </div>
                    )
                })}
            </div>

            {/* Activity Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-200">
                    <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        <div className="w-1 h-6 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full"></div>
                        Activité Récente
                    </h2>
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg">
                                <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg flex items-center justify-center">
                                    <Wallet className="w-5 h-5 text-indigo-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-slate-800">Nouveau dépôt</p>
                                    <p className="text-xs text-slate-500">Il y a {i * 5} minutes</p>
                                </div>
                                <span className="text-sm font-semibold text-slate-800">€{(i * 100).toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-200">
                    <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        <div className="w-1 h-6 bg-gradient-to-b from-emerald-500 to-teal-500 rounded-full"></div>
                        Actions Rapides
                    </h2>
                    <div className="grid grid-cols-2 gap-3">
                        <button className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 rounded-xl text-left transition-colors border border-indigo-100">
                            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center mb-3 shadow-sm">
                                <Wallet className="w-5 h-5 text-indigo-600" />
                            </div>
                            <p className="text-sm font-semibold text-slate-800">Valider dépôts</p>
                        </button>
                        <button className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 rounded-xl text-left transition-colors border border-emerald-100">
                            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center mb-3 shadow-sm">
                                <Users className="w-5 h-5 text-emerald-600" />
                            </div>
                            <p className="text-sm font-semibold text-slate-800">Gérer users</p>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
