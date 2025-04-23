const CONNECTION_STRING = process.env.DATABASE_URI;
import mongoose from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { Operator, OperatorSchema } from '../../../src/operator/schema/operator.schema';
import { 
  GameIntegration, 
  GameIntegrationSchema 
} from '../../../src/game-integration/schema/game-integration.schema';
import { 
  MarketIntegration, 
  MarketIntegrationSchema 
} from '../../../src/game-integration/schema/market-integration.schema';
import {
  Event,
  EventSchema
} from '../../../src/events/schema/event.schema';
import {
  EventDetail,
  EventDetailSchema
} from '../../../src/events/schema/event-detail.schema';

global.__CREDENTIALS__ ??= [];

async function connectToDatabase() {
  try {
    if (!CONNECTION_STRING) {
      throw new Error('DATABASE_URI environment variable is not set');
    }

    await mongoose.connect(CONNECTION_STRING);
    
    console.log('Connected to MongoDB successfully');
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}

type OperatorDocument = mongoose.Document<unknown, {}, Operator> & Operator & {
  _id: mongoose.Types.ObjectId;
} & {
  __v: number;
};

async function createOperator() {
  const OperatorModel = mongoose.connection.model<Operator>('Operator', OperatorSchema);
  
  const randomPassword = Math.random().toString(36).substring(2, 10) + 
    Math.random().toString(36).substring(2, 10);
  
  const salt = 10;
  const hashedPassword = await bcrypt.hash(randomPassword, salt);
  
  const operator = new OperatorModel({
    password: hashedPassword,
  });
  
  const savedOperator = await operator.save();
  
  global.__CREDENTIALS__.push({
    password: randomPassword,
    operatorId: savedOperator._id.toString(),
  });
  
  console.log(`Created operator with ID: ${savedOperator._id.toString()}`);
  
  return savedOperator;
}

async function createGameAndMarketIntegration(operator: OperatorDocument) {
  const MarketIntegrationModel = mongoose.connection.model<MarketIntegration>(
    'MarketIntegration', MarketIntegrationSchema, 'market_integrations'
  );
  const GameIntegrationModel = mongoose.connection.model<GameIntegration>(
    'GameIntegration', GameIntegrationSchema, 'game_integrations'
  );

  const marketIntegrationData = {
    merge: {
      marketID: 4,
      marketNameKey: "MARKET_1X2",
      marketName: "1X2"
    },
    selections: [
      {
        selectionID: 1,
        column: 1,
        selectionOrder: 1,
        selectionNameLongKey: "HOME",
        name: "HOME"
      },
      {
        selectionID: 2,
        column: 2,
        selectionOrder: 1,
        selectionNameLongKey: "AWAY",
        name: "AWAY"
      },
      {
        selectionID: 3,
        column: 3,
        selectionOrder: 1,
        selectionNameLongKey: "TIE",
        name: "DRAW"
      }
    ]
  };

  const marketIntegration = new MarketIntegrationModel({
    ...marketIntegrationData,
    operatorId: operator._id, 
  });
  const savedMarketIntegration = await marketIntegration.save();
  console.log(`Created market integration with ID: ${savedMarketIntegration._id.toString()}`);

  const gameIntegrationData = {
    gameId: 1,
    mergeEvent: {
    },
    mergeEventDetails: [
    ],
    patches: [
    ]
  };

  const gameIntegration = new GameIntegrationModel({
    ...gameIntegrationData,
    operatorId: operator._id,
    markets: [savedMarketIntegration._id]
  });
  
  await gameIntegration.save();
  console.log(`Created game integration with ID: ${gameIntegration._id.toString()} linked to market ${savedMarketIntegration._id.toString()}`);
}

async function createEventAndEventDetails() {
  const EventModel = mongoose.connection.model<Event>(
    'Event', EventSchema, 'events'
  );
  const EventDetailModel = mongoose.connection.model<EventDetail>(
    'EventDetail', EventDetailSchema, 'event_details'
  );

  const eventDetailsData = [
    {
      eventId: 1,
      scheduleStartTs: new Date("2025-03-13T10:23:14.527Z"),
      resultsAvailableTs: new Date("2025-03-13T10:24:14.527Z"),
      playlist: "529722ee2e00df1acf61aa94f8194ab24f98ce7325c571f4efda68e57e6a24d2",
      goalInfo: "529722ee2e00df1acf61aa94f8194ab24f98ce7325c571f4efda68e57e6a24d2",
      selections: [
        { selectionID: 1, name: "HOME", price: 2.28, point: 0, settlementStatus: "W" },
        { selectionID: 2, name: "AWAY", price: 2.28, point: 0, settlementStatus: "L" }
      ],
      result: "2-0",
      oddsAvailableTs: new Date("2025-03-13T10:23:10.527Z")
    },
    {
      eventId: 1,
      scheduleStartTs: new Date("2025-03-13T10:24:14.527Z"),
      oddsAvailableTs: new Date("2025-03-13T10:24:10.527Z"),
      resultsAvailableTs: new Date("2025-03-13T10:25:14.527Z"),
      playlist: "529722ee2e00df1acf61aa94f8194ab24f98ce7325c571f4efda68e57e6a24d2",
      goalInfo: "529722ee2e00df1acf61aa94f8194ab24f98ce7325c571f4efda68e57e6a24d2",
      selections: [
        { name: "HOME_WIN", price: 1.24, point: 0, settlementStatus: "W" },
        { name: "AWAY_WIN", price: 4.47, point: 0, settlementStatus: "L" }
      ],
      result: "1-1"
    }
  ];

  const savedEventDetails = await EventDetailModel.insertMany(eventDetailsData);
  console.log(`Created ${savedEventDetails.length} event details.`);
  const eventDetailIds = savedEventDetails.map(detail => detail._id);

  const eventsData = [
    {
      eventID: 1,
      eventNameAKey: "Vietnam",
      eventNameBKey: "Cambodia",
      gameId: 1,
      eventDetails: eventDetailIds,
      startTime: new Date("2025-03-13T10:23:14.527Z"),
      endTime: new Date("2025-03-13T10:25:14.527Z")
    },
    {
      eventID: 2,
      eventNameAKey: "Thailand",
      eventNameBKey: "Laos",
      gameId: 1,
      eventDetails: [],
      startTime: new Date("2025-03-13T10:27:14.527Z"),
      endTime: new Date("2025-03-13T10:29:14.527Z")
    }
  ];

  const savedEvents = await EventModel.insertMany(eventsData);
  console.log(`Created ${savedEvents.length} events from JSON.`);

  const now = new Date();
  const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
  const thirdEventData = {
      eventID: 3, 
      eventNameAKey: "Live Event",
      eventNameBKey: "Test",
      gameId: 1,
      eventDetails: [],
      startTime: now,
      endTime: oneHourLater
  };
  const thirdEvent = new EventModel(thirdEventData);
  await thirdEvent.save();
  console.log(`Created live event with ID: ${thirdEvent._id.toString()}`);
}

function getCredentials() {
  return [...global.__CREDENTIALS__];
}

async function closeDatabaseConnection() {
  await mongoose.connection.close();
}

async function clearDatabase() {
  const connection = mongoose.connection;
  if (!connection) {
    throw new Error('Database connection not established. Call connectToDatabase first.');
  }

  try {
    if (!connection.db) {
      throw new Error('Database instance not found in connection');
    }
    
    const collections = await connection.db.collections();
    
    const clearPromises = collections.map(collection => 
      collection.drop().catch(err => {
        if (err.message !== 'ns not found') {
          throw err;
        }
      })
    );
    
    await Promise.all(clearPromises);
    console.log('Database cleared successfully - all collections dropped');
    
    global.__CREDENTIALS__ = [];
  } catch (error) {
    console.error('Failed to clear database:', error);
    throw error;
  }
}

async function setupDatabaseStub() {
  await connectToDatabase();  
  await clearDatabase();
  const operator = await createOperator();
  await createGameAndMarketIntegration(operator);
  await createEventAndEventDetails();
  await closeDatabaseConnection();
}

export { getCredentials, setupDatabaseStub };
