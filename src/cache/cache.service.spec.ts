import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { MemoryCacheService } from './cache.service';
import { ConfigKeys } from '../config/config-keys';
import { CacheableMemory } from 'cacheable';

jest.mock('cacheable', () => {
  return {
    CacheableMemory: jest.fn().mockImplementation(() => ({
      has: jest.fn(),
      get: jest.fn(),
      set: jest.fn(),
    })),
  };
});

describe('MemoryCacheService', () => {
  let service: MemoryCacheService;
  let cacheableMock: jest.Mocked<CacheableMemory>;

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn().mockImplementation((key) => {
        if (key === ConfigKeys.Cache) {
          return { ttl: 3600 };
        }
        return null;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MemoryCacheService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<MemoryCacheService>(MemoryCacheService);
    cacheableMock = (service as any).cache;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('get', () => {
    it('should return cached value when key exists', async () => {
      const key = 'test-key';
      const cachedValue = { data: 'cached-value' };
      
      cacheableMock.has.mockReturnValue(true);
      cacheableMock.get.mockReturnValue(cachedValue);
      
      const getFunction = jest.fn();
      
      const result = await service.get(key, getFunction);
      
      expect(cacheableMock.has).toHaveBeenCalledWith(key);
      expect(cacheableMock.get).toHaveBeenCalledWith(key);
      expect(getFunction).not.toHaveBeenCalled();
      expect(result).toEqual(cachedValue);
    });

    it('should call getFunction and cache result when key does not exist', async () => {
      const key = 'test-key';
      const fetchedValue = { data: 'new-value' };
      
      cacheableMock.has.mockReturnValue(false);
      const getFunction = jest.fn().mockResolvedValue(fetchedValue);
      
      const result = await service.get(key, getFunction);
      
      expect(cacheableMock.has).toHaveBeenCalledWith(key);
      expect(getFunction).toHaveBeenCalled();
      expect(cacheableMock.set).toHaveBeenCalledWith(key, fetchedValue, undefined);
      expect(result).toEqual(fetchedValue);
    });

    it('should use custom TTL when provided in options', async () => {
      const key = 'test-key';
      const fetchedValue = { data: 'new-value' };
      const options = { ttl: 1800 };
      
      cacheableMock.has.mockReturnValue(false);
      const getFunction = jest.fn().mockResolvedValue(fetchedValue);
      
      await service.get(key, getFunction, options);
      
      expect(cacheableMock.set).toHaveBeenCalledWith(key, fetchedValue, options.ttl);
    });
  });

  describe('has', () => {
    it('should check if key exists in cache', () => {
      const key = 'test-key';
      
      cacheableMock.has.mockReturnValue(true);
      
      const result = service.has(key);
      
      expect(cacheableMock.has).toHaveBeenCalledWith(key);
      expect(result).toBe(true);
    });
  });

  describe('set', () => {
    it('should set value in cache with default TTL', async () => {
      const key = 'test-key';
      const value = { data: 'test-value' };
      
      await service.set(key, value);
      
      expect(cacheableMock.set).toHaveBeenCalledWith(key, value, undefined);
    });

    it('should set value in cache with custom TTL', async () => {
      const key = 'test-key';
      const value = { data: 'test-value' };
      const options = { ttl: 1800 };
      
      await service.set(key, value, options);
      
      expect(cacheableMock.set).toHaveBeenCalledWith(key, value, options.ttl);
    });
  });
});
