import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';
import { LoggerInterceptor } from '../database-logger.interceptor';
import { DatabaseLogService } from '../database-logger.service';

describe('LoggerInterceptor', () => {
  let interceptor: LoggerInterceptor;
  let databaseLogService: DatabaseLogService;
  let executionContext: ExecutionContext;
  let callHandler: CallHandler;

  beforeEach(() => {
    databaseLogService = { insertLog: jest.fn() } as unknown as DatabaseLogService;
    interceptor = new LoggerInterceptor(databaseLogService);

    executionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          method: 'GET',
          url: '/test-endpoint',
          body: { key: 'value' },
        }),
        getResponse: jest.fn().mockReturnValue({
          statusCode: 200,
        }),
      }),
    } as unknown as ExecutionContext;

    callHandler = {
      handle: jest.fn().mockReturnValue(of({ success: true })),
    };
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  it('should log request and response correctly', (done) => {
    jest.spyOn(Date, 'now').mockImplementationOnce(() => 1000) // Mock start time
                                   .mockImplementationOnce(() => 1100); // Mock end time (100ms duration)

    interceptor.intercept(executionContext, callHandler).subscribe(() => {
      expect(databaseLogService.insertLog).toHaveBeenCalledWith({
        request: {
          method: 'GET',
          url: '/test-endpoint',
          body: { key: 'value' },
        },
        response: {
          statusCode: 200,
          responseBody: { success: true },
          responseTime: '100ms',
        },
      });
      done();
    });
  });
});
