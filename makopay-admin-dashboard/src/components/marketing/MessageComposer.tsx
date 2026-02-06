import { useState, useEffect } from 'react'
import { Type } from 'lucide-react'
import type { CampaignType } from '../../types/marketing'

interface MessageComposerProps {
    type: CampaignType
    subject: string
    message: string
    onSubjectChange: (value: string) => void
    onMessageChange: (value: string) => void
}

export default function MessageComposer({
    type,
    subject,
    message,
    onSubjectChange,
    onMessageChange,
}: MessageComposerProps) {
    const [charCount, setCharCount] = useState(0)
    const [smsCount, setSmsCount] = useState(1)

    const variables = [
        '{firstName}',
        '{lastName}',
        '{balance}',
        '{phone}',
        '{email}',
        '{kycStatus}',
        '{referralCode}',
    ]

    useEffect(() => {
        const count = message.length
        setCharCount(count)

        if (type === 'SMS') {
            // SMS: 160 chars for 1 SMS, 306 for 2, etc.
            setSmsCount(count === 0 ? 1 : Math.ceil(count / 160))
        }
    }, [message, type])

    const handleVariableInsert = (variable: string) => {
        const cursorPos = (document.getElementById('message-input') as HTMLTextAreaElement)?.selectionStart || message.length
        const newMessage = message.substring(0, cursorPos) + variable + message.substring(cursorPos)
        onMessageChange(newMessage)
    }

    // Generate preview with sample data
    const getPreview = () => {
        let preview = message
        preview = preview.replace(/{firstName}/g, 'Jean')
        preview = preview.replace(/{lastName}/g, 'Dupont')
        preview = preview.replace(/{balance}/g, '50,000')
        preview = preview.replace(/{phone}/g, '+237 6XX XX XX XX')
        preview = preview.replace(/{email}/g, 'jean.dupont@example.com')
        preview = preview.replace(/{kycStatus}/g, 'APPROVED')
        preview = preview.replace(/{referralCode}/g, 'REF12345')
        return preview
    }

    return (
        <div className="space-y-4">
            {/* Subject (Email only) */}
            {type === 'EMAIL' && (
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Sujet *
                    </label>
                    <input
                        type="text"
                        value={subject}
                        onChange={(e) => onSubjectChange(e.target.value)}
                        placeholder="Sujet de l'email"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                        required
                    />
                </div>
            )}

            {/* Message */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-slate-700">Message *</label>
                    <span className="text-sm text-slate-500">
                        {charCount} {type === 'SMS' && `caractères (${smsCount} SMS)`}
                    </span>
                </div>
                <textarea
                    id="message-input"
                    value={message}
                    onChange={(e) => onMessageChange(e.target.value)}
                    placeholder="Votre message..."
                    rows={6}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg resize-none"
                    required
                />
                {type === 'SMS' && charCount > 320 && (
                    <p className="text-xs text-orange-600 mt-1">
                        ⚠️ Les messages de plus de 320 caractères seront facturés comme {smsCount} SMS
                    </p>
                )}
            </div>

            {/* Variables */}
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <Type size={14} className="text-slate-600" />
                    <span className="text-sm font-medium text-slate-700">Variables disponibles</span>
                </div>
                <div className="flex flex-wrap gap-2">
                    {variables.map((variable) => (
                        <button
                            key={variable}
                            onClick={() => handleVariableInsert(variable)}
                            className="px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                        >
                            {variable}
                        </button>
                    ))}
                </div>
            </div>

            {/* Preview */}
            <div>
                <h4 className="text-sm font-medium text-slate-700 mb-2">Aperçu</h4>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                    {type === 'EMAIL' && subject && (
                        <p className="font-semibold text-slate-900 mb-2 pb-2 border-b border-slate-300">
                            {subject}
                        </p>
                    )}
                    <p className="text-slate-700 whitespace-pre-wrap">
                        {getPreview() || (
                            <span className="text-slate-400 italic">Tapez votre message pour voir l'aperçu...</span>
                        )}
                    </p>
                </div>
            </div>

            {/* Cost Estimate */}
            {message && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-900">
                        <span className="font-medium">Coût estimé par destinataire :</span>{' '}
                        {type === 'SMS' ? `${25 * smsCount} XAF` : '5 XAF'}
                    </p>
                </div>
            )}
        </div>
    )
}
