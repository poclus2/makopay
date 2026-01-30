import { Controller, Get, Post, Body, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { AuthGuard } from '@nestjs/passport';
import { LedgerSource, WalletTransactionType } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { PaymentOperation } from '../../core/decorators/payment-operation.decorator';

@Controller('wallet')
@UseGuards(AuthGuard('jwt'))
export class WalletController {
    constructor(private readonly walletService: WalletService) { }

    @Get()
    async getWallet(@Request() req: any) {
        return this.walletService.getWallet(req.user.userId);
    }

    @Post('withdraw')
    @PaymentOperation()
    async withdraw(@Request() req: any, @Body() body: { amount: number, method?: string, details?: string }) {
        if (!body.amount || body.amount <= 0) {
            throw new BadRequestException('Invalid amount');
        }
        const amount = new Prisma.Decimal(body.amount);
        return this.walletService.debit(
            req.user.userId,
            amount,
            WalletTransactionType.WITHDRAWAL,
            LedgerSource.WITHDRAWAL,
            body.details || `REQ-${Date.now()}`,
            'PENDING'
        );
    }

    @Post('deposit')
    @PaymentOperation()
    async deposit(@Request() req: any, @Body() body: { amount: number, method: string, payerPhoneNumber?: string, currency?: string }) {
        if (!body.amount || body.amount <= 0 || !body.method) {
            throw new BadRequestException('Invalid amount or method');
        }
        const amount = new Prisma.Decimal(body.amount);
        return this.walletService.createDepositRequest(
            req.user.userId,
            amount,
            body.method,
            body.payerPhoneNumber,
            body.currency
        );
    }
}
