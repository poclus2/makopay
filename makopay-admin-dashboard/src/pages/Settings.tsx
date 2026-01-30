import { useState } from 'react';
import { FeesTab } from '../components/settings/FeesTab';
import { Percent } from 'lucide-react';

export function SettingsPage() {
    const [activeTab, setActiveTab] = useState('notifications');

    return (
        <div className="h-full flex flex-col">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
                <p className="text-gray-500">Configuration globale du système.</p>
            </div>

            <div className="bg-white shadow rounded-lg flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">
                {/* Sidebar Tabs */}
                <div className="w-full md:w-64 border-r border-gray-200 p-4 space-y-1 overflow-y-auto">
                    <button
                        onClick={() => setActiveTab('notifications')}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'notifications'
                            ? 'bg-teal-50 text-teal-700'
                            : 'text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        <Bell className="w-5 h-5" />
                        <span>Notifications</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('system')}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'system'
                            ? 'bg-teal-50 text-teal-700'
                            : 'text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        <Percent className="w-5 h-5" />
                        <span>Frais & Commissions</span>
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 p-8 overflow-y-auto">
                    {activeTab === 'notifications' && <NotificationTab />}
                    {activeTab === 'system' && <FeesTab />}
                </div>
            </div>
        </div>
    );
}
