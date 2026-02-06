import { useState } from 'react'
import { TrendingUp, Mail, FileText } from 'lucide-react'
import CampaignStats from '../components/marketing/CampaignStats'
import CampaignsTable from '../components/marketing/CampaignsTable'
import TemplateManager from '../components/marketing/TemplateManager'

export default function Marketing() {
    const [activeTab, setActiveTab] = useState<'overview' | 'campaigns' | 'templates'>('overview')

    const tabs = [
        { id: 'overview' as const, label: 'Vue d\'ensemble', icon: TrendingUp },
        { id: 'campaigns' as const, label: 'Campagnes', icon: Mail },
        { id: 'templates' as const, label: 'Templates', icon: FileText },
    ]

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Marketing</h1>
                <p className="text-slate-600 mt-1">Gérez vos campagnes SMS et Email</p>
            </div>

            {/* Tabs */}
            <div className="border-b border-slate-200">
                <nav className="flex gap-8">
                    {tabs.map((tab) => {
                        const Icon = tab.icon
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                                    flex items-center gap-2 pb-4 border-b-2 transition-colors
                                    ${activeTab === tab.id
                                        ? 'border-black text-black'
                                        : 'border-transparent text-slate-600 hover:text-slate-900'
                                    }
                                `}
                            >
                                <Icon size={18} />
                                <span className="font-medium">{tab.label}</span>
                            </button>
                        )
                    })}
                </nav>
            </div>

            {/* Content */}
            <div>
                {activeTab === 'overview' && <CampaignStats />}
                {activeTab === 'campaigns' && <CampaignsTable />}
                {activeTab === 'templates' && <TemplateManager />}
            </div>
        </div>
    )
}
