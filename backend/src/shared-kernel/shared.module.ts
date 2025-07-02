import { Module, Global } from '@nestjs/common';
import { UserSyncService } from '../application/services/user-sync.service';

@Global()
@Module({
  providers: [UserSyncService],
  exports: [UserSyncService],
})
export class SharedModule {}
