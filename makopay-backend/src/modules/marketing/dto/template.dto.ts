import { IsString, IsOptional, IsEnum, IsBoolean, IsArray } from 'class-validator';
import { CampaignType } from '@prisma/client';

export class CreateTemplateDto {
    @IsString()
    name: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsEnum(CampaignType)
    type: CampaignType;

    @IsString()
    @IsOptional()
    subject?: string;

    @IsString()
    content: string;

    @IsString()
    @IsOptional()
    contentHtml?: string;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    variables?: string[];
}

export class UpdateTemplateDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    subject?: string;

    @IsString()
    @IsOptional()
    content?: string;

    @IsString()
    @IsOptional()
    contentHtml?: string;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    variables?: string[];

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}
