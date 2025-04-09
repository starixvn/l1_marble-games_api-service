import { Module } from '@nestjs/common';
import { MemoryCacheService } from './cache.service';

@Module({
  providers: [MemoryCacheService],
  exports: [MemoryCacheService],
})
export class CacheModule {}
