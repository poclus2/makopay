import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';

interface Message {
    id: string;
    conversationId: string;
    senderId: string;
    content: string;
    attachmentUrl?: string; // Optional
    attachmentType?: string; // Optional
    createdAt: string;
}

interface SupportTicket {
    id: string;
    subject: string;
    category: string;
    priority: string;
    status: string;
    user: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
    };
    messages: Message[];
    createdAt: string;
    updatedAt: string;
}

interface AdminSupportContextType {
    socket: Socket | null;
    isConnected: boolean;
    activeTickets: SupportTicket[];
    currentTicket: SupportTicket | null;
    setCurrentTicket: (ticket: SupportTicket | null) => void;
    sendMessage: (conversationId: string, content: string, attachmentUrl?: string, attachmentType?: string) => void;
    joinRoom: (userId: string) => void;
    updateTicketStatus: (ticketId: string, status: string) => void;
    refreshTickets: () => void;
}

const AdminSupportContext = createContext<AdminSupportContextType>({} as AdminSupportContextType);

// Read from env or default
const WS_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const AdminSupportProvider = ({ children }: { children: ReactNode }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [activeTickets, setActiveTickets] = useState<SupportTicket[]>([]);
    const [currentTicket, setCurrentTicket] = useState<SupportTicket | null>(null);

    const token = localStorage.getItem('admin_token');

    const refreshTickets = async () => {
        if (!token) return;
        try {
            const res = await fetch(`${WS_URL}/api/v1/support/admin/tickets`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (Array.isArray(data)) {
                setActiveTickets(data);
            } else {
                console.error('Expected array of tickets, got:', data);
                setActiveTickets([]);
            }
        } catch (err) {
            console.error('Failed to fetch tickets', err);
            setActiveTickets([]);
        }
    };

    useEffect(() => {
        if (!token) return;

        // Initialize Socket
        const newSocket = io(`${WS_URL}/support`, {
            extraHeaders: {
                Authorization: `Bearer ${token}`
            },
            query: { token }
        });

        newSocket.on('connect', () => {
            console.log('Admin Support Chat Connected');
            setIsConnected(true);
            refreshTickets();
        });

        newSocket.on('disconnect', () => {
            console.log('Admin Support Chat Disconnected');
            setIsConnected(false);
        });

        const handleNewMessage = (message: Message) => {
            // Update active ticket if open
            if (currentTicket && currentTicket.id === message.conversationId) {
                setCurrentTicket(prev => {
                    if (!prev) return null;
                    // Deduplicate
                    if (prev.messages && prev.messages.some(m => m.id === message.id)) {
                        return prev;
                    }
                    return {
                        ...prev,
                        messages: [...(prev.messages || []), message]
                    };
                });
            }
            refreshTickets(); // Move ticket to top or update preview
        };

        newSocket.on('newMessage', handleNewMessage);
        newSocket.on('admin:newMessage', handleNewMessage);

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, [token, currentTicket?.id]);

    const sendMessage = (conversationId: string, content: string, attachmentUrl?: string, attachmentType?: string) => {
        if (socket && conversationId) {
            socket.emit('sendMessage', { conversationId, content, attachmentUrl, attachmentType });
        }
    };

    const joinRoom = (userId: string) => {
        if (socket) {
            socket.emit('joinRoom', { userId });
        }
    };

    const updateTicketStatus = async (ticketId: string, status: string) => {
        try {
            await fetch(`${WS_URL}/api/v1/support/conversations/${ticketId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ status })
            });
            refreshTickets();
            if (currentTicket?.id === ticketId) {
                setCurrentTicket(prev => prev ? ({ ...prev, status }) : null);
            }
        } catch (err) {
            console.error('Failed to update status', err);
        }
    };

    return (
        <AdminSupportContext.Provider value={{
            socket,
            isConnected,
            activeTickets,
            currentTicket,
            setCurrentTicket,
            sendMessage,
            joinRoom,
            updateTicketStatus,
            refreshTickets
        }}>
            {children}
        </AdminSupportContext.Provider>
    );
};

export const useAdminSupport = () => useContext(AdminSupportContext);
