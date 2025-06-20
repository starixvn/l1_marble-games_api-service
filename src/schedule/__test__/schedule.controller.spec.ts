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
  getGameIntegration: jest.fn(),
  processForScheduleEventsWithGameIntegration: jest.fn(),
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
    beforeEach(() => {
      jest.clearAllMocks();
    });

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

      const mockGameIntegration = {
        id: 'integration1',
        operatorId: 'test-operator',
        gameId: 'game1',
        productCode: 'Spinner_Soccer',
        productTypeKey: 'Marble_RNG',
      };

      const mockProcessedEvents = [
        {
          eventID: '1',
          eventNameAKey: 'Manchester United',
          eventNameBKey: 'Liverpool',
          gameId: 'game1',
          startTime: mockEvents[0].startTime,
          productCode: 'Spinner_Soccer',
          productTypeKey: 'Marble_RNG',
          patchedField: 'patched-value',
        },
        {
          eventID: '2',
          eventNameAKey: 'Arsenal',
          eventNameBKey: 'Chelsea',
          gameId: 'game2',
          startTime: mockEvents[1].startTime,
          productCode: 'Spinner_Soccer',
          productTypeKey: 'Marble_RNG',
          patchedField: 'patched-value',
        },
      ];

      mockEventService.getEventByTimeSpan.mockResolvedValue(mockEvents);
      mockGameIntegrationService.getGameIntegration.mockResolvedValue(mockGameIntegration);
      
      // Mock the processForScheduleEventsWithGameIntegration method
      mockGameIntegrationService.processForScheduleEventsWithGameIntegration.mockImplementation(
        ({ targets, gameIntegration }) =>
          Promise.resolve({
            ...targets,
            productCode: gameIntegration.productCode,
            productTypeKey: gameIntegration.productTypeKey,
            patchedField: 'patched-value',
          }),
      );

      const query: TimeRangeDto = {
        fromDate: '2024-03-17T00:00:00Z',
        toDate: '2024-03-18T00:00:00Z',
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
        startTime: new Date(query?.fromDate ?? ""),
        endTime: new Date(query?.toDate ?? ""),
      });

      expect(mockGameIntegrationService.getGameIntegration).toHaveBeenCalledTimes(2);
      expect(mockGameIntegrationService.getGameIntegration).toHaveBeenCalledWith({
        query: {
          operatorId: 'test-operator',
          gameId: 'game1',
        },
      });

      expect(mockGameIntegrationService.getGameIntegration).toHaveBeenCalledWith({
        query: {
          operatorId: 'test-operator',
          gameId: 'game2',
        },
      });

      expect(mockGameIntegrationService.processForScheduleEventsWithGameIntegration).toHaveBeenCalledTimes(2);
      expect(mockGameIntegrationService.processForScheduleEventsWithGameIntegration).toHaveBeenCalledWith({
        targets: mockEvents[0],
        gameIntegration: mockGameIntegration,
      });

      expect(mockGameIntegrationService.processForScheduleEventsWithGameIntegration).toHaveBeenCalledWith({
        targets: mockEvents[1],
        gameIntegration: mockGameIntegration,
      });

      expect(result).toEqual(mockProcessedEvents);
    });

    it("should filter out all games that have no game integration", async () => {
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
        {
          eventID: '3',
          eventNameAKey: 'Tottenham',
          eventNameBKey: 'West Ham',
          gameId: 'game3',
          startTime: new Date('2024-03-17T14:00:00Z'),
        },
      ];

      const mockGameIntegration = {
        id: 'integration1',
        operatorId: 'test-operator',
        gameId: 'game1',
        productCode: 'Spinner_Soccer',
        productTypeKey: 'Marble_RNG',
      };

      const mockProcessedEvent = {
        eventID: '1',
        eventNameAKey: 'Manchester United',
        eventNameBKey: 'Liverpool',
        gameId: 'game1',
        startTime: mockEvents[0].startTime,
        productCode: 'Spinner_Soccer',
        productTypeKey: 'Marble_RNG',
        patchedField: 'patched-value',
      };

      mockEventService.getEventByTimeSpan.mockResolvedValue(mockEvents);
      
      mockGameIntegrationService.getGameIntegration.mockReset();
      mockGameIntegrationService.processForScheduleEventsWithGameIntegration.mockReset();
      
      mockGameIntegrationService.getGameIntegration.mockImplementation(({ query }) => {
        if (query.gameId === 'game1') {
          return Promise.resolve(mockGameIntegration);
        }
        return Promise.resolve(null);
      });
      
      mockGameIntegrationService.processForScheduleEventsWithGameIntegration.mockImplementation(
        ({ targets, gameIntegration }) =>
          Promise.resolve({
            ...targets,
            productCode: gameIntegration.productCode,
            productTypeKey: gameIntegration.productTypeKey,
            patchedField: 'patched-value',
          }),
      );

      const query: TimeRangeDto = {
        fromDate: '2024-03-17T00:00:00Z',
        toDate: '2024-03-18T00:00:00Z',
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
        startTime: new Date(query?.fromDate ?? ""),
        endTime: new Date(query?.toDate ?? ""),
      });

      expect(mockGameIntegrationService.getGameIntegration).toHaveBeenCalledTimes(3);
      
      expect(mockGameIntegrationService.processForScheduleEventsWithGameIntegration).toHaveBeenCalledTimes(1);
      expect(mockGameIntegrationService.processForScheduleEventsWithGameIntegration).toHaveBeenCalledWith({
        targets: mockEvents[0],
        gameIntegration: mockGameIntegration,
      });

      expect(result).toEqual([mockProcessedEvent]);
    });
  });
});
