import mongoose from 'mongoose';
import { GameIntegration, GameIntegrationSchema } from "../../src/game-integration/schema/game-integration.schema";
import { MarketIntegration, MarketIntegrationSchema } from "../../src/game-integration/schema/market-integration.schema";
import { sleep } from './timing';

async function tryConnect() {
  if (mongoose.connection.readyState !== 1) {
    if (!process.env.DATABASE_URI) {
        throw new Error('DATABASE_URI environment variable is not set');
    }
    await mongoose.connect(process.env.DATABASE_URI);
  }
}

async function closeConnection() {
  await mongoose.connection.close();
  await sleep(50);
}

export async function setupGameIntegrationForTest(
    operatorId: string,
    mergeEvent: Record<string, any> = {},
    patches: Array<any> = [],
    mergeEventDetails: Array<any> = []
): Promise<void> {
    try {
        await tryConnect();

        const GameIntegrationModel = mongoose.connection.model<GameIntegration>(
            'GameIntegration', GameIntegrationSchema, 'game_integrations'
        );

        const baseUpdate = {
            mergeEvent,
            patches,
            mergeEventDetails
        };

        const query = { operatorId: new mongoose.Types.ObjectId(operatorId), gameId: 1 };
        
        await GameIntegrationModel.updateOne(
            query,
            { $set: baseUpdate },
        );
 
    } finally {
        await closeConnection();
    }
} 

export async function setupMarketIntegrationForTest(
    objectId: string,
    merge: Record<string, any>,
    selections: Array<any>
): Promise<void> {
    try {
        await tryConnect();
        
        const collection = mongoose.connection.collection('market_integrations');

        
        await collection.updateOne(
            { _id: new mongoose.Types.ObjectId(objectId) },
            { 
                $set: { 
                    merge,
                    selections
                } 
            }
        );
    } finally {
        await closeConnection();
    }
}

export async function getMarketIntegrations(operatorId: string) {
  try {
    await tryConnect();

    const MarketIntegrationModel = mongoose.connection.model<MarketIntegration>(
      'MarketIntegration', MarketIntegrationSchema, 'market_integrations'
    );

    const marketIntegrations = await MarketIntegrationModel.find({ operatorId: new mongoose.Types.ObjectId(operatorId) });
    return marketIntegrations;
  } finally {
    await closeConnection();
  }
}
