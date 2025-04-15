import { Test, TestingModule } from '@nestjs/testing';
import { GameIntegrationService } from '../game-integration.service';
import { MemoryCacheService } from '../../cache/cache.service';
import { apply } from 'json-merge-patch';
import { GameIntegration } from '../schema/game-integration.schema';
import { getModelToken } from '@nestjs/mongoose';

jest.mock('json-merge-patch', () => ({
  apply: jest.fn(),
}));

describe('GameIntegrationService', () => {
  let service: GameIntegrationService;
  let cacheService: MemoryCacheService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GameIntegrationService,
        {
          provide: getModelToken(GameIntegration.name),
          useValue: {
            findOne: jest.fn().mockReturnValue({
              lean: jest.fn().mockReturnValue({
                exec: jest.fn(),
              }),
            }),
          },
        },
        {
          provide: MemoryCacheService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<GameIntegrationService>(GameIntegrationService);
    cacheService = module.get<MemoryCacheService>(MemoryCacheService);
  });

  describe('mergeWithEvents', () => {
    it('should return targets when no game integration found', async () => {
      // Arrange
      const args = {
        targets: { test: 'value' },
        query: { operatorId: '507f1f77bcf86cd799439011', gameId: 1 },
      };
      (cacheService.get as jest.Mock).mockImplementation(() => {
        return Promise.resolve(null);
      });

      // Act
      const result = await service.mergeWithEvents(args);

      // Assert
      expect(result).toEqual(args.targets);
      expect(cacheService.get).toHaveBeenCalledWith(
        `GameIntegration:${args.query.operatorId}:${args.query.gameId}`,
        expect.any(Function)
      );
    });

    it('should return targets when game integration has no merge field', async () => {
      // Arrange
      const args = {
        targets: { test: 'value' },
        query: { operatorId: '507f1f77bcf86cd799439011', gameId: 1 },
      };
      (cacheService.get as jest.Mock).mockImplementation(() => {
        return Promise.resolve({});
      });

      // Act
      const result = await service.mergeWithEvents(args);

      // Assert
      expect(result).toEqual(args.targets);
    });

    it('should apply merge patch when game integration has merge field', async () => {
      // Arrange
      const args = {
        targets: { test: 'value' },
        query: { operatorId: '507f1f77bcf86cd799439011', gameId: 1 },
      };
      const merge = { newField: 'newValue' };
      const expectedResult = { test: 'value', newField: 'newValue' };
      
      (cacheService.get as jest.Mock).mockImplementation(() => {
        return Promise.resolve({ merge });
      });
      (apply as jest.Mock).mockReturnValue(expectedResult);

      // Act
      const result = await service.mergeWithEvents(args);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(apply).toHaveBeenCalledWith(args.targets, merge);
    });
  });
}); 
