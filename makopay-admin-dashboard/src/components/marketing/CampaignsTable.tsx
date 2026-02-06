import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus, Eye, Trash2, Send, BarChart, MessageSquare, Mail } from 'lucide-react'
import { toast } from 'sonner'
import { marketingApi } from '../../lib/api'
import type { Campaign, CampaignType, CampaignStatus } from '../../types/marketing'
import { format } from 'date-fns'
import CampaignWizard from './CampaignWizard'

export default function CampaignsTable() {
    const [selectedType, setSelectedType] = useState<CampaignType | ''>('')
    const [selectedStatus, setSelectedStatus] = useState<CampaignStatus | ''>('')
    const [wizardOpen, setWizardOpen] = useState(false)

    // Fetch campaigns
    const { data: campaigns, isLoading, refetch } = useQuery({
        queryKey: ['campaigns', selectedType, selectedStatus],
        queryFn: async () => {
            const params: any = {}
            if (selectedType) params.type = selectedType
            if (selectedStatus) params.status = selectedStatus
            const response = await marketingApi.getCampaigns(params)
            return response.data as Campaign[]
        },
    })

    const handleDelete = async (id: string) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette campagne ?')) return

        try {
            await marketingApi.deleteCampaign(id)
            toast.success('Campagne supprimée')
            refetch()
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Erreur suppression')
        }
    }

    const getStatusBadge = (status: CampaignStatus) => {
        const styles = {
            DRAFT: 'bg-gray-100 text-gray-800',
            SCHEDULED: 'bg-blue-100 text-blue-800',
            SENDING: 'bg-yellow-100 text-yellow-800',
            COMPLETED: 'bg-green-100 text-green-800',
            FAILED: 'bg-red-100 text-red-800',
        }
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
                {status}
            </span>
        )
    }

    const getTypeBadge = (type: CampaignType) => {
        return type === 'SMS' ? (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 flex items-center gap-1">
                <MessageSquare size={12} />
                SMS
            </span>
        ) : (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 flex items-center gap-1">
                <Mail size={12} />
                Email
            </span>
        )
    }

    if (isLoading) {
        return <div className="text-center py-12 text-slate-600">Chargement...</div>
    }

    return (
        <div className="space-y-4">
            {/* Header + Filters */}
            <div className="flex items-center justify-between">
                <div className="flex gap-3">
                    <select
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value as any)}
                        className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    >
                        <option value="">Tous les types</option>
                        <option value="SMS">SMS</option>
                        <option value="EMAIL">Email</option>
                    </select>

                    <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value as any)}
                        className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    >
                        <option value="">Tous les statuts</option>
                        <option value="DRAFT">Brouillon</option>
                        <option value="SCHEDULED">Planifié</option>
                        <option value="SENDING">En cours</option>
                        <option value="COMPLETED">Terminé</option>
                        <option value="FAILED">Échec</option>
                    </select>
                </div>

                <button
                    onClick={() => setWizardOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-slate-800 transition-colors"
                >
                    <Plus size={18} />
                    Nouvelle campagne
                </button>
            </div>

            {/* Table */}
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Nom</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Type</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Statut</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-slate-600 uppercase">Destinataires</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-slate-600 uppercase">Envoyés</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-slate-600 uppercase">Taux livraison</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Date</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-slate-600 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {campaigns?.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="px-4 py-12 text-center text-slate-600">
                                    Aucune campagne trouvée
                                </td>
                            </tr>
                        ) : (
                            campaigns?.map((campaign) => {
                                const deliveryRate = campaign.sentCount > 0
                                    ? (campaign.deliveredCount / campaign.sentCount * 100).toFixed(1)
                                    : '0'

                                return (
                                    <tr key={campaign.id} className="hover:bg-slate-50">
                                        <td className="px-4 py-3 font-medium text-slate-900">{campaign.name}</td>
                                        <td className="px-4 py-3">{getTypeBadge(campaign.type)}</td>
                                        <td className="px-4 py-3">{getStatusBadge(campaign.status)}</td>
                                        <td className="px-4 py-3 text-right text-slate-700">{campaign.totalRecipients.toLocaleString()}</td>
                                        <td className="px-4 py-3 text-right text-slate-700">{campaign.sentCount.toLocaleString()}</td>
                                        <td className="px-4 py-3 text-right text-slate-700">{deliveryRate}%</td>
                                        <td className="px-4 py-3 text-slate-600 text-sm">
                                            {format(new Date(campaign.createdAt), 'dd/MM/yyyy')}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                                    title="Voir détails"
                                                >
                                                    <Eye size={16} className="text-slate-600" />
                                                </button>
                                                <button
                                                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                                    title="Statistiques"
                                                >
                                                    <BarChart size={16} className="text-slate-600" />
                                                </button>
                                                {campaign.status === 'DRAFT' && (
                                                    <>
                                                        <button
                                                            className="p-2 hover:bg-green-50 rounded-lg transition-colors"
                                                            title="Envoyer"
                                                        >
                                                            <Send size={16} className="text-green-600" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(campaign.id)}
                                                            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Supprimer"
                                                        >
                                                            <Trash2 size={16} className="text-red-600" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Wizard Modal */}
            {wizardOpen && <CampaignWizard onClose={() => setWizardOpen(false)} />}
        </div>
    )
}
