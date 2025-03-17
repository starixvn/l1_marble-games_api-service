import { TestingModule, Test } from '@nestjs/testing';
import { JwtAuthGuard } from '../../common/guards/jwt.auth.guard';
import { EventService } from '../../events/events.service';
import { LoggerInterceptor } from '../../logger/database-logger.interceptor';
import { ScheduleEventItemDto } from '../dto/schedule.dto';
import { TimeRangeDto } from '../dto/time-range.dto';
import { ScheduleController } from '../schedule.controller';

// Mock EventService
const mockEventService = {
  getEventByTimeSpan: jest.fn(),
};

describe('ScheduleController', () => {
  let controller: ScheduleController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ScheduleController],
      providers: [
        {
          provide: EventService,
          useValue: mockEventService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard) // Override the guard to allow access
      .useValue({})
      .overrideInterceptor(LoggerInterceptor) // Override the interceptor to prevent side effects
      .useValue({})
      .compile();

    controller = module.get<ScheduleController>(ScheduleController);
  });

  it('should return a formatted schedule list', async () => {
    // Arrange
    const mockEvents = [
      {
        eventID: '1',
        eventNameAKey: 'Team A vs Team B',
        eventNameBKey: 'Match 1',
      },
      {
        eventID: '2',
        eventNameAKey: 'Team C vs Team D',
        eventNameBKey: 'Match 2',
      },
    ];

    mockEventService.getEventByTimeSpan.mockResolvedValue(mockEvents);

    const query: TimeRangeDto = {
      fromDate: new Date('2024-03-17T00:00:00Z'),
      toDate: new Date('2024-03-18T00:00:00Z'),
    };

    // Act
    const result: ScheduleEventItemDto[] = await controller.getSchedule(query);

    // Assert
    expect(mockEventService.getEventByTimeSpan).toHaveBeenCalledWith({
      startTime: query.fromDate,
      endTime: query.toDate,
    });

    expect(result).toEqual([
      {
        eventID: '1',
        eventNameAKey: 'Team A vs Team B',
        eventNameBKey: 'Match 1',
        productCode: 'Spinner_Soccer',
        productTypeKey: 'Marble_RNG',
      },
      {
        eventID: '2',
        eventNameAKey: 'Team C vs Team D',
        eventNameBKey: 'Match 2',
        productCode: 'Spinner_Soccer',
        productTypeKey: 'Marble_RNG',
      },
    ]);
  });
});
