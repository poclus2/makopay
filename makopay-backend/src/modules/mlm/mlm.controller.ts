import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { MlmService } from './mlm.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('mlm')
@UseGuards(AuthGuard('jwt'))
export class MlmController {
    constructor(private readonly mlmService: MlmService) { }

    @Get('network')
    getNetwork(@Request() req: any) {
        return this.mlmService.getNetwork(req.user.userId);
    }
}
