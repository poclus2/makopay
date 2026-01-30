import { Controller, Get, Post, Body, Param, UseGuards, Request, NotFoundException, Delete } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../core/guards/roles/roles.guard';
import { Roles } from '../../core/decorators/roles/roles.decorator';
import { UserRole } from '@prisma/client';
import { PaymentOperation } from '../../core/decorators/payment-operation.decorator';

@Controller('orders')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class OrdersController {
    constructor(private readonly ordersService: OrdersService) { }

    @Post()
    create(@Request() req: any, @Body() createOrderDto: CreateOrderDto) {
        return this.ordersService.create(req.user.userId, createOrderDto);
    }

    @Get()
    findAll(@Request() req: any) {
        if (req.user.role === UserRole.ADMIN) {
            return this.ordersService.findAll(); // Admin sees all
        }
        return this.ordersService.findAll(req.user.userId);
    }

    @Get(':id')
    async findOne(@Request() req: any, @Param('id') id: string) {
        const userId = req.user.role === UserRole.ADMIN ? undefined : req.user.userId;
        const order = await this.ordersService.findOne(id, userId);
        if (!order) {
            throw new NotFoundException('Order not found');
        }
        return order;
    }

    @Post(':id/pay') // Simulation endpoint
    @PaymentOperation()
    async pay(@Request() req: any, @Param('id') id: string) {
        // In reality, this would be a webhook from Stripe/MangoPay
        // For now, we allow user to "pay" their own order for demo
        return this.ordersService.pay(id, req.user.userId);
    }
}
