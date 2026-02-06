import { useQuery } from '@tanstack/react-query'
import { TrendingUp, Send, CheckCircle, AlertCircle, Eye, MousePointerClick } from 'lucide-react'
import { marketingApi } from '../../lib/api'
import type { Campaign } from '../../types/marketing'

export default function CampaignStats() {
    // Fetch all campaigns for aggregation
    const { data: campaigns, isLoading } = useQuery({
        queryKey: ['campaigns'],
        queryFn: async () => {
            const response = await marketingApi.getCampaigns()
            return response.data as Campaign[]
        },
    })

    if (isLoading) {
        return <div className="text-center py-12 text-slate-600">Chargement...</div>
    }

    // Calculate aggregate stats
    const totalCampaigns = campaigns?.length || 0
    const totalSent = campaigns?.reduce((sum, c) => sum + c.sentCount, 0) || 0
    const totalDelivered = campaigns?.reduce((sum, c) => sum + c.deliveredCount, 0) || 0
    const totalCost = campaigns?.reduce((sum, c) => sum + c.actualCost, 0) || 0
    const totalOpened = campaigns?.reduce((sum, c) => sum + c.openedCount, 0) || 0
    const totalClicked = campaigns?.reduce((sum, c) => sum + c.clickedCount, 0) || 0

    const deliveryRate = totalSent > 0 ? ((totalDelivered / totalSent) * 100).toFixed(1) : '0'
    const openRate = totalDelivered > 0 ? ((totalOpened / totalDelivered) * 100).toFixed(1) : '0'
    const clickRate = totalOpened > 0 ? ((totalClicked / totalOpened) * 100).toFixed(1) : '0'

    const stats = [
        {
            label: 'Campagnes',
            value: totalCampaigns.toLocaleString(),
            icon: TrendingUp,
            color: 'blue',
        },
        {
            label: 'Envoyés',
            value: totalSent.toLocaleString(),
            icon: Send,
            color: 'purple',
        },
        {
            label: 'Livrés',
            value: `${deliveryRate}%`,
            subtitle: `${totalDelivered.toLocaleString()} messages`,
            icon: CheckCircle,
            color: 'green',
        },
        {
            label: 'Ouverts',
            value: `${openRate}%`,
            subtitle: `${totalOpened.toLocaleString()} messages`,
            icon: Eye,
            color: 'indigo',
        },
        {
            label: 'Cliqués',
            value: `${clickRate}%`,
            subtitle: `${totalClicked.toLocaleString()} clics`,
            icon: MousePointerClick,
            color: 'pink',
        },
        {
            label: 'Coût total',
            value: `${totalCost.toLocaleString()} XAF`,
            icon: AlertCircle,
            color: 'orange',
        },
    ]

    const colorMap = {
        blue: 'bg-blue-100 text-blue-600',
        purple: 'bg-purple-100 text-purple-600',
        green: 'bg-green-100 text-green-600',
        indigo: 'bg-indigo-100 text-indigo-600',
        pink: 'bg-pink-100 text-pink-600',
        orange: 'bg-orange-100 text-orange-600',
    }

    return (
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stats.map((stat) => {
                    const Icon = stat.icon
                    return (
                        <div
                            key={stat.label}
                            className="bg-white border border-slate-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-slate-600 text-sm font-medium mb-1">{stat.label}</p>
                                    <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                                    {stat.subtitle && (
                                        <p className="text-xs text-slate-500 mt-1">{stat.subtitle}</p>
                                    )}
                                </div>
                                <div className={`p-3 rounded-lg ${colorMap[stat.color as keyof typeof colorMap]}`}>
                                    <Icon size={20} />
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Recent Campaigns */}
            <div className="bg-white border border-slate-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Dernières campagnes</h3>
                <div className="space-y-3">
                    {campaigns?.slice(0, 5).map((campaign) => (
                        <div
                            key={campaign.id}
                            className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                        >
                            <div>
                                <p className="font-medium text-slate-900">{campaign.name}</p>
                                <p className="text-sm text-slate-600">
                                    {campaign.type} • {campaign.totalRecipients} destinataires
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-medium text-slate-900">{campaign.sentCount} envoyés</p>
                                <p className="text-xs text-slate-500">
                                    {campaign.sentCount > 0
                                        ? `${((campaign.deliveredCount / campaign.sentCount) * 100).toFixed(1)}% livrés`
                                        : 'Pas encore envoyé'}
                                </p>
                            </div>
                        </div>
                    ))}
                    {campaigns?.length === 0 && (
                        <p className="text-center text-slate-600 py-4">Aucune campagne</p>
                    )}
                </div>
            </div>
        </div>
    )
}
