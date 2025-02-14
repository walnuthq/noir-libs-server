import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { UserSession } from './user-session';

export const AuthenticatedUser = createParamDecorator(
    (data: unknown, ctx: ExecutionContext) => {
        const request: any = ctx.switchToHttp().getRequest<Request>();

        if (!request.session?.user) {
            console.log('User not logged in');
            throw new UnauthorizedException('User is not logged in.');
        }

        return new UserSession(
            request.session.user.name,
            request.session.user.id.toString(),
            request.session.user.avatar_url ?? undefined,
        );
    },
);
