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
    databaseLogService = {
      insertLog: jest.fn(),
    } as unknown as DatabaseLogService;
    interceptor = new LoggerInterceptor(databaseLogService);

    executionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          method: 'GET',
          path: '/test-endpoint',
          query: {},
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

  describe('intercept', () => {
    it('when response data available in 100ms, should call log service to log it', (done) => {
      // Arrange
      jest
        .spyOn(Date, 'now')
        .mockImplementationOnce(() => 0)
        .mockImplementationOnce(() => 100);
      const mockRequest = {
        method: 'GET',
        path: '/test-endpoint',
        query: {},
        body: { key: 'value' },
      };

      const mockResponseBody = { success: true };

      const expectedResponse = {
        statusCode: 200,
        responseBody: mockResponseBody,
        responseTime: '100ms',
      };

      const expectedLogRecord = {
        request: mockRequest,
        response: expectedResponse,
      };

      // Act
      const result$ = interceptor.intercept(executionContext, callHandler);

      // Assert
      result$.subscribe(() => {
        expect(databaseLogService.insertLog).toHaveBeenCalledWith(
          expectedLogRecord,
        );
        done();
      });
    });

    it("when there is eventID in the query, should log additionalInfo", (done) => {
      // Arrange
      jest
        .spyOn(Date, 'now')
        .mockImplementationOnce(() => 0)
        .mockImplementationOnce(() => 150);
      
      const mockRequest = {
        method: 'POST',
        path: '/test-endpoint',
        query: { eventID: '8594229559297' }, // eventID with gameId and roundId
        body: { key: 'value' },
      };

      const mockResponseBody = { success: true };

      const expectedResponse = {
        statusCode: 200,
        responseBody: mockResponseBody,
        responseTime: '150ms',
      };

      const expectedLogRecord = {
        user: undefined,
        request: {
          ...mockRequest,
          additionalInfo: {
            eventId: 8594229559297,
            gameId: 2001, // extracted from eventID
            roundId: 1, // extracted from eventID
          },
        },
        response: expectedResponse,
      };

      // Update execution context to include eventID in query
      executionContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
          getResponse: jest.fn().mockReturnValue({
            statusCode: 200,
          }),
        }),
      } as unknown as ExecutionContext;

      // Act
      const result$ = interceptor.intercept(executionContext, callHandler);

      // Assert
      result$.subscribe(() => {
        expect(databaseLogService.insertLog).toHaveBeenCalledWith(
          expectedLogRecord,
        );
        done();
      });
    });
  });
});
