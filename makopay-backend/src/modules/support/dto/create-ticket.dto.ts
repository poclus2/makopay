import { IsString, IsEnum, IsOptional } from 'class-validator';
import { SupportCategory, SupportPriority } from '@prisma/client';

export class CreateTicketDto {
    @IsString()
    subject: string;

    @IsEnum(SupportCategory)
    category: SupportCategory;

    @IsOptional()
    @IsEnum(SupportPriority)
    priority?: SupportPriority;

    @IsString()
    initialMessage: string;
}
