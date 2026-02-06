import { IsString, IsNotEmpty, MinLength, Length } from 'class-validator';

export class ResetPasswordDto {
    @IsString()
    @IsNotEmpty()
    phoneNumber: string;

    @IsString()
    @IsNotEmpty()
    @Length(6, 6)
    otpCode: string;

    @IsString()
    @MinLength(6)
    newPassword: string;
}
