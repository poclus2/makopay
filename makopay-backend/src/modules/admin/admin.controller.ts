import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../core/guards/roles/roles.guard';
import { Roles } from '../../core/decorators/roles/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('admin')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
    constructor(private readonly adminService: AdminService) { }

    @Get('stats')
    async getStats() {
        return this.adminService.getStats();
    }

    @Get('deposits/pending')
    async getPendingDeposits() {
        return this.adminService.getPendingDeposits();
    }

    @Get('users')
    async getUsers() {
        return this.adminService.getUsers();
    }

    @Post('deposits/:id/approve')
    async approveDeposit(@Param('id') id: string) {
        return this.adminService.approveDeposit(id);
    }

    @Post('deposits/:id/reject')
    async rejectDeposit(@Param('id') id: string) {
        return this.adminService.rejectDeposit(id);
    }
    @Get('withdrawals/pending')
    async getPendingWithdrawals() {
        return this.adminService.getPendingWithdrawals();
    }

    @Post('withdrawals/:id/approve')
    async approveWithdrawal(@Param('id') id: string) {
        return this.adminService.approveWithdrawal(id);
    }

    @Post('withdrawals/:id/reject')
    async rejectWithdrawal(@Param('id') id: string) {
        return this.adminService.rejectWithdrawal(id);
    }
}
