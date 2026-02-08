import { Controller, Get, Post, Body, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { AuthGuard } from '@nestjs/passport';
import { LedgerSource, WalletTransactionType } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { PaymentOperation } from '../../core/decorators/payment-operation.decorator';
import { AuthService } from '../auth/auth.service';

@Controller('wallet')
@UseGuards(AuthGuard('jwt'))
export class WalletController {
    constructor(
        private readonly walletService: WalletService,
        private readonly authService: AuthService
    ) { }

    @Get()
    async getWallet(@Request() req: any) {
        return this.walletService.getWallet(req.user.userId);
    }

    @Post('withdraw/otp')
    async withdrawOtp(@Request() req: any, @Body() body?: { channel?: 'email' | 'sms' }) {
        return this.authService.generateWithdrawalOtp(req.user.userId, body?.channel);
    }

    @Post('withdraw')
    @PaymentOperation()
    async withdraw(@Request() req: any, @Body() body: { amount: number, method?: string, details?: string, otp?: string }) {
        if (!body.amount || body.amount <= 0) {
            throw new BadRequestException('Invalid amount');
        }

        // Verify OTP logic enabled
        if (!body.otp) {
            throw new BadRequestException('Verification code required');
        }
        const isValid = await this.authService.validateOtp(req.user.userId, body.otp);
        if (!isValid) {
            throw new BadRequestException('Invalid verification code');
        }

        const amount = new Prisma.Decimal(body.amount);
        return this.walletService.requestWithdrawal(
            req.user.userId,
            amount,
            body.method || 'UNKNOWN',
            body.details || `REQ-${Date.now()}`
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
