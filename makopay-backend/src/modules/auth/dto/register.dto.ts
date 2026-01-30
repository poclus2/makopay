import { IsNotEmpty, IsOptional, IsString, MinLength, IsUUID, IsPhoneNumber, IsEmail } from 'class-validator';

export class RegisterDto {
    @IsString()
    phoneNumber: string;

    @IsOptional()
    @IsEmail()
    email?: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(6)
    password: string;

    @IsOptional()
    @IsString()
    firstName?: string;

    @IsOptional()
    @IsString()
    lastName?: string;

    @IsOptional()
    @IsString()
    referralCode?: string;

    @IsOptional()
    @IsUUID()
    sponsorId?: string;
}
