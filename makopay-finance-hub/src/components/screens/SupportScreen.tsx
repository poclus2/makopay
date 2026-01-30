import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useSupport } from '@/contexts/SupportContext';
import { useAuth } from '@/contexts/AuthContext';
import {
    ArrowLeft, Send, MessageCircle, Plus, Loader2,
    CheckCircle, AlertCircle, Clock, Paperclip, X, Download
} from 'lucide-react';
import GlassCard from '../makopay/GlassCard';
import axios from 'axios';
import { toast } from 'sonner';

interface PreChatFormProps {
    onSubmit: (data: { subject: string; category: string; priority: string; message: string }) => void;
    onCancel: () => void;
}

const PreChatForm = ({ onSubmit, onCancel }: PreChatFormProps) => {
    const { t } = useTranslation();
    const [subject, setSubject] = useState('');
    const [category, setCategory] = useState('GENERAL');
    const [priority, setPriority] = useState('MEDIUM');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!subject || !message) return;
        setLoading(true);
        await onSubmit({ subject, category, priority, message });
        setLoading(false);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4"
        >
            <div className="flex items-center gap-3 mb-6">
                <button onClick={onCancel} className="p-2 rounded-full hover:bg-white/5">
                    <ArrowLeft className="w-5 h-5 text-foreground" />
                </button>
                <h2 className="text-xl font-bold text-foreground">New Ticket</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm text-muted-foreground mb-1">Subject</label>
                    <input
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="w-full bg-background border border-border/50 rounded-xl p-3 text-foreground focus:outline-none focus:border-primary/50"
                        placeholder="Brief description"
                        required
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm text-muted-foreground mb-1">Category</label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full bg-background border border-border/50 rounded-xl p-3 text-foreground focus:outline-none focus:border-primary/50"
                        >
                            <option value="GENERAL">General</option>
                            <option value="BILLING">Billing</option>
                            <option value="TECHNICAL">Technical</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm text-muted-foreground mb-1">Priority</label>
                        <select
                            value={priority}
                            onChange={(e) => setPriority(e.target.value)}
                            className="w-full bg-background border border-border/50 rounded-xl p-3 text-foreground focus:outline-none focus:border-primary/50"
                        >
                            <option value="LOW">Low</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="HIGH">High</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm text-muted-foreground mb-1">Message</label>
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="w-full bg-background border border-border/50 rounded-xl p-3 text-foreground focus:outline-none focus:border-primary/50 min-h-[120px]"
                        placeholder="Describe your issue..."
                        required
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2"
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    Create Ticket
                </button>
            </form>
        </motion.div>
    );
};

