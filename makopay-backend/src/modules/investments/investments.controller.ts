import { Controller, Get, Post, Body, UseGuards, Request, Patch, Delete, Param } from '@nestjs/common';
import { InvestmentsService } from './investments.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../core/guards/roles/roles.guard';
import { Roles } from '../../core/decorators/roles/roles.decorator';
import { UserRole } from '@prisma/client';
import { CreateInvestmentPlanDto } from './dto/create-investment-plan.dto';
import { UpdateInvestmentPlanDto } from './dto/update-investment-plan.dto';

@Controller('investments')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class InvestmentsController {
    constructor(private readonly investmentsService: InvestmentsService) { }

    @Post('plans')
    @Roles(UserRole.ADMIN)
    createPlan(@Body() body: CreateInvestmentPlanDto) {
        return this.investmentsService.createPlan(body);
    }

    @Patch('plans/:id')
    @Roles(UserRole.ADMIN)
    updatePlan(@Param('id') id: string, @Body() body: UpdateInvestmentPlanDto) {
        return this.investmentsService.updatePlan(id, body);
    }

    @Delete('plans/:id')
    @Roles(UserRole.ADMIN)
    deletePlan(@Param('id') id: string) {
        return this.investmentsService.deletePlan(id);
    }

    @Get('plans')
    findAllPlans() {
        return this.investmentsService.findAllPlans();
    }

    @Get()
    myInvestments(@Request() req: any) {
        return this.investmentsService.findAllInvestments(req.user.userId);
    }

    @Get('admin/all')
    @Roles(UserRole.ADMIN)
    getAllInvestments(@Request() req: any) {
        const search = req.query.search || '';
        const status = req.query.status;
        return this.investmentsService.findAllInvestmentsAdmin(search, status);
    }

    @Get('admin/stats')
    @Roles(UserRole.ADMIN)
    getInvestmentStats() {
        return this.investmentsService.getInvestmentStats();
    }
}
