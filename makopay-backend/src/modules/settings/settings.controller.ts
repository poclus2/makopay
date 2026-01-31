import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { UpdateFeesDto } from './dto/update-fees.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../core/guards/roles/roles.guard';
import { Roles } from '../../core/decorators/roles/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('settings')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.ADMIN)
export class SettingsController {
    constructor(private readonly settingsService: SettingsService) { }

    @Get('fees')
    async getFees() {
        return this.settingsService.getFees();
    }

    @Put('fees')
    async updateFees(@Body() dto: UpdateFeesDto) {
        return this.settingsService.updateFees(dto);
    }
}
