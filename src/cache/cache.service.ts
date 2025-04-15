import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConfigKeys } from '../config/config-keys';
import { CacheableMemory } from 'cacheable';

export interface CacheOptions {
  ttl?: number;
}

@Injectable()
export class MemoryCacheService {
  private readonly cache: CacheableMemory;

  constructor(
    @Inject(ConfigService)
    configService: ConfigService,
  ) {
    const config = configService.get(ConfigKeys.Cache);
    this.cache = new CacheableMemory({
      ttl: config.ttl,
    });
  }

  public async get<TReturnType>(
    key: string,
    getFunction: Function,
    options?: CacheOptions,
  ) {
    if (this.cache.has(key)) {
      return this.cache.get(key) as TReturnType;
    }
    const value = await getFunction();
    this.cache.set(key, value, options?.ttl);
    return value as TReturnType;
  }

  public async set(key: string, value: any, options?: CacheOptions) {
    this.cache.set(key, value, options?.ttl);
  }
}
