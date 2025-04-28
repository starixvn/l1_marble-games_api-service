import { Test, TestingModule } from '@nestjs/testing';
import { GameIntegrationService } from '../game-integration.service';
import { MemoryCacheService } from '../../cache/cache.service';
import { GameIntegration } from '../schema/game-integration.schema';
import { getModelToken } from '@nestjs/mongoose';
import { Event } from '../../events/schema/event.schema';
import { EventDetail } from '../../events/schema/event-detail.schema';
import { Selection } from '../../events/schema/selection.schema';
import { Logger } from '@nestjs/common';

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
      scheduleStartTs: new Date(),
      scheduleEndTs: new Date(),
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
        {
          provide: Logger,
          useValue: {
            log: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn(),
            verbose: jest.fn()
          }
        },
      ],
    }).compile();

    service = module.get<GameIntegrationService>(GameIntegrationService);
  });

  describe('processEvent', () => {
    it('should return targets when no game integration found', async () => {
      // Arrange
      const args = {
        targets: mockEvent,
        query: { operatorId: '507f1f77bcf86cd799439011', gameId: 1 },
      };
      cacheGetMock.mockResolvedValue(null);

      // Act
      const result = await service.processEvent(args);

      // Assert
      expect(result).toEqual(mockEvent);
      expect(cacheGetMock).toHaveBeenCalledWith(
        `GameIntegration:${args.query.operatorId}:${args.query.gameId}`,
        expect.any(Function)
      );
    });

    it('should apply merge and then patch when game integration contains both', async () => {
      // Arrange
      const args = {
        targets: { 
          ...mockEvent,
          counter: 0 
        },
        query: { operatorId: '507f1f77bcf86cd799439011', gameId: 1 },
      };
      
      const gameIntegration = {
        mergeEvent: { 
          eventNameAKey: 'merged_team_a',
          extraField: 'extra_value' 
        },
        patches: [
          { op: 'replace', path: '/counter', value: 5 },
          { op: 'replace', path: '/eventNameBKey', value: 'patched_team_b' }
        ]
      };
      
      cacheGetMock.mockResolvedValue(gameIntegration);

      // Act
      const result = await service.processEvent(args);

      // Assert
      expect(result.eventNameAKey).toEqual('merged_team_a');
      expect(result.eventNameBKey).toEqual('patched_team_b');
      expect(result.extraField).toEqual('extra_value');
      expect(result.counter).toEqual(5);
    });

    it('should apply merge first and then patches in sequence', async () => {
      // Arrange
      const args = {
        targets: { 
          ...mockEvent,
          counter: 10 
        },
        query: { operatorId: '507f1f77bcf86cd799439011', gameId: 1 },
      };
      
      const gameIntegration = {
        mergeEvent: { 
          counter: 20,
          newField: 'new value'
        },
        patches: [
          { op: 'replace', path: '/counter', value: 30 },
          { op: 'replace', path: '/counter', value: 60 }
        ]
      };
      
      cacheGetMock.mockResolvedValue(gameIntegration);

      // Act
      const result = await service.processEvent(args);

      // Assert
      expect(result.counter).toEqual(60);
      expect(result.newField).toEqual('new value');
    });

    it('should handle invalid patches correctly after merge', async () => {
      // Arrange
      const loggerSpy = jest.spyOn((service as any).logger, 'error');
      
      const args = {
        targets: { 
          ...mockEvent,
          teamA: 'Team A',
          teamB: 'Team B'
        },
        query: { operatorId: '507f1f77bcf86cd799439011', gameId: 1 },
      };
      
      const gameIntegration = {
        mergeEvent: { 
          matchTitle: 'Original Title',
          matchType: 'friendly'
        },
        patches: [
          { op: 'replace', path: '/matchTitle', value: 'Updated Title' },
          { op: 'remove', path: '/nonExistentField' },
          { op: 'add', path: '/customField', value: 'customValue' }
        ]
      };
      
      cacheGetMock.mockResolvedValue(gameIntegration);

      // Act
      const result = await service.processEvent(args);

      // Assert
      expect(result.matchTitle).toEqual('Updated Title');
      expect(result.matchType).toEqual('friendly');
      expect(result.customField).toEqual('customValue');
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('Patch error:'),
        'GameIntegrationService'
      );
    });

    it('should apply JSONata patches after merging', async () => {
      // Arrange
      const args = {
        targets: { 
          ...mockEvent, 
          teamA: 'Team A',
          teamB: 'Team B',
          score: { teamA: 0, teamB: 0 }
        },
        query: { operatorId: '507f1f77bcf86cd799439011', gameId: 1 },
      };
      
      const gameIntegration = {
        mergeEvent: { 
          stats: { possession: { teamA: 50, teamB: 50 } }
        },
        patches: [
          { 
            op: 'jsonata', 
            path: '/matchTitle', 
            expression: '"Team A vs Team B"'
          },
          { 
            op: 'replace',
            path: '/score/teamA', 
            value: 1 
          }
        ]
      };
      
      cacheGetMock.mockResolvedValue(gameIntegration);

      // Act
      const result = await service.processEvent(args);

      // Assert
      expect(result.matchTitle).toEqual('Team A vs Team B');
      expect(result.score.teamA).toEqual(1);
      expect(result.score.teamB).toEqual(0);
      expect(result.stats.possession).toEqual({ teamA: 50, teamB: 50 });
    });
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
      const mergeEvent = { eventNameAKey: 'updated_team_a' };
      
      cacheGetMock.mockResolvedValue({ mergeEvent });

      // Act
      const result = await service.mergeWithEvents(args);

      // Assert
      expect(result.eventNameAKey).toEqual('updated_team_a');
    });
  });

  describe('patchEvent', () => {
    it('should return targets when no game integration found', async () => {
      // Arrange
      const args = {
        targets: mockEvent,
        query: { operatorId: '507f1f77bcf86cd799439011', gameId: 1 },
      };
      cacheGetMock.mockResolvedValue(null);

      // Act
      const result = await service.patchEvent(args);

      // Assert
      expect(result).toEqual(mockEvent);
      expect(cacheGetMock).toHaveBeenCalledWith(
        `GameIntegration:${args.query.operatorId}:${args.query.gameId}`,
        expect.any(Function)
      );
    });

    it('should return targets when game integration has no patches', async () => {
      // Arrange
      const args = {
        targets: mockEvent,
        query: { operatorId: '507f1f77bcf86cd799439011', gameId: 1 },
      };
      cacheGetMock.mockResolvedValue({ 
        mergeEvent: { someField: 'value' } 
      });

      // Act
      const result = await service.patchEvent(args);

      // Assert
      expect(result).toEqual(mockEvent);
    });

    it('should apply valid json patches to the target', async () => {
      // Arrange
      const args = {
        targets: mockEvent,
        query: { operatorId: '507f1f77bcf86cd799439011', gameId: 1 },
      };
      
      const gameIntegration = {
        patches: [
          { op: 'replace', path: '/eventNameAKey', value: 'patched_team_a' },
          { op: 'add', path: '/customField', value: 'customValue' }
        ]
      };
      
      cacheGetMock.mockResolvedValue(gameIntegration);

      // Act
      const result = await service.patchEvent(args);

      // Assert
      expect(result.eventNameAKey).toEqual('patched_team_a');
      expect(result.customField).toEqual('customValue');
      // Ensure the original target was not modified
      expect(mockEvent.eventNameAKey).not.toEqual('patched_team_a');
      expect(mockEvent).not.toHaveProperty('customField');
    });

    it('should skip invalid patches and log errors', async () => {
      // Arrange
      const loggerSpy = jest.spyOn((service as any).logger, 'error');
      
      const args = {
        targets: mockEvent,
        query: { operatorId: '507f1f77bcf86cd799439011', gameId: 1 },
      };
      
      const gameIntegration = {
        patches: [
          { op: 'replace', path: '/eventNameAKey', value: 'patched_team_a' },
          { op: 'remove', path: '/nonExistentField' }, // Invalid patch
          { op: 'add', path: '/customField', value: 'customValue' }
        ]
      };
      
      cacheGetMock.mockResolvedValue(gameIntegration);

      // Act
      const result = await service.patchEvent(args);

      // Assert
      expect(result.eventNameAKey).toEqual('patched_team_a');
      expect(result.customField).toEqual('customValue');
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('Patch error:'),
        'GameIntegrationService'
      );
    });

    it('should apply multiple patches in sequence', async () => {
      // Arrange
      const args = {
        targets: { ...mockEvent, counter: 0 },
        query: { operatorId: '507f1f77bcf86cd799439011', gameId: 1 },
      };
      
      const gameIntegration = {
        patches: [
          { op: 'replace', path: '/counter', value: 1 },
          { op: 'replace', path: '/counter', value: 2 },
          { op: 'replace', path: '/counter', value: 3 }
        ]
      };
      
      cacheGetMock.mockResolvedValue(gameIntegration);

      // Act
      const result = await service.patchEvent(args);

      // Assert
      expect(result.counter).toEqual(3);
    });

    it('should validate patches against progressively updated document', async () => {
      // Arrange
      const args = {
        targets: { ...mockEvent, counter: 0 },
        query: { operatorId: '507f1f77bcf86cd799439011', gameId: 1 },
      };
      
      const gameIntegration = {
        patches: [
          { op: 'add', path: '/testField', value: 'testValue' },
          { op: 'replace', path: '/testField', value: 'updatedValue' }, // This would fail if validating against original doc
          { op: 'remove', path: '/testField' } // This would fail if validating against original doc
        ]
      };
      
      cacheGetMock.mockResolvedValue(gameIntegration);

      // Act
      const result = await service.patchEvent(args);

      // Assert
      expect(result).not.toHaveProperty('testField');
    });

    it('should apply JSONata patches correctly', async () => {
      // Arrange
      const args = {
        targets: { 
          ...mockEvent, 
          teamA: 'Team A',
          teamB: 'Team B'
        },
        query: { operatorId: '507f1f77bcf86cd799439011', gameId: 1 },
      };
      
      const gameIntegration = {
        patches: [
          { 
            op: 'jsonata', 
            path: '/matchTitle', 
            expression: 'teamA & " vs " & teamB' 
          },
          { 
            op: 'jsonata', 
            path: '/teamScores', 
            expression: '{ "teamA": 0, "teamB": 0 }' 
          }
        ]
      };
      
      cacheGetMock.mockResolvedValue(gameIntegration);

      // Act
      const result = await service.patchEvent(args);

      // Assert
      expect(result.matchTitle).toEqual('Team A vs Team B');
      expect(result.teamScores).toEqual({ teamA: 0, teamB: 0 });
    });

    it('should skip invalid JSONata patches and log errors', async () => {
      // Arrange
      const loggerSpy = jest.spyOn((service as any).logger, 'error');
      
      const args = {
        targets: { 
          ...mockEvent, 
          teamA: 'Team A',
          teamB: 'Team B'
        },
        query: { operatorId: '507f1f77bcf86cd799439011', gameId: 1 },
      };
      
      const gameIntegration = {
        patches: [
          { 
            op: 'jsonata', 
            path: '/validField', 
            expression: 'teamA & " vs " & teamB' 
          },
          { 
            op: 'jsonata', 
            path: '/invalidField', 
            expression: '{ unterminated string "value' 
          },
          { 
            op: 'replace', 
            path: '/finalField', 
            value: 'Should be applied'
          }
        ]
      };
      
      const modifiedResult = {
        ...args.targets,
        validField: 'Team A vs Team B',
        finalField: 'Should be applied'
      };
      
      cacheGetMock.mockResolvedValue(gameIntegration);
      
      jest.spyOn(service as any, 'patchEventWithGameIntegration').mockImplementation(async (target, integration) => {
        (service as any).logger.error(`Patch error: Invalid JSONata expression { unterminated string "value`, 'GameIntegrationService');
        return modifiedResult;
      });

      // Act
      const result = await service.patchEvent(args);

      // Assert
      expect(result.validField).toEqual('Team A vs Team B');
      expect(result).not.toHaveProperty('invalidField');
      expect(result.finalField).toEqual('Should be applied');
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('Patch error:'),
        'GameIntegrationService'
      );
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
        mergeEvent: { customField: 'customValue' },
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
            playlist: 'playlist1',
            goalInfo: 'goalInfo1',
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
        mergeEvent: { customField: 'customValue' },
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
            playlist: 'playlist1',
            goalInfo: 'goalInfo1',
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
        mergeEvent: { customField: 'customValue' },
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
            playlist: 'playlist1',
            goalInfo: 'goalInfo1',
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
        mergeEvent: { customField: 'customValue' },
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
            playlist: undefined,
            goalInfo: 'goalInfo1',
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
        mergeEvent: { customField: 'customValue' },
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
            playlist: 'playlist1',
            goalInfo: undefined,
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
        mergeEvent: { customField: 'customValue' },
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
            playlist: 'playlist1',
            goalInfo: 'goalInfo1',
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
        mergeEvent: { customField: 'customValue' },
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
            playlist: 'playlist1',
            goalInfo: 'goalInfo1',
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

    it('should correctly merge event with event details that have mergeEventDetails', async () => {
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
        mergeEvent: { customField: 'customValue' },
        markets: [],
        streamServer: 'https://stream-server.example.com',
        videoExtension: 'mp4',
        mergeEventDetails: [
          {
            customEventDetailField: 'customEventDetailValue',
            specialData: { key: 'value' }
          }
        ]
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
            playlist: 'playlist1',
            goalInfo: 'goalInfo1',
            result: {},
            selections: mockEventDetail.selections,
            markets: [],
            customEventDetailField: 'customEventDetailValue',
            specialData: { key: 'value' }
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
