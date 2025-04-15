import { Test, TestingModule } from '@nestjs/testing';
import { EventsController } from '../events.controller';
import { EventService } from '../events.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt.auth.guard';
import { LoggerInterceptor } from '../../logger/database-logger.interceptor';
import { GameIntegrationService } from '../../game-integration/game-integration.service';

describe('EventsController', () => {
  let controller: EventsController;
  let eventService: EventService;
  let gameIntegrationService: GameIntegrationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventsController],
      providers: [
        {
          provide: EventService,
          useValue: {
            getEventById: jest.fn(),
          },
        },
        {
          provide: GameIntegrationService,
          useValue: {
            mergeEventWithEventDetails: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({})
      .overrideInterceptor(LoggerInterceptor)
      .useValue({})
      .compile();

    controller = module.get<EventsController>(EventsController);
    eventService = module.get<EventService>(EventService);
    gameIntegrationService = module.get<GameIntegrationService>(GameIntegrationService);
  });

  describe('getEvents', () => {
    it('should return an event when eventID is provided', async () => {
      // Arrange
      const eventId = 83392;
      const event = {
        eventID: eventId,
        eventNameAKey: 'Thailand',
        eventNameBKey: 'Laos',
        gameId: 1,
        startTime: new Date('2025-03-13T10:27:15.527Z'),
        endTime: new Date('2025-03-13T10:29:14.527Z'),
        eventDetails: [],
        _id: '507f1f77bcf86cd799439011',
        __v: 0
      };
      const mergedEvent = { 
        ...event, 
        additionalField: 'merged-data' 
      };

      jest.spyOn(eventService, 'getEventById').mockResolvedValue(event as any);
      jest.spyOn(gameIntegrationService, 'mergeEventWithEventDetails').mockResolvedValue(mergedEvent);

      const mockReq = {
        user: {
          userId: 'test-operator',
        },
      };

      // Act
      const result = await controller.getEvents(eventId.toString(), mockReq);

      // Assert
      expect(result).toEqual(mergedEvent);
      expect(eventService.getEventById).toHaveBeenCalledWith(eventId);
      expect(gameIntegrationService.mergeEventWithEventDetails).toHaveBeenCalledWith({
        query: {
          operatorId: 'test-operator',
          gameId: 1,
        },
        targets: event
      });
    });

    it('should throw BadRequestException when eventID is not provided', async () => {
      // Arrange
      const eventID = undefined;
      const mockReq = {
        user: {
          userId: 'test-operator',
        },
      };

      // Act & Assert
      await expect(controller.getEvents(eventID, mockReq)).rejects.toThrow(
        new BadRequestException('eventID is required')
      );
      expect(eventService.getEventById).not.toHaveBeenCalled();
      expect(gameIntegrationService.mergeEventWithEventDetails).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when eventID is not a valid integer', async () => {
      // Arrange
      const eventID = 'not-a-number';
      const mockReq = {
        user: {
          userId: 'test-operator',
        },
      };

      // Act & Assert
      await expect(controller.getEvents(eventID, mockReq)).rejects.toThrow(
        new BadRequestException('eventID must be a valid integer')
      );
      expect(eventService.getEventById).not.toHaveBeenCalled();
      expect(gameIntegrationService.mergeEventWithEventDetails).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when event with ID is not found', async () => {
      // Arrange
      const eventId = 999999;
      const mockReq = {
        user: {
          userId: 'test-operator',
        },
      };
      
      jest.spyOn(eventService, 'getEventById').mockRejectedValue(
        new NotFoundException(`Event with ID ${eventId} not found`)
      );

      // Act & Assert
      await expect(controller.getEvents(eventId.toString(), mockReq)).rejects.toThrow(NotFoundException);
      expect(eventService.getEventById).toHaveBeenCalledWith(eventId);
      expect(gameIntegrationService.mergeEventWithEventDetails).not.toHaveBeenCalled();
    });
  });
}); 
