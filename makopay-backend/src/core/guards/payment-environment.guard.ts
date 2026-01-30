import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { PAYMENT_OPERATION_KEY } from '../decorators/payment-operation.decorator';

@Injectable()
export class PaymentEnvironmentGuard implements CanActivate {
    private readonly logger = new Logger(PaymentEnvironmentGuard.name);

    constructor(
        private reflector: Reflector,
        private configService: ConfigService
    ) { }

    canActivate(context: ExecutionContext): boolean {
        const isPaymentOperation = this.reflector.getAllAndOverride<boolean>(PAYMENT_OPERATION_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!isPaymentOperation) {
            return true;
        }

        const paymentMode = this.configService.get<string>('PAYMENT_MODE', 'SANDBOX');
        const request = context.switchToHttp().getRequest();

        // If in SANDBOX, we might want to ensure we're not accidentally using real webhooks?
        // Or simply log that a payment operation is occurring in Sandbox.
        if (paymentMode === 'SANDBOX') {
            this.logger.log(`Executing Payment Operation in SANDBOX mode: ${request.method} ${request.url}`);
        } else if (paymentMode === 'PRODUCTION') {
            // In PRODUCTION, we might enforce stricter checks, e.g., require HTTPS
            const protocol = request.protocol;
            if (protocol !== 'https' && !request.headers['x-forwarded-proto']?.includes('https')) {
                // Allow localhost for testing even in prod-like envs if needed, or block.
                // For now, let's just log a warning to avoiding blocking legitimate load-balanced requests.
                this.logger.warn(`Payment Operation in PRODUCTION via HTTP! (Not HTTPS)`);
            }
        }

        return true;
    }
}
