import { EventService } from '../events.service';
import { Event } from '../schema/event.schema';
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';

describe('EventService', () => {
  let service: EventService;
  let eventModel: any;

  beforeEach(async () => {
    eventModel = {
      find: jest.fn(),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventService,
        {
          provide: getModelToken(Event.name),
          useValue: eventModel,
        },
      ],
    }).compile();

    service = module.get<EventService>(EventService);
  });

  describe('getEventByTimeSpan', () => {
    it('should call model to get events within startTime and endTime', async () => {
      // Arrange
      const events = [
        {
          eventID: 1,
          eventNameAKey: 'Thailand',
          eventNameBKey: 'Laos',
          gameId: 1,
          eventDetails: [],
          startTime: new Date('2025-03-13T10:27:15.527Z'),
          endTime: new Date('2025-03-13T10:29:14.527Z'),
        },
        {
          eventID: 2,
          eventNameAKey: 'Thailand',
          eventNameBKey: 'Vietnam',
          gameId: 1,
          eventDetails: [],
          startTime: new Date('2025-03-13T10:29:15.527Z'),
          endTime: new Date('2025-03-13T10:31:14.527Z'),
        },
      ];

      const query = {
        startTime: new Date('2025-03-13T10:29:15.527Z'),
        endTime: new Date('2025-03-13T10:29:15.527Z'),
      };
      const expectedQueryCalled = {
        startTime: {
          $gte: query.startTime,
          $lte: query.endTime,
        },
      };

      const projection = {
        eventDetails: 0,
      };

      eventModel.find.mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(events),
        }),
      });

      // Act
      const result = await service.getEventByTimeSpan(query);

      // Assert
      expect(result).toEqual(events);
      expect(eventModel.find).toHaveBeenCalledWith(
        expectedQueryCalled,
        projection,
      );
    });

    it('should return events that have not ended when no startTime is provided', async () => {
      // Arrange
      const events = [
        {
          eventID: 1,
          eventNameAKey: 'Thailand',
          eventNameBKey: 'Laos',
          gameId: 1,
          eventDetails: [],
          startTime: new Date('2025-03-13T10:27:15.527Z'),
          endTime: new Date('2025-03-13T10:29:14.527Z'),
        },
      ];

      const query = {};

      eventModel.find.mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(events),
        }),
      });

      // Act
      const result = await service.getEventByTimeSpan(query);

      // Assert
      expect(result).toEqual(events);
      
      // Verify that find was called with a query containing startTime with $gte property
      expect(eventModel.find).toHaveBeenCalled();
      const calledArgs = eventModel.find.mock.calls[0];
      expect(calledArgs[0]).toHaveProperty('endTime.$gte');
      expect(calledArgs[1]).toEqual({ eventDetails: 0 });
    });
  });

  describe('getEventById', () => {
    it('should return an event with populated eventDetails when it exists', async () => {
      // Arrange
      const eventId = 83392;
      const populatedEventDetails = [
        {
          _id: '507f1f77bcf86cd799439013',
          scheduleStartTs: new Date('2025-03-13T10:27:15.527Z'),
          resultsAvailableTs: new Date('2025-03-13T10:29:14.527Z'),
          playlist: 'Football_Standard',
          goalInfo: 'Standard_3_Goals',
          selections: [],
          result: {}
        }
      ];
      
      const event = {
        eventID: eventId,
        eventNameAKey: 'Thailand',
        eventNameBKey: 'Laos',
        gameId: 1,
        eventDetails: populatedEventDetails,
        startTime: new Date('2025-03-13T10:27:15.527Z'),
        endTime: new Date('2025-03-13T10:29:14.527Z'),
      };

      const populateMock = jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(event),
        }),
      });

      eventModel.findOne.mockReturnValue({
        populate: populateMock,
      });

      // Act
      const result = await service.getEventById(eventId);

      // Assert
      expect(result).toEqual(event);
      expect(eventModel.findOne).toHaveBeenCalledWith({ eventID: eventId }, { _id: 0, __v: 0 });
      expect(populateMock).toHaveBeenCalledWith('eventDetails', '-_id -__v');
    });

    it('should throw NotFoundException when event does not exist', async () => {
      // Arrange
      const eventId = 999999;

      const populateMock = jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      });

      eventModel.findOne.mockReturnValue({
        populate: populateMock,
      });

      // Act & Assert
      await expect(service.getEventById(eventId)).rejects.toThrow(
        NotFoundException,
      );
      expect(eventModel.findOne).toHaveBeenCalledWith({ eventID: eventId }, { _id: 0, __v: 0 });
      expect(populateMock).toHaveBeenCalledWith('eventDetails', '-_id -__v');
    });
  });
});
