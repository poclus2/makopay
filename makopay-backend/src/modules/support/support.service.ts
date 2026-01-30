import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma/prisma.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { SupportStatus } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class SupportService {
    constructor(
        private prisma: PrismaService,
        private notificationsService: NotificationsService
    ) { }

    async createTicket(userId: string, dto: CreateTicketDto) {
        // ... (existing code)
        // Transactional creation of conversation + first message
        return this.prisma.$transaction(async (tx) => {
            const conversation = await tx.supportConversation.create({
                data: {
                    userId,
                    subject: dto.subject,
                    category: dto.category,
                    priority: dto.priority,
                    status: 'OPEN',
                },
            });

            await tx.supportMessage.create({
                data: {
                    conversationId: conversation.id,
                    senderId: userId,
                    content: dto.initialMessage,
                },
            });

            return conversation;
        });
    }

    async sendMessage(senderId: string, conversationId: string, content: string, attachmentUrl?: string, attachmentType?: string) {
        const conversation = await this.prisma.supportConversation.findUnique({
            where: { id: conversationId },
        });
        if (!conversation) throw new NotFoundException('Conversation not found');

        const message = await this.prisma.supportMessage.create({
            data: {
                conversationId,
                senderId,
                content,
                attachmentUrl,
                attachmentType
            },
            include: {
                sender: {
                    select: { id: true, firstName: true, lastName: true, role: true }
                }
            }
        });

        // Update UpdatedAt
        await this.prisma.supportConversation.update({
            where: { id: conversationId },
            data: { updatedAt: new Date() }
        });

        // Notify User if message is from Admin/Support (i.e., sender is NOT the user who owns the ticket)
        if (conversation.userId !== senderId) {
            // It's a reply from support
            await this.notificationsService.sendSupportReplyNotification(
                conversation.userId,
                conversation.subject,
                content || (attachmentUrl ? 'Sent an attachment' : 'New message'),
                conversation.id
            );
        }

        return message;
    }

    async findAllForUser(userId: string) {
        return this.prisma.supportConversation.findMany({
            where: { userId },
            orderBy: { updatedAt: 'desc' },
            include: {
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1, // Last message preview
                }
            }
        });
    }

    async findAllForAdmin() {
        return this.prisma.supportConversation.findMany({
            orderBy: { updatedAt: 'desc' }, // Bubbling up recent activity
            include: {
                user: { select: { firstName: true, lastName: true, email: true } },
                assignedTo: { select: { firstName: true, lastName: true } },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            }
        });
    }

    async findOne(id: string) {
        return this.prisma.supportConversation.findUnique({
            where: { id },
            include: {
                messages: {
                    orderBy: { createdAt: 'asc' },
                    include: { sender: { select: { id: true, firstName: true, lastName: true, role: true } } }
                },
                user: { select: { id: true, firstName: true, lastName: true, email: true } },
                assignedTo: { select: { id: true, firstName: true, lastName: true } }
            }
        });
    }

    async updateStatus(id: string, status: SupportStatus) {
        return this.prisma.supportConversation.update({
            where: { id },
            data: { status }
        });
    }

    async assignTicket(id: string, adminId: string) {
        return this.prisma.supportConversation.update({
            where: { id },
            data: { assignedToId: adminId }
        });
    }
}
