import { Module, Global } from '@nestjs/common';
import { Auth0AuthGuard } from './auth0-auth.guard';
import { SharedModule } from '../../../shared-kernel/shared.module';

@Global()
@Module({
  imports: [SharedModule],
  providers: [Auth0AuthGuard],
  exports: [Auth0AuthGuard],
})
export class Auth0AuthModule {}
