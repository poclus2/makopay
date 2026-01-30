import { IsBoolean, IsDecimal, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateProductDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    sku: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    imageUrl?: string;

    @IsNotEmpty()
    price: number; // Decimal handling in Service

    @IsInt()
    @Min(0)
    stock: number;

    @IsBoolean()
    @IsOptional()
    isCommissionable?: boolean;

    @IsUUID()
    @IsOptional()
    investmentPlanId?: string;
}
