import { useState } from 'react';
import { Settings, Bell, Shield, Database } from 'lucide-react';
import { NotificationTab } from '../components/settings/NotificationTab';

export function SettingsPage() {
    const [activeTab, setActiveTab] = useState('notifications');

    return (
        <div className="h-full flex flex-col">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                <p className="text-gray-500">Manage system configurations and preferences.</p>
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
                        onClick={() => setActiveTab('security')}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'security'
                            ? 'bg-teal-50 text-teal-700'
                            : 'text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        <Shield className="w-5 h-5" />
                        <span>Security (Soon)</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('system')}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'system'
                            ? 'bg-teal-50 text-teal-700'
                            : 'text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        <Database className="w-5 h-5" />
                        <span>System (Soon)</span>
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 p-8 overflow-y-auto">
                    {activeTab === 'notifications' && <NotificationTab />}
                    {activeTab === 'security' && (
                        <div className="text-center py-12 text-gray-500">Security settings coming soon.</div>
                    )}
                    {activeTab === 'system' && (
                        <div className="text-center py-12 text-gray-500">System parameters coming soon.</div>
                    )}
                </div>
            </div>
        </div>
    );
}
