import { JwtAuthGuard } from '../guards/jwt.auth.guard';
import { ExecutionContext } from '@nestjs/common';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;

  beforeEach(() => {
    guard = new JwtAuthGuard();
  });

  it('should call canActivate and return expected result', async () => {
    const mockContext = {
      switchToHttp: jest.fn().mockReturnThis(),
      getRequest: jest.fn().mockReturnThis(),
    } as unknown as ExecutionContext;

    jest.spyOn(guard, 'canActivate').mockResolvedValue(true);

    const result = await guard.canActivate(mockContext);
    expect(result).toBe(true);
  });
});
