import { Model } from "mongoose";
import { EventService } from "../events.service"
import { Event, EventDocument } from "../schema/event.schema";
import { Test, TestingModule } from "@nestjs/testing";
import { getModelToken } from "@nestjs/mongoose";

describe("EventService", () => {
  let service: EventService;
  let eventModel: any;

  beforeEach(async () => {
    eventModel = {
      find: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventService,
        {
          provide: getModelToken(Event.name),
          useValue: eventModel
        }
      ]
    }).compile();

    service = module.get<EventService>(EventService);
  })

  describe("getEventByTimeSpan", () => {
    it("should call model to get events within startTime and endTime", async () => {
      // Arrange
      const events = [
        {
          "eventID"              : 1,
          "eventNameAKey"        : "Thailand" ,
          "eventNameBKey"        : "Laos",
          "gameId"               : 1,
          "eventDetails"         : [],
          "startTime"            : new Date("2025-03-13T10:27:15.527Z"),
          "endTime"              : new Date("2025-03-13T10:29:14.527Z"),
        },
        {
          "eventID"              : 2,
          "eventNameAKey"        : "Thailand" ,
          "eventNameBKey"        : "Vietnam",
          "gameId"               : 1,
          "eventDetails"         : [],
          "startTime"            : new Date("2025-03-13T10:29:15.527Z"),
          "endTime"              : new Date("2025-03-13T10:31:14.527Z"),
        },
      ]

      const query = {
        startTime: new Date("2025-03-13T10:29:15.527Z"),
        endTime: new Date("2025-03-13T10:29:15.527Z")
      };
      const expectedQueryCalled = {
        startTime: {
          $gte: query.startTime,
          $lte: query.endTime,
        },
      };

      const projection = 
      {
        eventDetails: 0,
      };

      eventModel.find.mockReturnValue({
        lean: jest
          .fn()
          .mockReturnValue({
            exec: jest.fn().mockResolvedValue(events)
          })
      });

      // Act 
      const result = await service.getEventByTimeSpan(query)

            
      // Assert
      expect(result).toEqual(events);
      expect(eventModel.find).toHaveBeenCalledWith(
        expectedQueryCalled,
        projection
      )
    })

  })
})
