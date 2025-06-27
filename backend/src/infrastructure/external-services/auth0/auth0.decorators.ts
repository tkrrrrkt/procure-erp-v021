import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';

// Public decorator
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

// Auth0 User interface
export interface IAuth0User {
  id: string;
  sub: string;
  email: string;
  name?: string;
  picture?: string;
  auth0Id: string;
  tenantId?: string;
  permissions: string[];
  roles: string[];
}

// CurrentUser decorator
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): IAuth0User => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
