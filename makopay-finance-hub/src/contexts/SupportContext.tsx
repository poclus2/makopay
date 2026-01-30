import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface Message {
    id: string;
    conversationId: string;
    senderId: string;
    content: string;
    createdAt: string;
}

interface SupportContextType {
    socket: Socket | null;
    isConnected: boolean;
    messages: Message[];
    sendMessage: (conversationId: string, content: string, attachmentUrl?: string, attachmentType?: string) => void;
    joinRoom: (userId: string) => void;
    activeTicket: any | null;
    setActiveTicket: (ticket: any) => void;
}

const SupportContext = createContext<SupportContextType>({} as SupportContextType);

// Read from env or default
const WS_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const SupportProvider = ({ children }: { children: ReactNode }) => {
    const { user, token } = useAuth();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [activeTicket, setActiveTicket] = useState<any | null>(null);

    useEffect(() => {
        if (!user || !token) return;

        // Initialize Socket
        // Initialize Socket
        const newSocket = io(`${WS_URL}/support`, {
            extraHeaders: {
                Authorization: `Bearer ${token}`
            },
            query: { token } // Fallback
        });

        newSocket.on('connect', () => {
            console.log('Support Chat Connected');
            setIsConnected(true);
            if (user.id) newSocket.emit('joinRoom', { userId: user.id });
        });

        newSocket.on('disconnect', () => {
            console.log('Support Chat Disconnected');
            setIsConnected(false);
        });

        newSocket.on('newMessage', (message: Message) => {
            setMessages((prev) => [...prev, message]);
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, [user, token]);

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

    return (
        <SupportContext.Provider value={{
            socket,
            isConnected,
            messages,
            sendMessage,
            joinRoom,
            activeTicket,
            setActiveTicket
        }}>
            {children}
        </SupportContext.Provider>
    );
};

export const useSupport = () => useContext(SupportContext);
