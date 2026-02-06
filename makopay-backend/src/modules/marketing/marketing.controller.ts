import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../core/guards/roles/roles.guard';
import { Roles } from '../../core/decorators/roles/roles.decorator';
import { UserRole, CampaignType } from '@prisma/client';
import { MarketingService } from './marketing.service';
import { CreateCampaignDto, FilterUsersDto } from './dto/create-campaign.dto';
import { CreateTemplateDto, UpdateTemplateDto } from './dto/template.dto';

@Controller('marketing')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.ADMIN)
export class MarketingController {
    constructor(private readonly marketingService: MarketingService) { }

    // ===========================
    // Campaigns
    // ===========================

    @Post('campaigns')
    async createCampaign(@Body() dto: CreateCampaignDto, @Request() req: any) {
        return this.marketingService.createCampaign(dto, req.user.userId);
    }

    @Get('campaigns')
    async getCampaigns(
        @Query('type') type?: CampaignType,
        @Query('status') status?: string,
        @Query('skip') skip?: string,
        @Query('take') take?: string,
    ) {
        return this.marketingService.getCampaigns(
            { type, status },
            {
                skip: skip ? parseInt(skip) : 0,
                take: take ? parseInt(take) : 20,
            },
        );
    }

    @Get('campaigns/:id')
    async getCampaign(@Param('id') id: string) {
        return this.marketingService.getCampaign(id);
    }

    @Delete('campaigns/:id')
    async deleteCampaign(@Param('id') id: string) {
        await this.marketingService.deleteCampaign(id);
        return { message: 'Campaign deleted successfully' };
    }

    @Post('campaigns/:id/send')
    async sendCampaign(@Param('id') id: string) {
        await this.marketingService.sendCampaign(id);
        return { message: 'Campaign queued for sending' };
    }

    @Post('campaigns/:id/test')
    async sendTestCampaign(
        @Param('id') id: string,
        @Body() body: { recipient: string },
    ) {
        await this.marketingService.sendTestCampaign(id, body.recipient);
        return { message: 'Test message sent' };
    }

    @Get('campaigns/:id/stats')
    async getCampaignStats(@Param('id') id: string) {
        return this.marketingService.getCampaignStats(id);
    }

    // ===========================
    // User Targeting
    // ===========================

    @Post('users/preview')
    async previewTargetedUsers(@Body() filters: FilterUsersDto) {
        return this.marketingService.previewTargetedUsers(filters);
    }

    @Post('users/count')
    async countTargetedUsers(@Body() filters: FilterUsersDto) {
        const count = await this.marketingService.countTargetedUsers(filters);
        return { count };
    }

    // ===========================
    // Templates
    // ===========================

    @Post('templates')
    async createTemplate(@Body() dto: CreateTemplateDto, @Request() req: any) {
        return this.marketingService.createTemplate(dto, req.user.userId);
    }

    @Get('templates')
    async getTemplates(@Query('type') type?: CampaignType) {
        return this.marketingService.getTemplates(type);
    }

    @Patch('templates/:id')
    async updateTemplate(
        @Param('id') id: string,
        @Body() dto: UpdateTemplateDto,
    ) {
        return this.marketingService.updateTemplate(id, dto);
    }

    @Delete('templates/:id')
    async deleteTemplate(@Param('id') id: string) {
        await this.marketingService.deleteTemplate(id);
        return { message: 'Template deleted successfully' };
    }
}
