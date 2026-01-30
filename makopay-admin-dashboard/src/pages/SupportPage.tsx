import { useState, useEffect, useRef } from 'react';
import { useAdminSupport } from '../contexts/AdminSupportContext';
import {
    Search, Send, User, MessageCircle,
    Monitor, Paperclip, Loader2, Download
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const SupportPage = () => {
    const {
        activeTickets, currentTicket, setCurrentTicket,
        sendMessage, updateTicketStatus, refreshTickets
    } = useAdminSupport();

    const [filterStatus, setFilterStatus] = useState('ALL');
    const [inputText, setInputText] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(true);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [currentTicket?.messages]);

    useEffect(() => {
        refreshTickets();
    }, []);

    const filteredTickets = (Array.isArray(activeTickets) ? activeTickets : []).filter(ticket => {
        if (filterStatus === 'ALL') return ticket.status !== 'CLOSED';
        return ticket.status === filterStatus;
    });

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputText.trim() || !currentTicket) return;
        sendMessage(currentTicket.id, inputText);
        setInputText('');
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !currentTicket) return;

        const formData = new FormData();
        formData.append('file', file);

        setIsUploading(true);
        try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/v1/support/upload`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${localStorage.getItem('admin_token')}`
                }
            });

            sendMessage(currentTicket.id, '', res.data.url, res.data.type);
            toast.success('Fichier envoyé');
        } catch (err) {
            console.error(err);
            toast.error("Échec de l'envoi du fichier");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'OPEN': return 'bg-green-100 text-green-700';
            case 'IN_PROGRESS': return 'bg-blue-100 text-blue-700';
            case 'RESOLVED': return 'bg-purple-100 text-purple-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'HIGH': return 'text-red-600 bg-red-50';
            case 'MEDIUM': return 'text-orange-600 bg-orange-50';
            case 'LOW': return 'text-blue-600 bg-blue-50';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    return (
        <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-slate-50">
            {/* Ticket List Sidebar */}
            <div className="w-80 bg-white border-r border-slate-200 flex flex-col">
                <div className="p-4 border-b border-slate-200">
                    <h2 className="font-bold text-lg mb-4">Tickets</h2>
                    <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
                        {['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED'].map(status => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors
                                    ${filterStatus === status
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                            >
                                {status === 'ALL' ? 'Tous' : status.replace('_', ' ')}
                            </button>
                        ))}
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Rechercher un ticket..."
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {filteredTickets.map(ticket => (
                        <div
                            key={ticket.id}
                            onClick={() => {
                                // Fetch full details
                                (async () => {
                                    try {
                                        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/v1/support/conversations/${ticket.id}`, {
                                            headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` }
                                        });
                                        const fullTicket = await res.json();
                                        setCurrentTicket(fullTicket);
                                    } catch (err) {
                                        console.error('Failed to load ticket details', err);
                                        // Fallback to partial ticket if fetch fails
                                        setCurrentTicket(ticket);
                                    }
                                })();
                            }}
                            className={`p-4 border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors
                                ${currentTicket?.id === ticket.id ? 'bg-indigo-50 hover:bg-indigo-50 border-l-4 border-l-indigo-600' : ''}`}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${getStatusColor(ticket.status)}`}>
                                    {ticket.status}
                                </span>
                                <span className="text-xs text-slate-400">
                                    {new Date(ticket.updatedAt).toLocaleDateString()}
                                </span>
                            </div>
                            <h3 className="font-semibold text-sm text-slate-800 line-clamp-1 mb-1">{ticket.subject}</h3>
                            <p className="text-xs text-slate-500 line-clamp-2 mb-2">
                                {ticket.messages && ticket.messages.length > 0 ? ticket.messages[ticket.messages.length - 1]?.content : 'Pas de messages'}
                            </p>
                            <div className="flex items-center gap-2">
                                <span className={`text-[10px] px-1.5 py-0.5 rounded ${getPriorityColor(ticket.priority)}`}>
                                    {ticket.priority}
                                </span>
                                <span className="text-xs text-slate-400">• {ticket.category}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Chat Area */}
            {currentTicket ? (
                <div className="flex-1 flex flex-col bg-slate-50/50">
                    {/* Chat Header */}
                    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
                        <div className="flex items-center gap-4">
                            <div>
                                <h2 className="font-bold text-slate-800">{currentTicket.subject}</h2>
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <span className="flex items-center gap-1">
                                        <User className="w-3 h-3" />
                                        {currentTicket.user.firstName} {currentTicket.user.lastName}
                                    </span>
                                    <span>•</span>
                                    <span>Ticket #{currentTicket.id.slice(0, 8)}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <select
                                value={currentTicket.status}
                                onChange={(e) => updateTicketStatus(currentTicket.id, e.target.value)}
                                className="text-sm border-slate-200 rounded-lg p-2 bg-slate-50"
                            >
                                <option value="OPEN">Ouvert</option>
                                <option value="IN_PROGRESS">En cours</option>
                                <option value="RESOLVED">Résolu</option>
                                <option value="CLOSED">Fermé</option>
                            </select>
                            <button
                                onClick={() => setIsDetailsOpen(!isDetailsOpen)}
                                className={`p-2 rounded-lg transition-colors ${isDetailsOpen ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-slate-100 text-slate-600'}`}
                            >
                                <Monitor className="w-5 h-5" />
                            </button>
                        </div>
                    </header>

                    <div className="flex flex-1 overflow-hidden">
                        {/* Messages Area */}
                        <div className="flex-1 flex flex-col">
                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                {(currentTicket.messages || []).map((msg) => {
                                    const isAdmin = msg.senderId !== currentTicket.user.id;
                                    return (
                                        <div key={msg.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`flex flex-col max-w-[70%] ${isAdmin ? 'items-end' : 'items-start'}`}>
                                                <div className={`p-4 rounded-2xl shadow-sm text-sm ${isAdmin
                                                    ? 'bg-indigo-600 text-white rounded-br-none'
                                                    : 'bg-white text-slate-700 border border-slate-200 rounded-bl-none'
                                                    }`}>
                                                    {msg.attachmentUrl && (
                                                        <div className="mb-2">
                                                            {msg.attachmentType === 'IMAGE' ? (
                                                                <a
                                                                    href={`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${msg.attachmentUrl}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="block cursor-pointer"
                                                                >
                                                                    <img
                                                                        src={`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${msg.attachmentUrl}`}
                                                                        alt="Attachment"
                                                                        className="max-w-full rounded-lg hover:opacity-90 transition-opacity"
                                                                        style={{ maxHeight: '200px' }}
                                                                    />
                                                                </a>
                                                            ) : (
                                                                <a
                                                                    href={`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${msg.attachmentUrl}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="flex items-center gap-3 p-3 bg-black/5 hover:bg-black/10 transition-colors rounded-xl text-inherit no-underline group"
                                                                >
                                                                    <div className="p-2 bg-white rounded-lg shadow-sm">
                                                                        <Paperclip className="w-4 h-4 text-indigo-600" />
                                                                    </div>
                                                                    <div className="flex-1 overflow-hidden text-left">
                                                                        <p className="text-xs font-bold truncate">Document</p>
                                                                        <p className="text-[10px] opacity-70">Ouvrir</p>
                                                                    </div>
                                                                    <Download className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                                                                </a>
                                                            )}
                                                        </div>
                                                    )}
                                                    {msg.content && <p>{msg.content}</p>}
                                                </div>
                                                <span className="text-[10px] text-slate-400 mt-1">
                                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Area */}
                            <div className="p-4 bg-white border-t border-slate-200">
                                <form onSubmit={handleSendMessage} className="flex gap-2">
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
                                        className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                                    >
                                        {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Paperclip className="w-5 h-5" />}
                                    </button>
                                    <input
                                        type="text"
                                        value={inputText}
                                        onChange={(e) => setInputText(e.target.value)}
                                        placeholder="Votre réponse..."
                                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!inputText.trim()}
                                        className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-200"
                                    >
                                        <Send className="w-5 h-5" />
                                    </button>
                                </form>
                            </div>
                        </div>

                        {/* Right Sidebar - Ticket Info */}
                        {isDetailsOpen && (
                            <div className="w-72 bg-white border-l border-slate-200 p-6 overflow-y-auto">
                                <div className="text-center mb-6">
                                    <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full mx-auto mb-3 flex items-center justify-center">
                                        <User className="w-8 h-8 text-slate-400" />
                                    </div>
                                    <h3 className="font-bold text-slate-800">{currentTicket.user.firstName} {currentTicket.user.lastName}</h3>
                                    <p className="text-sm text-slate-500">{currentTicket.user.email}</p>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Détails du Ticket</h4>
                                        <div className="space-y-3">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-slate-500">Priorité</span>
                                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(currentTicket.priority)}`}>
                                                    {currentTicket.priority}
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-slate-500">Catégorie</span>
                                                <span className="text-slate-800 font-medium">{currentTicket.category}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-slate-500">Créé le</span>
                                                <span className="text-slate-800">{new Date(currentTicket.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-slate-100">
                                        <button className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg text-sm font-medium transition-colors mb-2">
                                            Voir le profil client
                                        </button>
                                        <button className="w-full py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-medium transition-colors">
                                            Bloquer l'utilisateur
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
                    <MessageCircle className="w-16 h-16 mb-4 opacity-50" />
                    <p className="text-lg font-medium">Sélectionnez un ticket pour commencer</p>
                </div>
            )}
        </div>
    );
};

export default SupportPage;
