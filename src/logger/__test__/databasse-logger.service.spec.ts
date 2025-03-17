import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DatabaseLogService } from '../database-logger.service';
import { LogRecordDocument, LogRecord } from '../schema/log-record.schema';

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
        { provide: getModelToken(LogRecord.name), useValue: mockModel }, // Mock Mongoose Model
      ],
    }).compile();

    service = module.get<DatabaseLogService>(DatabaseLogService);
    model = module.get<Model<LogRecordDocument>>(getModelToken(LogRecord.name));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should insert log correctly', async () => {
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

    await service.insertLog(logRecord);

    expect(model.insertOne).toHaveBeenCalledWith(logRecord);
  });
});
