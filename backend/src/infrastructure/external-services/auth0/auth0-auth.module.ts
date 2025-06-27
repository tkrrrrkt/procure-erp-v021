import { Module, Global } from '@nestjs/common';
import { Auth0AuthGuard } from './auth0-auth.guard';

@Global()
@Module({
  providers: [Auth0AuthGuard],
  exports: [Auth0AuthGuard],
})
export class Auth0AuthModule {}
