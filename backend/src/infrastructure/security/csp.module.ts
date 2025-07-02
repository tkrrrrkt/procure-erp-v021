import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CspService } from './csp.service';

@Module({
  imports: [ConfigModule],
  providers: [CspService],
  exports: [CspService],
})
export class CspModule {}
