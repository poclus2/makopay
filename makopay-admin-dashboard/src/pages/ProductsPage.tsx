import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import { Plus, Edit2, Trash2, X, Package, Search } from 'lucide-react'
import { useState } from 'react'

const XOF_RATE = 655.957;

interface Product {
    id: string
    name: string
    sku: string
    price: number
    stock: number
    description?: string
    imageUrl?: string
    isCommissionable: boolean
    investmentPlanId?: string
    investmentPlan?: {
        name: string
    }
}

interface InvestmentPlan {
    id: string
    name: string
}

export default function ProductsPage() {
    const queryClient = useQueryClient()
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingProduct, setEditingProduct] = useState<Product | null>(null)
    const [searchTerm, setSearchTerm] = useState('')

    // Form Data
    const [formData, setFormData] = useState({
        name: '',
        sku: '',
        price: 0,
        stock: 0,
        description: '',
        imageUrl: '',
        isCommissionable: true,
        investmentPlanId: ''
    })
    const [uploading, setUploading] = useState(false)

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)
        const formData = new FormData()
        formData.append('file', file)

        try {
            const { data } = await api.post('/products/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
            setFormData(prev => ({ ...prev, imageUrl: data.url }))
        } catch (error) {
            console.error('Upload failed', error)
        } finally {
            setUploading(false)
        }
    }

    // Fetch Products
    const { data: products, isLoading } = useQuery<Product[]>({
        queryKey: ['products'],
        queryFn: async () => {
            const { data } = await api.get('/products')
            return data
        },
    })

    // Fetch Plans for Dropdown
    const { data: plans } = useQuery<InvestmentPlan[]>({
        queryKey: ['plans-list'],
        queryFn: async () => {
            const { data } = await api.get('/investments/plans')
            return data
        },
    })

    const createMutation = useMutation({
        mutationFn: async (data: any) => {
            return api.post('/products', data)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] })
            closeModal()
        }
    })

    const updateMutation = useMutation({
        mutationFn: async (data: any) => {
            const { id, ...rest } = data
            return api.patch(`/products/${id}`, rest)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] })
            closeModal()
        }
    })

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            return api.delete(`/products/${id}`)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] })
        }
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        const payload = {
            ...formData,
            // Convert Input (XAF) to Backend (EUR)
            price: Number(formData.price) / XOF_RATE,
            stock: Number(formData.stock),
            investmentPlanId: formData.investmentPlanId || undefined
        }

        if (editingProduct) {
            updateMutation.mutate({ id: editingProduct.id, ...payload })
        } else {
            createMutation.mutate(payload)
        }
    }

    const openEditModal = (product: Product) => {
        setEditingProduct(product)
        setFormData({
            name: product.name,
            sku: product.sku,
            // Convert Backend (EUR) to Display (XAF)
            price: Math.round(Number(product.price) * XOF_RATE),
            stock: Number(product.stock),
            description: product.description || '',
            imageUrl: product.imageUrl || '',
            isCommissionable: product.isCommissionable,
            investmentPlanId: product.investmentPlanId || ''
        })
        setIsModalOpen(true)
    }

    const closeModal = () => {
        setIsModalOpen(false)
        setEditingProduct(null)
        setFormData({
            name: '',
            sku: '',
            price: 0,
            stock: 0,
            description: '',
            imageUrl: '',
            isCommissionable: true,
            investmentPlanId: ''
        })
    }

    const filteredProducts = products?.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        )
    }

    return (
        <div className="p-8 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Produits</h1>
                    <p className="text-slate-500">Gérez le catalogue boutique (Prix en FCFA)</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    <Plus size={20} />
                    Nouveau Produit
                </button>
            </div>

            <div className="flex items-center space-x-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <Search className="h-5 w-5 text-slate-400" />
                <input
                    type="text"
                    placeholder="Rechercher un produit..."
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
                                <th className="p-4 text-sm font-semibold text-slate-600">Produit</th>
                                <th className="p-4 text-sm font-semibold text-slate-600">SKU</th>
                                <th className="p-4 text-sm font-semibold text-slate-600">Prix (FCFA)</th>
                                <th className="p-4 text-sm font-semibold text-slate-600">Stock</th>
                                <th className="p-4 text-sm font-semibold text-slate-600">Plan Lié</th>
                                <th className="p-4 text-sm font-semibold text-slate-600 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {filteredProducts?.map((product) => (
                                <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden">
                                                {product.imageUrl ? (
                                                    <img src={`${import.meta.env.VITE_API_URL}${product.imageUrl}`} alt={product.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <Package className="text-slate-400" size={20} />
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-medium text-slate-800">{product.name}</div>
                                                {product.isCommissionable && (
                                                    <span className="text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded">Comm.</span>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 text-slate-600 font-mono text-sm">{product.sku}</td>
                                    <td className="p-4 text-slate-800 font-medium">
                                        {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(product.price * XOF_RATE)}
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${product.stock > 10 ? 'bg-green-100 text-green-700' :
                                            product.stock > 0 ? 'bg-orange-100 text-orange-700' :
                                                'bg-red-100 text-red-700'
                                            }`}>
                                            {product.stock} en stock
                                        </span>
                                    </td>
                                    <td className="p-4 text-slate-600 text-sm">
                                        {product.investmentPlan ? (
                                            <span className="text-indigo-600">{product.investmentPlan.name}</span>
                                        ) : (
                                            <span className="text-slate-400">-</span>
                                        )}
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => openEditModal(product)}
                                                className="p-2 hover:bg-indigo-50 text-indigo-600 rounded-lg transition-colors"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
                                                        deleteMutation.mutate(product.id)
                                                    }
                                                }}
                                                className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredProducts?.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center text-slate-400">
                                        <div className="flex flex-col items-center justify-center space-y-3">
                                            <Package className="h-12 w-12 opacity-20" />
                                            <p>Aucun produit trouvé</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 sticky top-0 bg-white z-10">
                            <h2 className="text-lg font-semibold text-slate-800">
                                {editingProduct ? 'Modifier le Produit' : 'Nouveau Produit'}
                            </h2>
                            <button onClick={closeModal} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                                <X size={20} className="text-slate-500" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Nom du Produit</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                                        placeholder="ex: Mining Ring A1"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">SKU</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.sku}
                                        onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                                        placeholder="ex: MR-A1-001"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Prix (FCFA)</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                                    />
                                    <p className="text-xs text-slate-500 mt-1">
                                        ~ {(Number(formData.price) / XOF_RATE).toFixed(2)} €
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Stock</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        value={formData.stock}
                                        onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                                    />
                                </div>

                                <div className="flex items-center pt-6">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <div className="relative">
                                            <input
                                                type="checkbox"
                                                checked={formData.isCommissionable}
                                                onChange={(e) => setFormData({ ...formData, isCommissionable: e.target.checked })}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                        </div>
                                        <span className="text-sm font-medium text-slate-700">Commissionnable (MLM)</span>
                                    </label>
                                </div>
                            </div>

                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Image du Produit</label>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-4">
                                        {formData.imageUrl && (
                                            <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-slate-200 shrink-0">
                                                <img
                                                    src={formData.imageUrl.startsWith('http') ? formData.imageUrl : `${import.meta.env.VITE_API_URL}${formData.imageUrl}`}
                                                    alt="Preview"
                                                    className="w-full h-full object-cover"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, imageUrl: '' })}
                                                    className="absolute top-0 right-0 p-1 bg-white/80 text-red-600 hover:bg-white rounded-bl-lg"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        )}
                                        <div className="flex-1">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                                disabled={uploading}
                                                className="block w-full text-sm text-slate-500
                                                    file:mr-4 file:py-2 file:px-4
                                                    file:rounded-full file:border-0
                                                    file:text-sm file:font-semibold
                                                    file:bg-indigo-50 file:text-indigo-700
                                                    hover:file:bg-indigo-100
                                                "
                                            />
                                            {uploading && <p className="text-xs text-indigo-600 mt-1">Téléchargement...</p>}
                                        </div>
                                    </div>

                                    <div className="relative">
                                        <div className="absolute inset-0 flex items-center">
                                            <span className="w-full border-t border-slate-200" />
                                        </div>
                                        <div className="relative flex justify-center text-xs uppercase">
                                            <span className="bg-white px-2 text-slate-500">Ou lien direct</span>
                                        </div>
                                    </div>

                                    <input
                                        type="url"
                                        placeholder="https://exemple.com/image.jpg"
                                        value={formData.imageUrl}
                                        onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm"
                                    />
                                </div>
                            </div>

                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none h-24 resize-none"
                                    placeholder="Description détaillée..."
                                />
                            </div>

                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Plan d'Investissement Associé</label>
                                <select
                                    value={formData.investmentPlanId}
                                    onChange={(e) => setFormData({ ...formData, investmentPlanId: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                                >
                                    <option value="">Aucun plan associé</option>
                                    {plans?.map(plan => (
                                        <option key={plan.id} value={plan.id}>
                                            {plan.name}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-slate-500 mt-1">
                                    Lier ce produit à un plan d'investissement active la création de l'investissement lors de l'achat.
                                </p>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={createMutation.isPending || updateMutation.isPending}
                                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                                >
                                    {createMutation.isPending || updateMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
