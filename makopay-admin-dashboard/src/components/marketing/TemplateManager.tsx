import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, FileText, Edit, Trash2, MessageSquare, Mail } from 'lucide-react'
import { toast } from 'sonner'
import { marketingApi } from '../../lib/api'
import type { Template, CampaignType } from '../../types/marketing'
import { format } from 'date-fns'

export default function TemplateManager() {
    const [selectedType, setSelectedType] = useState<CampaignType | ''>('')
    const queryClient = useQueryClient()

    // Fetch templates
    const { data: templates, isLoading } = useQuery({
        queryKey: ['templates', selectedType],
        queryFn: async () => {
            const response = await marketingApi.getTemplates(selectedType || undefined)
            return response.data as Template[]
        },
    })

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: (id: string) => marketingApi.deleteTemplate(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['templates'] })
            toast.success('Template supprimé')
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Erreur suppression')
        },
    })

    const handleDelete = (id: string) => {
        if (confirm('Êtes-vous sûr de vouloir supprimer ce template ?')) {
            deleteMutation.mutate(id)
        }
    }

    if (isLoading) {
        return <div className="text-center py-12 text-slate-600">Chargement...</div>
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value as any)}
                    className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                >
                    <option value="">Tous les types</option>
                    <option value="SMS">SMS</option>
                    <option value="EMAIL">Email</option>
                </select>

                <button className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-slate-800 transition-colors">
                    <Plus size={18} />
                    Nouveau template
                </button>
            </div>

            {/* Templates Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates?.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-slate-600">
                        Aucun template trouvé
                    </div>
                ) : (
                    templates?.map((template) => (
                        <div
                            key={template.id}
                            className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                            {/* Header */}
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    {template.type === 'SMS' ? (
                                        <MessageSquare size={18} className="text-purple-600" />
                                    ) : (
                                        <Mail size={18} className="text-indigo-600" />
                                    )}
                                    <h3 className="font-semibold text-slate-900">{template.name}</h3>
                                </div>
                                <span
                                    className={`text-xs px-2 py-1 rounded-full ${template.type === 'SMS'
                                            ? 'bg-purple-100 text-purple-800'
                                            : 'bg-indigo-100 text-indigo-800'
                                        }`}
                                >
                                    {template.type}
                                </span>
                            </div>

                            {/* Description */}
                            {template.description && (
                                <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                                    {template.description}
                                </p>
                            )}

                            {/* Content Preview */}
                            <div className="bg-slate-50 border border-slate-200 rounded p-3 mb-3">
                                <p className="text-xs text-slate-700 line-clamp-3">{template.content}</p>
                            </div>

                            {/* Variables */}
                            {template.variables && template.variables.length > 0 && (
                                <div className="mb-3">
                                    <p className="text-xs text-slate-500 mb-1">Variables :</p>
                                    <div className="flex flex-wrap gap-1">
                                        {template.variables.map((v) => (
                                            <span
                                                key={v}
                                                className="text-xs px-2 py-0.5 bg-slate-100 text-slate-700 rounded"
                                            >
                                                {v}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Footer */}
                            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                                <span className="text-xs text-slate-500">
                                    {format(new Date(template.createdAt), 'dd/MM/yyyy')}
                                </span>
                                <div className="flex items-center gap-2">
                                    <button className="p-1.5 hover:bg-slate-100 rounded transition-colors">
                                        <Edit size={14} className="text-slate-600" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(template.id)}
                                        className="p-1.5 hover:bg-red-50 rounded transition-colors"
                                    >
                                        <Trash2 size={14} className="text-red-600" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
