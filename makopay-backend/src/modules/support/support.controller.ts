import { Controller, Post, Body, Get, Param, Patch, UseGuards, Req, UnauthorizedException, UseInterceptors, UploadedFile } from '@nestjs/common';
import { SupportService } from './support.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../core/guards/roles/roles.guard';
import { Roles } from '../../core/decorators/roles/roles.decorator';
import { UserRole, SupportStatus } from '@prisma/client';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

// Fix for Express type reference
import { Request } from 'express';

@Controller('support')
@UseGuards(AuthGuard('jwt'))
export class SupportController {
    constructor(private readonly supportService: SupportService) { }

    @Post('upload')
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: './uploads',
            filename: (req: any, file: any, cb: any) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                const ext = extname(file.originalname);
                cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
            }
        })
    }))
    async uploadFile(@UploadedFile() file: any) {
        if (!file) throw new Error('File upload failed');
        // Return relative path
        return {
            url: `/uploads/${file.filename}`,
            type: file.mimetype.startsWith('image/') ? 'IMAGE' : 'DOCUMENT',
            filename: file.originalname
        };
    }

    @Post('tickets')
    async createTicket(@Req() req: any, @Body() dto: CreateTicketDto) {
        return this.supportService.createTicket(req.user.id, dto);
    }

    @Get('my-tickets')
    async getMyTickets(@Req() req: any) {
        return this.supportService.findAllForUser(req.user.id);
    }

    @Get('admin/tickets')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.SUPPORT)
    async getAllTickets() {
        return this.supportService.findAllForAdmin();
    }

    @Get('conversations/:id')
    async getConversation(@Req() req: any, @Param('id') id: string) {
        const conversation = await this.supportService.findOne(id);
        if (!conversation) return null;

        // Access control
        if (req.user.role !== UserRole.ADMIN && req.user.role !== UserRole.SUPPORT && conversation.userId !== req.user.id) {
            throw new UnauthorizedException('Access denied');
        }
        return conversation;
    }

    @Patch('conversations/:id/status')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.SUPPORT)
    async updateStatus(@Param('id') id: string, @Body('status') status: SupportStatus) {
        return this.supportService.updateStatus(id, status);
    }

    @Patch('conversations/:id/assign')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.SUPPORT)
    async assignTicket(@Param('id') id: string, @Req() req: any) {
        // Assign to self
        return this.supportService.assignTicket(id, req.user.id);
    }
}
