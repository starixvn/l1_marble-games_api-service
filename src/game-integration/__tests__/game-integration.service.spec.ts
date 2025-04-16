import { Test, TestingModule } from '@nestjs/testing';
import { GameIntegrationService } from '../game-integration.service';
import { MemoryCacheService } from '../../cache/cache.service';
import { GameIntegration } from '../schema/game-integration.schema';
import { getModelToken } from '@nestjs/mongoose';
import { Event } from '../../events/schema/event.schema';
import { EventDetail } from '../../events/schema/event-detail.schema';
import { Selection } from '../../events/schema/selection.schema';

describe('GameIntegrationService', () => {
  let service: GameIntegrationService;
  let cacheGetMock: jest.Mock;
  let mockEvent: Event;

  beforeEach(async () => {
    cacheGetMock = jest.fn();
    
    mockEvent = {
      eventID: 123,
      eventNameAKey: 'team_a',
      eventNameBKey: 'team_b',
      gameId: 1,
      startTime: new Date(),
      endTime: new Date(),
      eventDetails: []
    };
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GameIntegrationService,
        {
          provide: getModelToken(GameIntegration.name),
          useValue: {
            findOne: jest.fn().mockReturnValue({
              populate: jest.fn().mockReturnValue({
                lean: jest.fn().mockReturnValue({
                  exec: jest.fn(),
                }),
              }),
            }),
          },
        },
        {
          provide: MemoryCacheService,
          useValue: {
            get: cacheGetMock,
          },
        },
      ],
    }).compile();

    service = module.get<GameIntegrationService>(GameIntegrationService);
  });

  describe('mergeWithEvents', () => {
    it('should return targets when no game integration found', async () => {
      // Arrange
      const args = {
        targets: mockEvent,
        query: { operatorId: '507f1f77bcf86cd799439011', gameId: 1 },
      };
      cacheGetMock.mockResolvedValue(null);

      // Act
      const result = await service.mergeWithEvents(args);

      // Assert
      expect(result).toEqual(mockEvent);
      expect(cacheGetMock).toHaveBeenCalledWith(
        `GameIntegration:${args.query.operatorId}:${args.query.gameId}`,
        expect.any(Function)
      );
    });

    it('should return targets when game integration has no merge field', async () => {
      // Arrange
      const args = {
        targets: mockEvent,
        query: { operatorId: '507f1f77bcf86cd799439011', gameId: 1 },
      };
      cacheGetMock.mockResolvedValue({});

      // Act
      const result = await service.mergeWithEvents(args);

      // Assert
      expect(result).toEqual(mockEvent);
    });

    it('should apply merge patch when game integration has merge field', async () => {
      // Arrange
      const args = {
        targets: mockEvent,
        query: { operatorId: '507f1f77bcf86cd799439011', gameId: 1 },
      };
      const merge = { eventNameAKey: 'updated_team_a' };
      
      cacheGetMock.mockResolvedValue({ merge });

      // Act
      const result = await service.mergeWithEvents(args);

      // Assert
      expect(result.eventNameAKey).toEqual('updated_team_a');
    });
  });

  describe('mergeEventWithEventDetails', () => {
    it('should correctly merge event with event details', async () => {
      // Arrange
      const mockSelection: Selection = {
        name: 'selection1',
        price: 1.5,
        point: 1.0,
        settlementStatus: 'pending'
      };
      
      const mockEventDetail: EventDetail = {
        scheduleStartTs: new Date(),
        resultsAvailableTs: new Date(),
        oddsAvailableTs: new Date(),
        playlist: 'playlist1',
        goalInfo: 'goalInfo1',
        selections: [mockSelection],
        result: {}
      };
      
      const mockEventWithDetails = {
        ...mockEvent,
        eventDetails: [mockEventDetail]
      };
      
      const mockGameIntegration = {
        merge: { customField: 'customValue' },
        markets: [
          {
            merge: { name: 'Market1' },
            selections: [{ 
              name: 'selection1', 
              selectionNameKey: 'key1',
              selectionID: 1001,
              column: 1
            }]
          }
        ],
        streamServer: 'https://stream-server.example.com',
        videoExtension: 'mp4'
      };
      
      const args = {
        targets: mockEventWithDetails,
        query: { operatorId: '507f1f77bcf86cd799439011', gameId: 1 },
      };
      
      cacheGetMock.mockResolvedValue(mockGameIntegration);
      
      const expectedResult = {
        ...mockEventWithDetails,
        customField: 'customValue',
        eventDetails: [
          {
            scheduleStartTs: mockEventDetail.scheduleStartTs,
            resultsAvailableTs: mockEventDetail.resultsAvailableTs,
            oddsAvailableTs: mockEventDetail.oddsAvailableTs,
            playlist: 'https://stream-server.example.com/playlist1.mp4',
            goalInfo: 'https://stream-server.example.com/goalInfo1.json',
            result: {},
            selections: mockEventDetail.selections,
            markets: [
              {
                name: 'Market1',
                selections: [
                  {
                    name: 'selection1',
                    price: 1.5,
                    point: 1.0,
                    settlementStatus: 'pending',
                    selectionNameKey: 'key1',
                    selectionID: 1001,
                    column: 1
                  }
                ]
              }
            ]
          }
        ]
      };
      
      // Act
      const result = await service.mergeEventWithEventDetails(args);
      
      // Assert
      expect(result).toEqual(expectedResult);
    });

    it('should correctly merge event with event details that have no selections', async () => {
      // Arrange
      const mockEventDetail: EventDetail = {
        scheduleStartTs: new Date(),
        resultsAvailableTs: new Date(),
        oddsAvailableTs: new Date(),
        playlist: 'playlist1',
        goalInfo: 'goalInfo1',
        selections: [],
        result: {}
      };
      
      const mockEventWithDetails = {
        ...mockEvent,
        eventDetails: [mockEventDetail]
      };
      
      const mockGameIntegration = {
        merge: { customField: 'customValue' },
        markets: [
          {
            merge: { name: 'Market1' },
            selections: [{ 
              name: 'selection1', 
              selectionNameKey: 'key1',
              selectionID: 1001,
              column: 1
            }]
          }
        ],
        streamServer: 'https://stream-server.example.com',
        videoExtension: 'mp4'
      };
      
      const args = {
        targets: mockEventWithDetails,
        query: { operatorId: '507f1f77bcf86cd799439011', gameId: 1 },
      };
      
      cacheGetMock.mockResolvedValue(mockGameIntegration);
      
      const expectedResult = {
        ...mockEventWithDetails,
        customField: 'customValue',
        eventDetails: [
          {
            scheduleStartTs: mockEventDetail.scheduleStartTs,
            resultsAvailableTs: mockEventDetail.resultsAvailableTs,
            oddsAvailableTs: mockEventDetail.oddsAvailableTs,
            playlist: 'https://stream-server.example.com/playlist1.mp4',
            goalInfo: 'https://stream-server.example.com/goalInfo1.json',
            result: {},
            selections: mockEventDetail.selections,
            markets: [
              {
                name: 'Market1',
                selections: []
              }
            ]
          }
        ]
      };
      
      // Act
      const result = await service.mergeEventWithEventDetails(args);
      
      // Assert
      expect(result).toEqual(expectedResult);
    });

    it('should correctly merge event with selection that has no matching name in market integrations', async () => {
      // Arrange
      const mockSelection: Selection = {
        name: 'NOT_APPEAR',
        price: 1.5,
        point: 1.0,
        settlementStatus: 'pending'
      };
      
      const mockEventDetail: EventDetail = {
        scheduleStartTs: new Date(),
        resultsAvailableTs: new Date(),
        oddsAvailableTs: new Date(),
        playlist: 'playlist1',
        goalInfo: 'goalInfo1',
        selections: [mockSelection],
        result: {}
      };
      
      const mockEventWithDetails = {
        ...mockEvent,
        eventDetails: [mockEventDetail]
      };
      
      const mockGameIntegration = {
        merge: { customField: 'customValue' },
        markets: [
          {
            merge: { name: 'Market1' },
            selections: [{ 
              name: 'selection1', 
              selectionNameKey: 'key1',
              selectionID: 1001,
              column: 1
            }]
          }
        ],
        streamServer: 'https://stream-server.example.com',
        videoExtension: 'mp4'
      };
      
      const args = {
        targets: mockEventWithDetails,
        query: { operatorId: '507f1f77bcf86cd799439011', gameId: 1 },
      };
      
      cacheGetMock.mockResolvedValue(mockGameIntegration);
      
      const expectedResult = {
        ...mockEventWithDetails,
        customField: 'customValue',
        eventDetails: [
          {
            scheduleStartTs: mockEventDetail.scheduleStartTs,
            resultsAvailableTs: mockEventDetail.resultsAvailableTs,
            oddsAvailableTs: mockEventDetail.oddsAvailableTs,
            playlist: 'https://stream-server.example.com/playlist1.mp4',
            goalInfo: 'https://stream-server.example.com/goalInfo1.json',
            result: {},
            selections: mockEventDetail.selections,
            markets: [
              {
                name: 'Market1',
                selections: []
              }
            ]
          }
        ]
      };
      
      // Act
      const result = await service.mergeEventWithEventDetails(args);
      
      // Assert
      expect(result).toEqual(expectedResult);
    });

    it('should correctly handle undefined playlist value', async () => {
      // Arrange
      const mockEventDetail: EventDetail = {
        scheduleStartTs: new Date(),
        resultsAvailableTs: new Date(),
        oddsAvailableTs: new Date(),
        playlist: undefined,
        goalInfo: 'goalInfo1',
        selections: [],
        result: {}
      };
      
      const mockEventWithDetails = {
        ...mockEvent,
        eventDetails: [mockEventDetail]
      };
      
      const mockGameIntegration = {
        merge: { customField: 'customValue' },
        markets: [],
        streamServer: 'https://stream-server.example.com',
        videoExtension: 'mp4'
      };
      
      const args = {
        targets: mockEventWithDetails,
        query: { operatorId: '507f1f77bcf86cd799439011', gameId: 1 },
      };
      
      cacheGetMock.mockResolvedValue(mockGameIntegration);
      
      const expectedResult = {
        ...mockEventWithDetails,
        customField: 'customValue',
        eventDetails: [
          {
            scheduleStartTs: mockEventDetail.scheduleStartTs,
            resultsAvailableTs: mockEventDetail.resultsAvailableTs,
            oddsAvailableTs: mockEventDetail.oddsAvailableTs,
            playlist: '',
            goalInfo: 'https://stream-server.example.com/goalInfo1.json',
            result: {},
            selections: mockEventDetail.selections,
            markets: []
          }
        ]
      };
      
      // Act
      const result = await service.mergeEventWithEventDetails(args);
      
      // Assert
      expect(result).toEqual(expectedResult);
    });
    
    it('should correctly handle undefined goalInfo value', async () => {
      // Arrange
      const mockEventDetail: EventDetail = {
        scheduleStartTs: new Date(),
        resultsAvailableTs: new Date(),
        oddsAvailableTs: new Date(),
        playlist: 'playlist1',
        goalInfo: undefined,
        selections: [],
        result: {}
      };
      
      const mockEventWithDetails = {
        ...mockEvent,
        eventDetails: [mockEventDetail]
      };
      
      const mockGameIntegration = {
        merge: { customField: 'customValue' },
        markets: [],
        streamServer: 'https://stream-server.example.com',
        videoExtension: 'mp4'
      };
      
      const args = {
        targets: mockEventWithDetails,
        query: { operatorId: '507f1f77bcf86cd799439011', gameId: 1 },
      };
      
      cacheGetMock.mockResolvedValue(mockGameIntegration);
      
      const expectedResult = {
        ...mockEventWithDetails,
        customField: 'customValue',
        eventDetails: [
          {
            scheduleStartTs: mockEventDetail.scheduleStartTs,
            resultsAvailableTs: mockEventDetail.resultsAvailableTs,
            oddsAvailableTs: mockEventDetail.oddsAvailableTs,
            playlist: 'https://stream-server.example.com/playlist1.mp4',
            goalInfo: '',
            result: {},
            selections: mockEventDetail.selections,
            markets: []
          }
        ]
      };
      
      // Act
      const result = await service.mergeEventWithEventDetails(args);
      
      // Assert
      expect(result).toEqual(expectedResult);
    });

    it('should correctly handle undefined streamServer value', async () => {
      // Arrange
      const mockEventDetail: EventDetail = {
        scheduleStartTs: new Date(),
        resultsAvailableTs: new Date(),
        oddsAvailableTs: new Date(),
        playlist: 'playlist1',
        goalInfo: 'goalInfo1',
        selections: [],
        result: {}
      };
      
      const mockEventWithDetails = {
        ...mockEvent,
        eventDetails: [mockEventDetail]
      };
      
      const mockGameIntegration = {
        merge: { customField: 'customValue' },
        markets: [],
        streamServer: undefined,
        videoExtension: 'mp4'
      };
      
      const args = {
        targets: mockEventWithDetails,
        query: { operatorId: '507f1f77bcf86cd799439011', gameId: 1 },
      };
      
      cacheGetMock.mockResolvedValue(mockGameIntegration);
      
      const expectedResult = {
        ...mockEventWithDetails,
        customField: 'customValue',
        eventDetails: [
          {
            scheduleStartTs: mockEventDetail.scheduleStartTs,
            resultsAvailableTs: mockEventDetail.resultsAvailableTs,
            oddsAvailableTs: mockEventDetail.oddsAvailableTs,
            playlist: 'playlist1.mp4',
            goalInfo: 'goalInfo1.json',
            result: {},
            selections: mockEventDetail.selections,
            markets: []
          }
        ]
      };
      
      // Act
      const result = await service.mergeEventWithEventDetails(args);
      
      // Assert
      expect(result).toEqual(expectedResult);
    });

    it('should correctly handle undefined videoExtension value', async () => {
      // Arrange
      const mockEventDetail: EventDetail = {
        scheduleStartTs: new Date(),
        resultsAvailableTs: new Date(),
        oddsAvailableTs: new Date(),
        playlist: 'playlist1',
        goalInfo: 'goalInfo1',
        selections: [],
        result: {}
      };
      
      const mockEventWithDetails = {
        ...mockEvent,
        eventDetails: [mockEventDetail]
      };
      
      const mockGameIntegration = {
        merge: { customField: 'customValue' },
        markets: [],
        streamServer: 'https://stream-server.example.com',
        videoExtension: undefined
      };
      
      const args = {
        targets: mockEventWithDetails,
        query: { operatorId: '507f1f77bcf86cd799439011', gameId: 1 },
      };
      
      cacheGetMock.mockResolvedValue(mockGameIntegration);
      
      const expectedResult = {
        ...mockEventWithDetails,
        customField: 'customValue',
        eventDetails: [
          {
            scheduleStartTs: mockEventDetail.scheduleStartTs,
            resultsAvailableTs: mockEventDetail.resultsAvailableTs,
            oddsAvailableTs: mockEventDetail.oddsAvailableTs,
            playlist: 'https://stream-server.example.com/playlist1',
            goalInfo: 'https://stream-server.example.com/goalInfo1.json',
            result: {},
            selections: mockEventDetail.selections,
            markets: []
          }
        ]
      };
      
      // Act
      const result = await service.mergeEventWithEventDetails(args);
      
      // Assert
      expect(result).toEqual(expectedResult);
    });
  });
}); 
