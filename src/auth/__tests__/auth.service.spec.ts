import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { TestingModule, Test } from '@nestjs/testing';
import { compare } from 'bcryptjs';
import { OperatorService } from '../../operator/operator.service';
import { AuthService } from '../auth.service';

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let authService: AuthService;
  let operatorService: OperatorService;
  let jwtService: JwtService;
  let configService: ConfigService;

  const mockOperator = {
    _id: '12345',
    operatorId: 'testUser',
    password: 'hashedPassword',
  };

  const mockOperatorService = {
    getOperator: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn().mockResolvedValue('mockJwtToken'),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue({ signOptions: { expireIn: '1h' } }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: OperatorService, useValue: mockOperatorService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    operatorService = module.get<OperatorService>(OperatorService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateOperatorCredential', () => {
    it('should return operator ID if credentials are valid', async () => {
      mockOperatorService.getOperator.mockResolvedValue(mockOperator);
      (compare as jest.Mock).mockResolvedValue(true);

      const result = await authService.validateOperatorCredential({
        operatorId: 'testUser',
        password: 'password123',
      });

      expect(mockOperatorService.getOperator).toHaveBeenCalledWith('testUser');
      expect(compare).toHaveBeenCalledWith('password123', 'hashedPassword');
      expect(result).toBe('12345');
    });

    it('should return null if operator does not exist', async () => {
      mockOperatorService.getOperator.mockResolvedValue(null);

      const result = await authService.validateOperatorCredential({
        operatorId: 'invalidUser',
        password: 'password123',
      });

      expect(mockOperatorService.getOperator).toHaveBeenCalledWith(
        'invalidUser',
      );
      expect(result).toBeNull();
    });

    it('should return null if password is incorrect', async () => {
      mockOperatorService.getOperator.mockResolvedValue(mockOperator);
      (compare as jest.Mock).mockResolvedValue(false);

      const result = await authService.validateOperatorCredential({
        operatorId: 'testUser',
        password: 'wrongPassword',
      });

      expect(mockOperatorService.getOperator).toHaveBeenCalledWith('testUser');
      expect(compare).toHaveBeenCalledWith('wrongPassword', 'hashedPassword');
      expect(result).toBeNull();
    });

    it('shound return null if password is null', async () => {
      const result = await authService.validateOperatorCredential({
        operatorId: 'test',
      });

      expect(result).toBeNull();
    });
  });

  describe('generateJwt', () => {
    it('should return a JWT token', async () => {
      const result = await authService.generateJwt({ operatorId: 'testUser' });

      expect(jwtService.signAsync).toHaveBeenCalledWith(
        { username: 'testUser' },
        { subject: 'testUser', expiresIn: '1h' },
      );
      expect(result).toBe('mockJwtToken');
    });
  });
});
