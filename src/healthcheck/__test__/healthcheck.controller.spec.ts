import { Test, TestingModule } from '@nestjs/testing';
import { HealthCheckController } from '../healthcheck.controller';

describe('HealthcheckController', () => {
  let healthcheckController: HealthCheckController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthCheckController],
    }).compile();

    healthcheckController = module.get<HealthCheckController>(
      HealthCheckController,
    );
  });

  describe('healthcheck', () => {
    it('should return status healthy json object', () => {
      const result = healthcheckController.healthCheck();

      expect(result).toEqual({
        status: 'healthy',
      });
    });
  });
});
