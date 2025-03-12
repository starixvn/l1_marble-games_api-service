import { JwtStrategy } from '../jwt.strategy';
import { ConfigService } from '@nestjs/config';
import { ConfigKeys } from '../../config/config-keys';
import { Test, TestingModule } from '@nestjs/testing';

const mockConfigService = {
  get: jest.fn().mockImplementation((key) => {
    if (key === ConfigKeys.Jwt) {
      return { secret: 'test-secret' };
    }
    return null;
  }),
};

describe('JwtStrategy', () => {
  let jwtStrategy: JwtStrategy;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    jwtStrategy = module.get<JwtStrategy>(JwtStrategy);
  });

  it('should validate payload correctly', async () => {
    const payload = { sub: '123', username: 'testuser' };
    const result = await jwtStrategy.validate(payload);
    expect(result).toEqual({ userId: '123', username: 'testuser' });
  });
});
