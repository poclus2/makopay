import { useState, useEffect } from 'react';
import { Bell, Save, Mail, MessageSquare, RefreshCw, Send } from 'lucide-react';
import api from '../../lib/api';

interface NotificationSettings {
    emailEnabled: boolean;
    smsEnabled: boolean;
    otpTemplate?: string;
}

export function NotificationTab() {
    const [settings, setSettings] = useState<NotificationSettings>({
        emailEnabled: true,
        smsEnabled: true,
        otpTemplate: 'Makopay : a utiliser le {code}',
    });
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Test states
    const [testEmail, setTestEmail] = useState('');
    const [testPhone, setTestPhone] = useState('');
    const [sendingEmail, setSendingEmail] = useState(false);
    const [sendingSms, setSendingSms] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/admin/settings/notifications');
            setSettings(data);
        } catch (error) {
            console.error('Failed to fetch settings', error);
            setMessage({ type: 'error', text: 'Failed to load settings' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            await api.patch('/admin/settings/notifications', settings);
            setMessage({ type: 'success', text: 'Settings saved successfully' });
            setTimeout(() => setMessage(null), 3000);
        } catch (error) {
            console.error('Failed to save settings', error);
            setMessage({ type: 'error', text: 'Failed to save settings' });
        } finally {
            setSaving(false);
        }
    };

    const sendTestEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!testEmail) return;

        try {
            setSendingEmail(true);
            await api.post('/admin/settings/notifications/test-email', {
                to: testEmail,
                name: 'Admin Tester',
            });
            setMessage({ type: 'success', text: 'Test email sent!' });
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to send test email' });
        } finally {
            setSendingEmail(false);
        }
    };

    const sendTestSms = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!testPhone) return;

        try {
            setSendingSms(true);
            await api.post('/admin/settings/notifications/test-sms', {
                phoneNumber: testPhone,
                name: 'Admin Tester',
            });
            setMessage({ type: 'success', text: 'Test SMS sent!' });
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to send test SMS' });
        } finally {
            setSendingSms(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center">Loading settings...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium text-gray-900">Notification Channels</h3>
                    <p className="text-sm text-gray-500">Manage how the system sends notifications to users.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50"
                >
                    {saving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Changes
                </button>
            </div>

            {message && (
                <div className={`p-4 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {message.text}
                </div>
            )}

            {/* Global Toggles */}
            <div className="bg-white shadow rounded-lg p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${settings.emailEnabled ? 'bg-teal-100 text-teal-600' : 'bg-gray-100 text-gray-400'}`}>
                            <Mail className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-900">Email Notifications</p>
                            <p className="text-sm text-gray-500">Enable or disable all outgoing emails (Resend)</p>
                        </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={settings.emailEnabled}
                            onChange={(e) => setSettings({ ...settings, emailEnabled: e.target.checked })}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                    </label>
                </div>

                <div className="border-t pt-6 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${settings.smsEnabled ? 'bg-teal-100 text-teal-600' : 'bg-gray-100 text-gray-400'}`}>
                            <MessageSquare className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-900">SMS / WhatsApp Notifications</p>
                            <p className="text-sm text-gray-500">Enable or disable all outgoing SMS (Infobip)</p>
                        </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={settings.smsEnabled}
                            onChange={(e) => setSettings({ ...settings, smsEnabled: e.target.checked })}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                    </label>
                </div>

                {/* OTP Template Editor */}
                <div className="border-t pt-6">
                    <div className="flex flex-col space-y-2">
                        <div>
                            <p className="text-sm font-medium text-gray-900">SMS OTP Template</p>
                            <p className="text-sm text-gray-500">Customize the message sent for withdrawals. Use <code className="bg-gray-100 px-1 rounded">{'{code}'}</code> as a placeholder for the OTP.</p>
                        </div>
                        <div className="relative">
                            <input
                                type="text"
                                value={settings.otpTemplate || ''}
                                onChange={(e) => setSettings({ ...settings, otpTemplate: e.target.value })}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm p-2 border"
                                placeholder="Makopay : a utiliser le {code}"
                            />
                            <div className="text-xs text-gray-400 mt-1">
                                Preview: {settings.otpTemplate?.replace('{code}', '123456') || 'Makopay : a utiliser le 123456'}
                            </div>
                        </div>
                        <p className="text-xs text-amber-600 flex items-center gap-1">
                            ⚠️ Avoid words like "verification", "security code" which may be blocked by operators like MTN.
                        </p>
                    </div>
                </div>
            </div>

            {/* Testing Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Test Email */}
                <div className="bg-white shadow rounded-lg p-6">
                    <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center gap-2">
                        <Mail className="w-4 h-4" /> Test Email Delivery
                    </h4>
                    <form onSubmit={sendTestEmail} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Recipient Email</label>
                            <input
                                type="email"
                                value={testEmail}
                                onChange={(e) => setTestEmail(e.target.value)}
                                placeholder="you@example.com"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm p-2 border"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={sendingEmail || !testEmail}
                            className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-teal-700 bg-teal-100 hover:bg-teal-200 disabled:opacity-50"
                        >
                            {sendingEmail ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                            Send Test Email
                        </button>
                    </form>
                </div>

                {/* Test SMS */}
                <div className="bg-white shadow rounded-lg p-6">
                    <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" /> Test SMS Delivery
                    </h4>
                    <form onSubmit={sendTestSms} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                            <input
                                type="tel"
                                value={testPhone}
                                onChange={(e) => setTestPhone(e.target.value)}
                                placeholder="+2376..."
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm p-2 border"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={sendingSms || !testPhone}
                            className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-teal-700 bg-teal-100 hover:bg-teal-200 disabled:opacity-50"
                        >
                            {sendingSms ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                            Send Test SMS
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
