import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DatabaseLogService } from '../database-logger.service';
import { LogRecordDocument, LogRecord } from '../schema/log-record.schema';
import { ConnectionNames } from '../../config/connection-names';

describe('DatabaseLogService', () => {
  let service: DatabaseLogService;
  let model: Model<LogRecordDocument>;

  beforeEach(async () => {
    const mockModel = {
      insertOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DatabaseLogService,
        { provide: getModelToken(LogRecord.name, ConnectionNames.Log), useValue: mockModel },
      ],
    }).compile();

    service = module.get<DatabaseLogService>(DatabaseLogService);
    model = module.get<Model<LogRecordDocument>>(getModelToken(LogRecord.name, ConnectionNames.Log));
  });

  describe("insertLog", () => {
    it('When given log record, should call DB model to insert that log record', async () => {
  
      // Arrange
      const logRecord: LogRecord = {
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
      };
  
      // Act
      await service.insertLog(logRecord);
  
      // Assert
      expect(model.insertOne).toHaveBeenCalledWith(logRecord);
    });
  })

});
