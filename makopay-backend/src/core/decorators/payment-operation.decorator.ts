import { SetMetadata } from '@nestjs/common';

export const PAYMENT_OPERATION_KEY = 'payment_operation';
export const PaymentOperation = () => SetMetadata(PAYMENT_OPERATION_KEY, true);
