import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { PrismaService } from '../../core/database/prisma/prisma.service';
import { Prisma, OrderStatus, WalletTransactionType, LedgerSource } from '@prisma/client';
import { InvestmentsService } from '../investments/investments.service';
import { MlmService } from '../mlm/mlm.service';
import { WalletService } from '../wallet/wallet.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class OrdersService {
    private readonly logger = new Logger(OrdersService.name);

    constructor(
        private prisma: PrismaService,
        private investmentsService: InvestmentsService,
        private mlmService: MlmService,
        private walletService: WalletService,
        private notificationsService: NotificationsService
    ) { }

    async create(userId: string, createOrderDto: CreateOrderDto) {
        return this.prisma.$transaction(async (tx) => {
            let totalAmount = new Prisma.Decimal(0);
            const orderItemsData = [];

            for (const item of createOrderDto.items) {
                const product = await tx.product.findUnique({
                    where: { id: item.productId },
                });

                if (!product) {
                    throw new NotFoundException(`Product ${item.productId} not found`);
                }

                if (product.stock < item.quantity) {
                    throw new BadRequestException(`Insufficient stock for product ${product.name}`);
                }

                const price = product.price;
                totalAmount = totalAmount.add(price.mul(item.quantity));

                // Decrease stock
                await tx.product.update({
                    where: { id: product.id },
                    data: { stock: product.stock - item.quantity },
                });

                orderItemsData.push({
                    productId: item.productId,
                    quantity: item.quantity,
                    unitPrice: price,
                });
            }

            const order = await tx.order.create({
                data: {
                    userId,
                    status: OrderStatus.PENDING,
                    totalAmount: totalAmount,
                    items: {
                        create: orderItemsData,
                    },
                },
                include: { items: true },
            });

            return order;
        });
    }

    async findAll(userId?: string) {
        const where = userId ? { userId, deletedAt: null } : { deletedAt: null };
        return this.prisma.order.findMany({
            where,
            include: { items: { include: { product: true } } },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: string, userId?: string) {
        const where: any = { id, deletedAt: null };
        if (userId) { where.userId = userId; }

        return this.prisma.order.findFirst({
            where,
            include: { items: { include: { product: true } } },
        });
    }

    // Payment trigger (Simulation)
    async pay(id: string, userId: string) {
        return this.prisma.$transaction(async (tx) => {
            // Concurrency Control: Attempt to update status from PENDING to PAID
            // This locks the row (if exists) and prevents double payment race conditions
            const result = await tx.order.updateMany({
                where: {
                    id,
                    userId, // Ensure user owns the order
                    status: OrderStatus.PENDING
                },
                data: { status: OrderStatus.PAID }
            });

            if (result.count === 0) {
                // Determine why it failed to provide a helpful error
                const order = await tx.order.findUnique({ where: { id } });
                if (!order) {
                    throw new NotFoundException('Order not found');
                }
                if (order.userId !== userId) {
                    throw new NotFoundException('Order not found'); // Security: pretend it doesn't exist
                }
                if (order.status === OrderStatus.PAID) {
                    throw new BadRequestException('Order already paid');
                }
                throw new BadRequestException(`Order cannot be paid in status ${order.status}`);
            }

            // Fetch order details for processing (now that we own the lock/state)
            const order = await tx.order.findUnique({
                where: { id },
                include: { items: { include: { product: true } } },
            });

            if (!order) throw new Error("Order vanished after update - should not happen");

            // 1. Debit Wallet (Atomic)
            // Pass 'tx' so it runs in the SAME transaction. If debit fails, everything rolls back.
            await this.walletService.debit(
                userId,
                order.totalAmount,
                WalletTransactionType.PURCHASE,
                LedgerSource.ORDER,
                order.id,
                'COMPLETED',
                tx
            );

            this.logger.log(`Order ${id} paid. Triggering transactional workflows...`);

            // 2. Trigger Investment Creation (Transactional)
            await this.investmentsService.createInvestmentFromOrder(order.id, order.userId, order.items, tx);

            // 3. Create Outbox Event for async processing (MLM, Notifications)
            await tx.outboxEvent.create({
                data: {
                    aggregateType: 'ORDER',
                    aggregateId: order.id,
                    type: 'ORDER_PAID',
                    payload: {
                        orderId: order.id,
                        userId: order.userId,
                        totalAmount: order.totalAmount,
                        items: order.items.map(i => ({ productId: i.productId, quantity: i.quantity }))
                    },
                }
            });

            // Notification
            await this.notificationsService.sendOrderPaidNotification(
                userId,
                order.id,
                order.totalAmount.toString(),
                'XAF',
                order.items.length
            );

            return order;
        });
    }
    async remove(id: string, userId: string, isAdmin: boolean) {
        const where: any = { id };
        if (!isAdmin) {
            where.userId = userId;
        }

        const order = await this.prisma.order.findFirst({ where });
        if (!order) {
            throw new NotFoundException('Order not found');
        }

        return this.prisma.order.update({
            where: { id },
            data: { deletedAt: new Date() }
        });
    }
}
