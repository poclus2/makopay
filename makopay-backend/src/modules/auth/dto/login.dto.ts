import { IsNotEmpty, IsString, IsPhoneNumber } from 'class-validator';

export class LoginDto {
    @IsString()
    phoneNumber: string;

    @IsString()
    @IsNotEmpty()
    password: string;
}
