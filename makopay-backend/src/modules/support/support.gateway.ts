import {
    WebSocketGateway,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { SupportService } from './support.service';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { WsJwtGuard } from '../../core/guards/ws-jwt.guard';
import { User } from '@prisma/client';

@WebSocketGateway({
    cors: {
        origin: '*',
    },
    namespace: 'support',
})
export class SupportGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    constructor(private readonly supportService: SupportService) { }

    async handleConnection(client: Socket) {
        // Authentication is handled by WsJwtGuard or manual verification if needed globally
        // But usually for specific events. Here we might want generic connection tracking
        console.log(`Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        console.log(`Client disconnected: ${client.id}`);
    }

    @UseGuards(WsJwtGuard)
    @SubscribeMessage('joinRoom')
    async handleJoinRoom(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { userId: string },
    ) {
        // In a real app, verify client.user.id matches data.userId or is ADMIN
        // For now, simple join
        const user = (client as any).user;
        if (user && (user.id === data.userId || user.role === 'ADMIN' || user.role === 'SUPPORT')) {
            client.join(data.userId);
            return { event: 'joinedRoom', data: { room: data.userId } };
        }
    }

    @UseGuards(WsJwtGuard)
    @SubscribeMessage('sendMessage')
    async handleSendMessage(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: { conversationId: string; content: string; targetUserId?: string; attachmentUrl?: string; attachmentType?: string },
    ) {
        const user = (client as any).user as User;
        const message = await this.supportService.sendMessage(user.id, payload.conversationId, payload.content, payload.attachmentUrl, payload.attachmentType);

        // Notify the conversation owner (User)
        // If sender is ADMIN, we emit to the User room
        // If sender is USER, we emit to the User room (for their own update) AND Admin room/dashboard

        let roomToEmit = '';
        if (user.role === 'ADMIN' || user.role === 'SUPPORT') {
            // Should emit to the User's room associated with this conversation
            // We might need to fetch conversation to know the userId if not passed
            const conversation = await this.supportService.findOne(payload.conversationId);
            if (conversation) roomToEmit = conversation.userId;
        } else {
            roomToEmit = user.id;
        }

        if (roomToEmit) {
            this.server.to(roomToEmit).emit('newMessage', message);
        }

        // Also emit to a general 'admin-support' room if we had one, or just rely on the specific user rooms for now.
        // For Admins to see "New Message" from anywhere, they might join a global room.
        this.server.emit('admin:newMessage', message); // Broadcast to all admins listening

        return message;
    }
}
