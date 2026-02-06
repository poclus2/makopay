import { useState, useEffect } from 'react'
import { X, ArrowRight, ArrowLeft, Check, Calendar } from 'lucide-react'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { marketingApi } from '../../lib/api'
import type { CampaignType, TargetType, UserFilters } from '../../types/marketing'
import UserTargeting from './UserTargeting'
import MessageComposer from './MessageComposer'
import CsvUploader from './CsvUploader'

interface CampaignWizardProps {
    onClose: () => void
}

interface WizardState {
    name: string
    type: CampaignType
    templateId: string
    targetType: TargetType
    filters: UserFilters
    csvFile: string | null
    csvContent?: string
    subject: string
    message: string
    sendNow: boolean
    scheduledAt: string
}

export default function CampaignWizard({ onClose }: CampaignWizardProps) {
    const [step, setStep] = useState(1)
    const queryClient = useQueryClient()

    const [formData, setFormData] = useState<WizardState>({
        name: '',
        type: 'SMS',
        templateId: '',
        targetType: 'ALL_USERS',
        filters: {},
        csvFile: null,
        subject: '',
        message: '',
        sendNow: true,
        scheduledAt: '',
    })

    // Fetch templates
    const { data: templates } = useQuery({
        queryKey: ['templates', formData.type],
        queryFn: async () => {
            const res = await marketingApi.getTemplates(formData.type)
            return res.data
        },
    })

    // Fetch targeted users count for summary
    const { data: userCountData } = useQuery({
        queryKey: ['user-count', formData.filters, formData.targetType],
        queryFn: async () => {
            if (formData.targetType === 'ALL_USERS') return { count: 'Tous' }
            if (formData.targetType === 'FILTERED') {
                const res = await marketingApi.countTargetedUsers(formData.filters)
                return res.data
            }
            return { count: 0 }
        },
        enabled: formData.targetType === 'FILTERED' || formData.targetType === 'ALL_USERS',
    })

    const createMutation = useMutation({
        mutationFn: (data: any) => marketingApi.createCampaign(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['campaigns'] })
            toast.success('Campagne créée avec succès')
            onClose()
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Erreur lors de la création')
        },
    })

    const handleFileSelect = async (file: File) => {
        const text = await file.text()
        setFormData(prev => ({
            ...prev,
            csvFile: file.name,
            csvContent: text
        }))
    }

    const handleTemplateSelect = (templateId: string) => {
        const template = templates?.find((t: any) => t.id === templateId)
        if (template) {
            setFormData(prev => ({
                ...prev,
                templateId,
                subject: template.subject || prev.subject,
                message: template.content || prev.message,
            }))
        } else {
            setFormData(prev => ({ ...prev, templateId: '' }))
        }
    }

    const handleSubmit = () => {
        if (!formData.name) {
            toast.error('Le nom de la campagne est requis')
            return
        }
        if (!formData.message) {
            toast.error('Le message est requis')
            return
        }
        if (formData.targetType === 'CUSTOM_LIST' && !formData.csvContent) {
            toast.error('Veuillez importer un fichier CSV valide')
            return
        }

        const payload = {
            name: formData.name,
            type: formData.type,
            templateId: formData.templateId || undefined,
            targetType: formData.targetType,
            filters: formData.targetType === 'FILTERED' ? formData.filters : undefined,
            csvContent: formData.targetType === 'CUSTOM_LIST' ? formData.csvContent : undefined,
            // For CSV, we'd need to handle upload or text. For now, sending basic info.
            subject: formData.type === 'EMAIL' ? formData.subject : undefined,
            message: formData.message,
            sendNow: formData.sendNow,
            scheduledAt: formData.scheduledAt || undefined,
        }

        createMutation.mutate(payload)
    }

    const nextStep = () => {
        if (step === 1 && !formData.name) {
            toast.error('Veuillez entrer un nom de campagne')
            return
        }
        setStep(p => Math.min(p + 1, 4))
    }

    const prevStep = () => setStep(p => Math.max(p - 1, 1))

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">Nouvelle campagne</h2>
                        <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
                            <span className={step >= 1 ? 'text-black font-medium' : ''}>1. Infos</span>
                            <span className="text-slate-300">→</span>
                            <span className={step >= 2 ? 'text-black font-medium' : ''}>2. Audience</span>
                            <span className="text-slate-300">→</span>
                            <span className={step >= 3 ? 'text-black font-medium' : ''}>3. Message</span>
                            <span className="text-slate-300">→</span>
                            <span className={step >= 4 ? 'text-black font-medium' : ''}>4. Validation</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
                        <X size={24} />
                    </button>
                </div>

                {/* Content - Scrollable */}
                <div className="flex-1 overflow-y-auto p-6">
                    {step === 1 && (
                        <div className="space-y-6 max-w-2xl mx-auto">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Nom de la campagne *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                    placeholder="Ex: Promo Noël 2026"
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Type de campagne</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, type: 'SMS' })}
                                        className={`p-4 border-2 rounded-xl text-left transition-all ${formData.type === 'SMS'
                                            ? 'border-black bg-slate-50'
                                            : 'border-slate-200 hover:border-slate-300'
                                            }`}
                                    >
                                        <div className="font-semibold text-lg mb-1">SMS</div>
                                        <div className="text-sm text-slate-500">Envoi direct sur mobile. Taux d'ouverture élevé.</div>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, type: 'EMAIL' })}
                                        className={`p-4 border-2 rounded-xl text-left transition-all ${formData.type === 'EMAIL'
                                            ? 'border-black bg-slate-50'
                                            : 'border-slate-200 hover:border-slate-300'
                                            }`}
                                    >
                                        <div className="font-semibold text-lg mb-1">Email</div>
                                        <div className="text-sm text-slate-500">Newsletter HTML riche. Contenu détaillé.</div>
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Template (Optionnel)</label>
                                <select
                                    value={formData.templateId}
                                    onChange={e => handleTemplateSelect(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                >
                                    <option value="">-- Aucun template --</option>
                                    {templates?.map((t: any) => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6 max-w-3xl mx-auto">
                            <div className="grid grid-cols-3 gap-4 mb-6">
                                {[
                                    { id: 'ALL_USERS', label: 'Tous les utilisateurs', desc: 'Envoyer à toute la base' },
                                    { id: 'FILTERED', label: 'Ciblage avancé', desc: 'Filtrer par critères (KYC, Solde...)' },
                                    { id: 'CUSTOM_LIST', label: 'Import CSV', desc: 'Liste externe de numéros/emails' }
                                ].map(option => (
                                    <button
                                        key={option.id}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, targetType: option.id as TargetType })}
                                        className={`p-4 border-2 rounded-xl text-left transition-all ${formData.targetType === option.id
                                            ? 'border-black bg-slate-50'
                                            : 'border-slate-200 hover:border-slate-300'
                                            }`}
                                    >
                                        <div className="font-semibold text-sm mb-1">{option.label}</div>
                                        <div className="text-xs text-slate-500">{option.desc}</div>
                                    </button>
                                ))}
                            </div>

                            {formData.targetType === 'FILTERED' && (
                                <UserTargeting
                                    filters={formData.filters}
                                    onFiltersChange={f => setFormData({ ...formData, filters: f })}
                                />
                            )}

                            {formData.targetType === 'CUSTOM_LIST' && (
                                <CsvUploader
                                    onFileSelect={handleFileSelect}
                                />
                            )}

                            {formData.targetType === 'ALL_USERS' && (
                                <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200">
                                    <h3 className="text-xl font-bold text-slate-900 mb-2">Envoi à toute la base</h3>
                                    <p className="text-slate-600">
                                        Cette campagne sera envoyée à tous les utilisateurs actifs de la plateforme.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {step === 3 && (
                        <div className="max-w-3xl mx-auto">
                            <MessageComposer
                                type={formData.type}
                                subject={formData.subject}
                                message={formData.message}
                                onSubjectChange={s => setFormData({ ...formData, subject: s })}
                                onMessageChange={m => setFormData({ ...formData, message: m })}
                            />
                        </div>
                    )}

                    {step === 4 && (
                        <div className="max-w-2xl mx-auto space-y-6">
                            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-4">
                                <h3 className="font-bold text-lg text-slate-900 border-b border-slate-200 pb-2">Récapitulatif</h3>

                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-slate-500 block">Campagne</span>
                                        <span className="font-medium text-slate-900">{formData.name}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-500 block">Canal</span>
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                            {formData.type}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-slate-500 block">Cible</span>
                                        <span className="font-medium text-slate-900">
                                            {formData.targetType === 'ALL_USERS' && 'Tous les utilisateurs'}
                                            {formData.targetType === 'FILTERED' && 'Utilisateurs filtrés'}
                                            {formData.targetType === 'CUSTOM_LIST' && 'Fichier CSV'}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-slate-500 block">Audience estimée</span>
                                        <span className="font-medium text-slate-900">
                                            {userCountData?.count?.toLocaleString() || '-'} destinataires
                                        </span>
                                    </div>
                                    {formData.type === 'EMAIL' && (
                                        <div className="col-span-2">
                                            <span className="text-slate-500 block">Sujet</span>
                                            <span className="font-medium text-slate-900">{formData.subject}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="flex items-center gap-3 p-4 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                                    <input
                                        type="radio"
                                        checked={formData.sendNow}
                                        onChange={() => setFormData({ ...formData, sendNow: true })}
                                        className="h-4 w-4 text-black border-slate-300 focus:ring-black"
                                    />
                                    <div>
                                        <div className="font-medium text-slate-900">Envoyer maintenant</div>
                                        <div className="text-xs text-slate-500">La campagne démarrera immédiatement</div>
                                    </div>
                                </label>

                                <label className="flex items-start gap-3 p-4 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                                    <input
                                        type="radio"
                                        checked={!formData.sendNow}
                                        onChange={() => setFormData({ ...formData, sendNow: false })}
                                        className="mt-1 h-4 w-4 text-black border-slate-300 focus:ring-black"
                                    />
                                    <div className="flex-1">
                                        <div className="font-medium text-slate-900 mb-2">Programmer l'envoi</div>
                                        <div className="flex items-center gap-2">
                                            <Calendar size={16} className="text-slate-500" />
                                            <input
                                                type="datetime-local"
                                                value={formData.scheduledAt}
                                                onChange={e => setFormData({ ...formData, scheduledAt: e.target.value, sendNow: false })}
                                                disabled={formData.sendNow}
                                                className="px-3 py-1.5 border border-slate-300 rounded text-sm disabled:bg-slate-100"
                                            />
                                        </div>
                                    </div>
                                </label>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-between p-6 border-t border-slate-200 bg-slate-50 rounded-b-2xl">
                    <button
                        onClick={step === 1 ? onClose : prevStep}
                        className="px-6 py-2 border border-slate-300 rounded-lg hover:bg-white transition-colors"
                    >
                        {step === 1 ? 'Annuler' : 'Retour'}
                    </button>

                    <div className="flex items-center gap-2">
                        {step < 4 ? (
                            <button
                                onClick={nextStep}
                                className="flex items-center gap-2 px-6 py-2 bg-black text-white rounded-lg hover:bg-slate-800 transition-colors"
                            >
                                Suivant <ArrowRight size={18} />
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                disabled={createMutation.isPending}
                                className="flex items-center gap-2 px-6 py-2 bg-black text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
                            >
                                {createMutation.isPending ? 'Création...' : (
                                    <>
                                        {formData.sendNow ? 'Envoyer la campagne' : 'Programmer'}
                                        <Check size={18} />
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
