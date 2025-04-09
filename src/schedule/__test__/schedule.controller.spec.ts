import { TestingModule, Test } from '@nestjs/testing';
import { JwtAuthGuard } from '../../common/guards/jwt.auth.guard';
import { EventService } from '../../events/events.service';
import { LoggerInterceptor } from '../../logger/database-logger.interceptor';
import { TimeRangeDto } from '../dto/time-range.dto';
import { ScheduleController } from '../schedule.controller';
import { GameIntegrationService } from '../../game-integration/game-integration.service';

const mockEventService = {
  getEventByTimeSpan: jest.fn(),
};

const mockGameIntegrationService = {
  mergeWithEvents: jest.fn(),
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
        {
          provide: GameIntegrationService,
          useValue: mockGameIntegrationService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({})
      .overrideInterceptor(LoggerInterceptor)
      .useValue({})
      .compile();

    controller = module.get<ScheduleController>(ScheduleController);
  });

  describe('getSchedule', () => {
    it('should return a formatted schedule list', async () => {
      // Arrange
      const mockEvents = [
        {
          eventID: '1',
          eventNameAKey: 'Manchester United',
          eventNameBKey: 'Liverpool',
          gameId: 'game1',
          startTime: new Date('2024-03-17T10:00:00Z'),
        },
        {
          eventID: '2',
          eventNameAKey: 'Arsenal',
          eventNameBKey: 'Chelsea',
          gameId: 'game2',
          startTime: new Date('2024-03-17T12:00:00Z'),
        },
      ];

      const mockMergedEvents = [
        {
          eventID: '1',
          eventNameAKey: 'Manchester United',
          eventNameBKey: 'Liverpool',
          eventName: 'Manchester United v Liverpool',
          schdeuleStartTs: mockEvents[0].startTime,
          productCode: 'Spinner_Soccer',
          productTypeKey: 'Marble_RNG',
        },
        {
          eventID: '2',
          eventNameAKey: 'Arsenal',
          eventNameBKey: 'Chelsea',
          eventName: 'Arsenal v Chelsea',
          schdeuleStartTs: mockEvents[1].startTime,
          productCode: 'Spinner_Soccer',
          productTypeKey: 'Marble_RNG',
        },
      ];

      mockEventService.getEventByTimeSpan.mockResolvedValue(mockEvents);
      mockGameIntegrationService.mergeWithEvents.mockImplementation(
        ({ targets }) =>
          Promise.resolve({
            ...targets,
            productCode: 'Spinner_Soccer',
            productTypeKey: 'Marble_RNG',
          }),
      );

      const query: TimeRangeDto = {
        fromDate: new Date('2024-03-17T00:00:00Z'),
        toDate: new Date('2024-03-18T00:00:00Z'),
      };

      const mockReq = {
        user: {
          userId: 'test-operator',
        },
      };

      // Act
      const result = await controller.getSchedule(query, mockReq);

      // Assert
      expect(mockEventService.getEventByTimeSpan).toHaveBeenCalledWith({
        startTime: query.fromDate,
        endTime: query.toDate,
      });

      expect(mockGameIntegrationService.mergeWithEvents).toHaveBeenCalledTimes(
        2,
      );
      expect(mockGameIntegrationService.mergeWithEvents).toHaveBeenCalledWith({
        targets: {
          eventID: '1',
          eventNameAKey: 'Manchester United',
          eventNameBKey: 'Liverpool',
          eventName: 'Manchester United v Liverpool',
          schdeuleStartTs: mockEvents[0].startTime,
        },
        query: {
          operatorId: 'test-operator',
          gameId: 'game1',
        },
      });

      const resolvedResults = await Promise.all(result);
      expect(resolvedResults).toEqual(mockMergedEvents);
    });
  });
});
