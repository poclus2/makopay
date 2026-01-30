import { useState } from 'react'
import { LayoutDashboard, Users, Wallet, LogOut, Menu, X, Bell, Search, TrendingUp, Package, Settings, MessageCircle } from 'lucide-react'
import DashboardPage from '../pages/DashboardPage'
import DepositsPage from '../pages/DepositsPage'
import UsersPage from '../pages/UsersPage'
import PlansPage from '../pages/PlansPage'
import ProductsPage from '../pages/ProductsPage'
import { SettingsPage } from '../pages/Settings'
import SupportPage from '../pages/SupportPage'

interface DashboardLayoutProps {
    onLogout: () => void
}

import WithdrawalsPage from '../pages/WithdrawalsPage'

type Page = 'dashboard' | 'deposits' | 'withdrawals' | 'users' | 'plans' | 'products' | 'settings' | 'support'

export default function DashboardLayout({ onLogout }: DashboardLayoutProps) {
    const [currentPage, setCurrentPage] = useState<Page>('dashboard')
    const [sidebarOpen, setSidebarOpen] = useState(true)

    const navigation = [
        { name: 'Dashboard', page: 'dashboard' as Page, icon: LayoutDashboard },
        { name: 'Dépôts', page: 'deposits' as Page, icon: Wallet },
        { name: 'Retraits', page: 'withdrawals' as Page, icon: LogOut },
        { name: 'Utilisateurs', page: 'users' as Page, icon: Users },
        { name: 'Plans', page: 'plans' as Page, icon: TrendingUp },
        { name: 'Produits', page: 'products' as Page, icon: Package },
        { name: 'Support', page: 'support' as Page, icon: MessageCircle },
        { name: 'Paramètres', page: 'settings' as Page, icon: Settings },
    ]

    const renderPage = () => {
        switch (currentPage) {
            case 'dashboard':
                return <DashboardPage />
            case 'deposits':
                return <DepositsPage />
            case 'withdrawals':
                return <WithdrawalsPage />
            case 'users':
                return <UsersPage />
            case 'plans':
                return <PlansPage />
            case 'products':
                return <ProductsPage />
            case 'settings':
                return <SettingsPage />
            case 'support':
                return <SupportPage />
            default:
                return <DashboardPage />
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Sidebar */}
            <aside
                className={`${sidebarOpen ? 'w-72' : 'w-20'
                    } bg-white border-r border-slate-200 transition-all duration-300 flex flex-col shadow-sm`}
            >
                {/* Sidebar Header */}
                <div className="h-16 px-6 flex items-center justify-between border-b border-slate-200">
                    <div className={`flex items-center gap-3 ${!sidebarOpen && 'justify-center w-full'}`}>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-black/5">
                            <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
                        </div>
                        {sidebarOpen && (
                            <div>
                                <h1 className="font-bold text-slate-800 text-lg">MakoPay</h1>
                                <p className="text-xs text-slate-500">Admin Panel</p>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        {sidebarOpen ? (
                            <X size={18} className="text-slate-600" />
                        ) : (
                            <Menu size={18} className="text-slate-600" />
                        )}
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-1">
                    {navigation.map((item) => {
                        const Icon = item.icon
                        const isActive = currentPage === item.page
                        return (
                            <button
                                key={item.page}
                                onClick={() => setCurrentPage(item.page)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                                    : 'text-slate-600 hover:bg-slate-100'
                                    }`}
                            >
                                <Icon size={20} className={isActive ? 'text-white' : 'text-slate-500'} />
                                {sidebarOpen && <span className="font-medium">{item.name}</span>}
                            </button>
                        )
                    })}
                </nav>

                {/* Logout Button */}
                <div className="p-4 border-t border-slate-200">
                    <button
                        onClick={onLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all"
                    >
                        <LogOut size={20} />
                        {sidebarOpen && <span className="font-medium">Déconnexion</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-h-screen">
                {/* Top Bar */}
                <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-4 flex-1">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Rechercher..."
                                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-slate-50"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="relative p-2 hover:bg-slate-100 rounded-lg transition-colors">
                            <Bell size={20} className="text-slate-600" />
                            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                        </button>

                        <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                                <span className="text-white font-semibold text-sm">SA</span>
                            </div>
                            <div className="hidden md:block">
                                <p className="text-sm font-semibold text-slate-800">Super Admin</p>
                                <p className="text-xs text-slate-500">admin@makopay.com</p>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-auto bg-slate-50">
                    {renderPage()}
                </main>
            </div>
        </div>
    )
}
