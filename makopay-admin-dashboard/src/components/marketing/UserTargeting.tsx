import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Users, RefreshCw } from 'lucide-react'
import { marketingApi } from '../../lib/api'
import type { UserFilters, PreviewUser } from '../../types/marketing'

interface UserTargetingProps {
    filters: UserFilters
    onFiltersChange: (filters: UserFilters) => void
}

export default function UserTargeting({ filters, onFiltersChange }: UserTargetingProps) {
    const [userCount, setUserCount] = useState(0)
    const [previewUsers, setPreviewUsers] = useState<PreviewUser[]>([])

    // Fetch count and preview
    const { data: countData, refetch: refetchCount } = useQuery({
        queryKey: ['user-count', filters],
        queryFn: async () => {
            const response = await marketingApi.countTargetedUsers(filters)
            return response.data
        },
        enabled: Object.keys(filters).length > 0,
    })

    const { data: previewData, refetch: refetchPreview } = useQuery({
        queryKey: ['user-preview', filters],
        queryFn: async () => {
            const response = await marketingApi.previewTargetedUsers(filters)
            return response.data
        },
        enabled: Object.keys(filters).length > 0,
    })

    useEffect(() => {
        if (countData) setUserCount(countData.count || 0)
        if (previewData) setPreviewUsers(previewData || [])
    }, [countData, previewData])

    const handleRefresh = () => {
        refetchCount()
        refetchPreview()
    }

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
                <h3 className="font-semibold text-slate-900 mb-4">Critères de ciblage</h3>

                {/* KYC Status */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Statut KYC
                    </label>
                    <select
                        value={filters.kycStatus || ''}
                        onChange={(e) =>
                            onFiltersChange({ ...filters, kycStatus: e.target.value || undefined })
                        }
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    >
                        <option value="">Tous</option>
                        <option value="PENDING">En attente</option>
                        <option value="APPROVED">Approuvé</option>
                        <option value="REJECTED">Rejeté</option>
                    </select>
                </div>

                {/* Balance */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Balance min (XAF)
                        </label>
                        <input
                            type="number"
                            value={filters.balanceMin || ''}
                            onChange={(e) =>
                                onFiltersChange({
                                    ...filters,
                                    balanceMin: e.target.value ? Number(e.target.value) : undefined,
                                })
                            }
                            placeholder="0"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Balance max (XAF)
                        </label>
                        <input
                            type="number"
                            value={filters.balanceMax || ''}
                            onChange={(e) =>
                                onFiltersChange({
                                    ...filters,
                                    balanceMax: e.target.value ? Number(e.target.value) : undefined,
                                })
                            }
                            placeholder="∞"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                        />
                    </div>
                </div>

                {/* Registration Date */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Inscrit après
                        </label>
                        <input
                            type="date"
                            value={filters.registeredAfter || ''}
                            onChange={(e) =>
                                onFiltersChange({ ...filters, registeredAfter: e.target.value || undefined })
                            }
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Inscrit avant
                        </label>
                        <input
                            type="date"
                            value={filters.registeredBefore || ''}
                            onChange={(e) =>
                                onFiltersChange({ ...filters, registeredBefore: e.target.value || undefined })
                            }
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                        />
                    </div>
                </div>

                {/* Checkboxes */}
                <div className="space-y-2">
                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={filters.hasInvestments || false}
                            onChange={(e) =>
                                onFiltersChange({ ...filters, hasInvestments: e.target.checked || undefined })
                            }
                            className="rounded border-slate-300"
                        />
                        <span className="text-sm text-slate-700">A des investissements</span>
                    </label>
                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={filters.hasReferrals || false}
                            onChange={(e) =>
                                onFiltersChange({ ...filters, hasReferrals: e.target.checked || undefined })
                            }
                            className="rounded border-slate-300"
                        />
                        <span className="text-sm text-slate-700">A des parrainés</span>
                    </label>
                </div>

                {/* Phone Prefix */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Préfixe téléphone
                    </label>
                    <input
                        type="text"
                        value={filters.phonePrefix || ''}
                        onChange={(e) =>
                            onFiltersChange({ ...filters, phonePrefix: e.target.value || undefined })
                        }
                        placeholder="+237"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    />
                </div>
            </div>

            {/* Preview */}
            <div className="bg-white border border-slate-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Users size={18} className="text-slate-600" />
                        <h3 className="font-semibold text-slate-900">
                            Preview: {userCount.toLocaleString()} utilisateurs
                        </h3>
                    </div>
                    <button
                        onClick={handleRefresh}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm border border-slate-300 rounded-lg hover:bg-slate-50"
                    >
                        <RefreshCw size={14} />
                        Rafraîchir
                    </button>
                </div>

                {previewUsers.length > 0 ? (
                    <div className="space-y-2">
                        {previewUsers.slice(0, 10).map((user) => (
                            <div
                                key={user.id}
                                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg text-sm"
                            >
                                <div>
                                    <p className="font-medium text-slate-900">
                                        {user.firstName} {user.lastName}
                                    </p>
                                    <p className="text-slate-600">{user.phoneNumber}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-slate-700">
                                        {user.wallet?.balance?.toLocaleString() || 0} XAF
                                    </p>
                                    <p className="text-xs text-slate-500">{user.kycStatus}</p>
                                </div>
                            </div>
                        ))}
                        {previewUsers.length > 10 && (
                            <p className="text-center text-sm text-slate-500 pt-2">
                                Et {(previewUsers.length - 10).toLocaleString()} autres...
                            </p>
                        )}
                    </div>
                ) : (
                    <p className="text-center text-slate-600 py-8">
                        Aucun utilisateur trouvé avec ces critères
                    </p>
                )}
            </div>
        </div>
    )
}
