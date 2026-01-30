import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Socket } from 'socket.io';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma/prisma.service';

@Injectable()
export class WsJwtGuard implements CanActivate {
    constructor(
        private jwtService: JwtService,
        private configService: ConfigService,
        private prisma: PrismaService
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const client = context.switchToWs().getClient<Socket>();
        const token = this.extractToken(client);

        if (!token) {
            throw new UnauthorizedException('No token provided');
        }

        try {
            const secret = this.configService.get<string>('JWT_SECRET');
            const payload = this.jwtService.verify(token, { secret });

            const user = await this.prisma.user.findUnique({
                where: { id: payload.sub }
            });

            if (!user) {
                throw new UnauthorizedException('User not found');
            }

            // Attach user to socket
            (client as any).user = user;

            return true;
        } catch (err) {
            throw new UnauthorizedException('Invalid token');
        }
    }

    private extractToken(client: Socket): string | undefined {
        const authHeader = client.handshake.headers.authorization;
        if (authHeader && authHeader.split(' ')[0] === 'Bearer') {
            return authHeader.split(' ')[1];
        }
        return client.handshake.query.token as string;
    }
}
