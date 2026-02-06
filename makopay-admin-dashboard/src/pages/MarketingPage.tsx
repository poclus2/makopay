import { useState } from 'react'
import { Megaphone, FileText, BarChart3 } from 'lucide-react'
import CampaignsTable from '../components/marketing/CampaignsTable'
import TemplateManager from '../components/marketing/TemplateManager'
import CampaignStats from '../components/marketing/CampaignStats'

type TabType = 'campaigns' | 'templates' | 'analytics'

export default function MarketingPage() {
    const [activeTab, setActiveTab] = useState<TabType>('campaigns')

    const tabs = [
        { id: 'campaigns' as TabType, label: 'Campagnes', icon: Megaphone },
        { id: 'templates' as TabType, label: 'Templates', icon: FileText },
        { id: 'analytics' as TabType, label: 'Analytics', icon: BarChart3 },
    ]

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Marketing Campaigns</h1>
                <p className="text-slate-600 mt-1">
                    Gérez vos campagnes SMS et Email
                </p>
            </div>

            {/* Tabs */}
            <div className="border-b border-slate-200">
                <nav className="flex gap-8">
                    {tabs.map((tab) => {
                        const Icon = tab.icon
                        const isActive = activeTab === tab.id
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                                    flex items-center gap-2 px-1 py-4 border-b-2 font-medium text-sm
                                    transition-colors
                                    ${isActive
                                        ? 'border-black text-black'
                                        : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                                    }
                                `}
                            >
                                <Icon size={18} />
                                {tab.label}
                            </button>
                        )
                    })}
                </nav>
            </div>

            {/* Content */}
            <div>
                {activeTab === 'campaigns' && <CampaignsTable />}
                {activeTab === 'templates' && <TemplateManager />}
                {activeTab === 'analytics' && <CampaignStats />}
            </div>
        </div>
    )
}