export const SupportScreen = ({ onBack }: { onBack: () => void }) => {
    const { t } = useTranslation();
    const { activeTicket, setActiveTicket, sendMessage, messages: liveMessages } = useSupport();
    const { user, token } = useAuth();
    const [view, setView] = useState<'LIST' | 'CREATE' | 'CHAT'>('LIST');
    const [tickets, setTickets] = useState<any[]>([]);
    const [inputText, setInputText] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Fetch tickets on mount
    useEffect(() => {
        if (view === 'LIST' && token) {
            axios.get(`${import.meta.env.VITE_API_URL}/api/v1/support/my-tickets`, {
                headers: { Authorization: `Bearer ${token}` }
            }).then(res => setTickets(Array.isArray(res.data) ? res.data : []))
                .catch(err => {
                    console.error(err);
                    setTickets([]); // Fallback
                });
        }
    }, [view, token]);

    // Scroll to bottom of chat
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [liveMessages, view]);

    // Filter messages for current active ticket if in CHAT view
    const currentMessages = view === 'CHAT' && activeTicket
        ? (activeTicket.messages || []).concat(liveMessages.filter(m => m.conversationId === activeTicket.id && !activeTicket.messages?.find((em: any) => em.id === m.id)))
        : [];

    // De-duplicate messages based on ID
    const uniqueMessages = Array.from(new Map(currentMessages.map((m: any) => [m.id, m])).values());


    const handleCreateTicket = async (data: any) => {
        try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/support/tickets`,
                { ...data, initialMessage: data.message },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setActiveTicket(res.data);
            setView('CHAT');
            toast.success('Ticket created successfully');
        } catch (err) {
            toast.error('Failed to create ticket');
        }
    };

    const openTicket = async (ticketId: string) => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/support/conversations/${ticketId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setActiveTicket(res.data);
            setView('CHAT');
        } catch (err) {
            toast.error('Failed to load conversation');
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !activeTicket) return;

        const formData = new FormData();
        formData.append('file', file);

        setIsUploading(true);
        try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/support/upload`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`
                }
            });

            // Send message immediately with attachment
            // Note: The context sendMessage doesn't await properly but socket emit is fast
            sendMessage(activeTicket.id, '', res.data.url, res.data.type);
            toast.success('File sent');
        } catch (err) {
            toast.error('Failed to upload file');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputText.trim() || !activeTicket) return;
        sendMessage(activeTicket.id, inputText);
        setInputText('');
    };

    return (
        <div className="flex flex-col h-screen bg-background">
            {/* Background elements if needed */}

            {view === 'LIST' && (
                <div className="flex-1 flex flex-col pt-8 pb-4 px-4 overflow-hidden">
                    <div className="flex items-center justify-between mb-6 shrink-0">
                        <div className="flex items-center gap-3">
                            <button onClick={onBack} className="w-10 h-10 rounded-full glass-card flex items-center justify-center hover:bg-white/5 transition-colors">
                                <ArrowLeft className="w-5 h-5 text-foreground" />
                            </button>
                            <h1 className="text-2xl font-bold text-foreground">Support</h1>
                        </div>
                        <button
                            onClick={() => setView('CREATE')}
                            className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
                        >
                            <Plus className="w-6 h-6 text-primary-foreground" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-hide">
                        {tickets.length === 0 ? (
                            <div className="text-center py-20 text-muted-foreground flex flex-col items-center">
                                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                                    <MessageCircle className="w-8 h-8 opacity-50" />
                                </div>
                                <p className="text-lg font-medium">No tickets yet</p>
                                <p className="text-sm opacity-60">Start a new conversation</p>
                            </div>
                        ) : (
                            tickets.map(ticket => (
                                <GlassCard key={ticket.id} className="p-4 active:scale-[0.98] transition-all cursor-pointer hover:bg-white/5" onClick={() => openTicket(ticket.id)}>
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase 
                                    ${ticket.status === 'OPEN' ? 'bg-green-500/20 text-green-500' :
                                                    ticket.status === 'CLOSED' ? 'bg-gray-500/20 text-gray-500' :
                                                        'bg-blue-500/20 text-blue-500'}`}>
                                                {ticket.status}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {new Date(ticket.updatedAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                    <h3 className="font-semibold text-foreground mb-1">{ticket.subject}</h3>
                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                        {ticket.messages?.[0]?.content || 'No messages'}
                                    </p>
                                </GlassCard>
                            ))
                        )}
                    </div>
                </div>
            )}

            {view === 'CREATE' && (
                <div className="pt-8 px-4 flex-1 overflow-y-auto">
                    <PreChatForm onSubmit={handleCreateTicket} onCancel={() => setView('LIST')} />
                </div>
            )}

            {view === 'CHAT' && activeTicket && (
                <div className="flex-1 flex flex-col pt-8 h-full relative">
                    {/* Chat Header */}
                    <div className="px-4 pb-4 border-b border-white/5 flex items-center gap-3 shrink-0 bg-background/80 backdrop-blur-md z-10 sticky top-0">
                        <button onClick={() => setView('LIST')} className="p-2 -ml-2 rounded-full hover:bg-white/5 transition-colors">
                            <ArrowLeft className="w-5 h-5 text-foreground" />
                        </button>
                        <div className="flex-1 min-w-0">
                            <h2 className="font-bold text-foreground truncate">{activeTicket.subject}</h2>
                            <p className="text-xs text-muted-foreground">Ticket #{activeTicket.id.slice(0, 8)}</p>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-width-thin thumb-color-primary">
                        {uniqueMessages.map((msg: any) => {
                            const isMe = msg.senderId === user?.id;
                            return (
                                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] sm:max-w-[70%] p-3 shadow-sm ${isMe
                                        ? 'bg-primary text-primary-foreground rounded-2xl rounded-br-sm'
                                        : 'glass-card text-foreground rounded-2xl rounded-bl-sm'
                                        }`}>
                                        {msg.attachmentUrl && (
                                            <div className="mb-2">
                                                {msg.attachmentType === 'IMAGE' ? (
                                                    <a
                                                        href={`${import.meta.env.VITE_API_URL}${msg.attachmentUrl}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="block cursor-pointer overflow-hidden rounded-lg"
                                                    >
                                                        <img
                                                            src={`${import.meta.env.VITE_API_URL}${msg.attachmentUrl}`}
                                                            alt="Attachment"
                                                            className="w-full h-auto object-cover hover:scale-105 transition-transform duration-300"
                                                            style={{ maxHeight: '250px' }}
                                                        />
                                                    </a>
                                                ) : (
                                                    <a
                                                        href={`${import.meta.env.VITE_API_URL}${msg.attachmentUrl}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className={`flex items-center gap-3 p-3 rounded-xl transition-colors group ${isMe ? 'bg-black/10 hover:bg-black/20' : 'bg-white/5 hover:bg-white/10'}`}
                                                    >
                                                        <div className={`p-2 rounded-lg shadow-sm ${isMe ? 'bg-primary-foreground/10' : 'bg-background'}`}>
                                                            <Paperclip className={`w-4 h-4 ${isMe ? 'text-primary-foreground' : 'text-primary'}`} />
                                                        </div>
                                                        <div className="flex-1 overflow-hidden text-left">
                                                            <p className="text-xs font-bold truncate">File Attachment</p>
                                                            <p className="text-[10px] opacity-70">Click to open</p>
                                                        </div>
                                                        <Download className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                                                    </a>
                                                )}
                                            </div>
                                        )}
                                        {msg.content && <p className="text-sm leading-relaxed">{msg.content}</p>}
                                        <span className={`text-[10px] mt-1 block text-right ${isMe ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-4 bg-background/80 backdrop-blur-md border-t border-white/5 sticky bottom-0 z-20 pb-safe-bottom">
                        <form onSubmit={handleSendMessage} className="flex gap-3 items-end">
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                onChange={handleFileUpload}
                            />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                                className="p-3 rounded-full glass-card text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors disabled:opacity-50 shrink-0"
                            >
                                {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Paperclip className="w-5 h-5" />}
                            </button>

                            <div className="flex-1 relative">
                                <input
                                    type="text"
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    placeholder="Type a message..."
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 pr-10 focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-all placeholder:text-muted-foreground/50"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={!inputText.trim()}
                                className="p-3 rounded-full bg-primary text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20 shrink-0"
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
