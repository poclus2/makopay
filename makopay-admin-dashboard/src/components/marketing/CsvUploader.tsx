import { useState, useRef } from 'react'
import { Upload, FileText, X, CheckCircle, AlertCircle } from 'lucide-react'

interface CsvUploaderProps {
    onFileSelect: (file: File) => void
}

export default function CsvUploader({ onFileSelect }: CsvUploaderProps) {
    const [isDragging, setIsDragging] = useState(false)
    const [file, setFile] = useState<File | null>(null)
    const [preview, setPreview] = useState<string[][]>([])
    const [errors, setErrors] = useState<string[]>([])
    const [totalRows, setTotalRows] = useState(0)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // ... (drag handlers unchanged)

    const handleFile = async (selectedFile: File) => {
        setErrors([])

        // Validate file type
        if (!selectedFile.name.endsWith('.csv')) {
            setErrors(['Le fichier doit être au format CSV'])
            return
        }

        // Validate file size (max 5MB)
        if (selectedFile.size > 5 * 1024 * 1024) {
            setErrors(['Le fichier ne doit pas dépasser 5 MB'])
            return
        }

        setFile(selectedFile)

        // Parse CSV for preview
        const text = await selectedFile.text()
        const lines = text.split(/\r?\n/).filter(l => l.trim()) // Handle both \r\n and \n

        // Validate line count
        if (lines.length > 10001) { // +1 for header
            setErrors([`Le fichier contient ${lines.length - 1} lignes. Maximum autorisé: 10,000`])
            return
        }

        // Parse lines
        const parsed = lines.map(line => line.split(',').map(cell => cell.trim()))

        // Validate header (allow single column if valid)
        const header = parsed[0]
        if (!header) {
            setErrors(['Le fichier est vide'])
            return
        }

        const hasPhone = header.includes('phone') || header.includes('phoneNumber')
        const hasEmail = header.includes('email')

        if (!hasPhone && !hasEmail) {
            setErrors(['Le fichier doit contenir au moins une colonne: phone, phoneNumber ou email'])
            return
        }

        setPreview(parsed.slice(0, 11)) // Header + 10 rows
        setTotalRows(Math.max(0, parsed.length - 1))

        // Pass full file object
        onFileSelect(selectedFile)
    }

    const handleRemove = () => {
        setFile(null)
        setPreview([])
        setErrors([])
        setTotalRows(0)
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }

    const handleDragLeave = () => {
        setIsDragging(false)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        const files = e.dataTransfer.files
        if (files[0]) {
            handleFile(files[0])
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (files?.[0]) {
            handleFile(files[0])
        }
    }

    return (
        <div className="space-y-4">
            {/* Upload Zone */}
            {!file && (
                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`
                        border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
                        transition-colors
                        ${isDragging
                            ? 'border-black bg-slate-50'
                            : 'border-slate-300 hover:border-slate-400'
                        }
                    `}
                >
                    <Upload size={48} className="mx-auto text-slate-400 mb-4" />
                    <p className="text-slate-700 font-medium mb-1">
                        Glissez-déposez votre fichier CSV ici
                    </p>
                    <p className="text-sm text-slate-500 mb-4">
                        ou cliquez pour sélectionner
                    </p>
                    <p className="text-xs text-slate-400">
                        Format: phone,email,firstName,lastName • Max 10,000 lignes • Max 5 MB
                    </p>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv"
                        onChange={handleFileChange}
                        className="hidden"
                    />
                </div>
            )}

            {/* Errors */}
            {errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                        <AlertCircle size={18} className="text-red-600 mt-0.5" />
                        <div className="flex-1">
                            <p className="font-medium text-red-900 mb-1">Erreurs détectées</p>
                            <ul className="text-sm text-red-700 space-y-1">
                                {errors.map((error, i) => (
                                    <li key={i}>• {error}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {/* File Info */}
            {
                file && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <CheckCircle size={20} className="text-green-600 mt-0.5" />
                            <div className="flex-1">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-green-900">{file.name}</p>
                                        <p className="text-sm text-green-700">
                                            {(file.size / 1024).toFixed(1)} KB • {totalRows} contacts détectés
                                        </p>
                                    </div>
                                    <button
                                        onClick={handleRemove}
                                        className="p-1.5 hover:bg-green-100 rounded-lg"
                                    >
                                        <X size={18} className="text-green-700" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Preview */}
            {
                preview.length > 1 && (
                    <div className="bg-white border border-slate-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <FileText size={16} className="text-slate-600" />
                            <h4 className="font-medium text-slate-900">Aperçu (10 premières lignes)</h4>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        {preview[0].map((header, i) => (
                                            <th key={i} className="px-3 py-2 text-left text-xs font-medium text-slate-600 uppercase">
                                                {header}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {preview.slice(1).map((row, i) => (
                                        <tr key={i}>
                                            {row.map((cell, j) => (
                                                <td key={j} className="px-3 py-2 text-slate-700">
                                                    {cell}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )
            }

            {/* Template Download */}
            <div className="text-center">
                <button className="text-sm text-slate-600 hover:text-slate-900 underline">
                    Télécharger le template CSV
                </button>
            </div>
        </div >
    )
}
