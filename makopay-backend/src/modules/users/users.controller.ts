import { Controller, Get, Put, Post, Body, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '@nestjs/passport';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('users')
@UseGuards(AuthGuard('jwt'))
export class UsersController {
    constructor(private usersService: UsersService) { }

    @Get('profile')
    async getProfile(@Request() req: any) {
        const user = await this.usersService.findById(req.user.userId);
        if (user) {
            const { passwordHash, ...result } = user;
            return result;
        }
        return null;
    }

    @Put('profile')
    async updateProfile(@Request() req: any, @Body() updateProfileDto: UpdateProfileDto) {
        const user = await this.usersService.update(req.user.userId, updateProfileDto);
        const { passwordHash, ...result } = user;
        return result;
    }

    @Post('kyc')
    async submitKyc(@Request() req: any, @Body() body: any) {
        // Body expected: { documentType, frontUrl, backUrl, selfieUrl }
        return this.usersService.submitKyc(req.user.userId, body);
    }
}
