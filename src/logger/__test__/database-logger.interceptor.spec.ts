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

  describe("intercept", () => {
    it('when response data available in 100ms, should call log service to log it', (done) => {
      // Arrange
      jest.spyOn(Date, 'now')
        .mockImplementationOnce(() => 0)
        .mockImplementationOnce(() => 100); 
      const mockRequest = {
        method: 'GET',
        url: '/test-endpoint',
        body: { key: 'value' },
      }

      const mockResponseBody = { success: true }

      const expectedResponse = {
        statusCode: 200,
        responseBody: mockResponseBody,
        responseTime: '100ms',
      }

      const expectedLogRecord = {
        request: mockRequest,
        response: expectedResponse
      }

      // Act
      const result$ = interceptor.intercept(executionContext, callHandler)
      
      // Assert
      result$.subscribe(() => {
        expect(databaseLogService.insertLog).toHaveBeenCalledWith(expectedLogRecord);
        done();
      })
    });
  })
});
