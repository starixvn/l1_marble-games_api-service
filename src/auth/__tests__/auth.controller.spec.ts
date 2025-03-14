import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { AuthDto, AuthResponseDto } from '../dto/auth.dto';

describe('AuthController', () => {
  let authController: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    validateOperatorCredential: jest.fn(),
    generateJwt: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    authController = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should return an access token if credentials are valid', async () => {
      // arrange
      const loginDto: AuthDto = { operatorId: 'testUser', password: 'password' };
      const mockToken = 'mockJwtToken';
      mockAuthService.validateOperatorCredential.mockResolvedValue(true);
      mockAuthService.generateJwt.mockResolvedValue(mockToken);

      // act
      const result: AuthResponseDto = await authController.login(loginDto);

      // assert
      expect(mockAuthService.validateOperatorCredential).toHaveBeenCalledWith({
        operatorId: loginDto.operatorId,
        password: loginDto.password,
      });
      expect(mockAuthService.generateJwt).toHaveBeenCalledWith({
        operatorId: loginDto.operatorId,
      });
      expect(result).toEqual({ access_token: mockToken });
    });

    it('should throw UnauthorizedException if credentials are invalid', async () => {
      // arrange
      const loginDto: AuthDto = { operatorId: 'testUser', password: 'wrongPassword' };
      mockAuthService.validateOperatorCredential.mockResolvedValue(null);

      // act
      const act = authController.login(loginDto);

      // assert 
      await expect(act).rejects.toThrow(UnauthorizedException);

      expect(mockAuthService.validateOperatorCredential).toHaveBeenCalledWith({
        operatorId: loginDto.operatorId,
        password: loginDto.password,
      });
      expect(mockAuthService.generateJwt).not.toHaveBeenCalled();
    });
  });
});
