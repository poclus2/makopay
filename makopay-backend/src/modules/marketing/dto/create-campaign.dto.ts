import { IsString, IsNotEmpty, IsEnum, IsOptional, IsObject, IsDate, IsBoolean, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { CampaignType, TargetType } from '@prisma/client';

export class FilterUsersDto {
    @IsEnum(['PENDING', 'VERIFIED', 'REJECTED'])
    @IsOptional()
    kycStatus?: string;

    @IsDate()
    @IsOptional()
    @Type(() => Date)
    registeredAfter?: Date;

    @IsDate()
    @IsOptional()
    @Type(() => Date)
    registeredBefore?: Date;

    @IsOptional()
    balanceMin?: number;

    @IsOptional()
    balanceMax?: number;

    @IsBoolean()
    @IsOptional()
    hasInvestments?: boolean;

    @IsBoolean()
    @IsOptional()
    hasReferrals?: boolean;

    @IsString()
    @IsOptional()
    phonePrefix?: string; // Ex: +237 for Cameroon
}

export class CreateCampaignDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsEnum(CampaignType)
    type: CampaignType;

    @IsString()
    @IsOptional()
    subject?: string;

    @IsString()
    @IsNotEmpty()
    message: string;

    @IsUUID()
    @IsOptional()
    templateId?: string;

    @IsEnum(TargetType)
    targetType: TargetType;

    @IsObject()
    @IsOptional()
    filters?: FilterUsersDto;

    @IsString()
    @IsOptional()
    customListUrl?: string;

    @IsString()
    @IsOptional()
    csvContent?: string;

    @IsBoolean()
    @IsOptional()
    sendNow?: boolean = true;

    @IsDate()
    @IsOptional()
    @Type(() => Date)
    scheduledAt?: Date;
}
