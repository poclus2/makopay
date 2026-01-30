import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { PayoutFrequency } from '@prisma/client';

export class CreateInvestmentPlanDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsNumber()
    @Min(1)
    durationDays: number;

    @IsNumber()
    @Min(0)
    yieldPercent: number;

    @IsEnum(PayoutFrequency)
    payoutFrequency: PayoutFrequency;

    @IsNumber()
    @Min(0)
    minAmount: number;

    @IsNumber()
    @IsOptional()
    maxAmount?: number;
}
