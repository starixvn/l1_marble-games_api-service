import mongoose from 'mongoose';
import { GameIntegration, GameIntegrationSchema } from "../../src/game-integration/schema/game-integration.schema";
import { MarketIntegration, MarketIntegrationSchema } from "../../src/game-integration/schema/market-integration.schema";

async function tryConnect() {
  if (mongoose.connection.readyState !== 1) {
    if (!process.env.DATABASE_URI) {
        throw new Error('DATABASE_URI environment variable is not set');
    }
    console.log('Connecting to database... ', process.env.DATABASE_URI);
    await mongoose.connect(process.env.DATABASE_URI);
  }
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
 
        console.log(`Updated game integration for operator ID: ${operatorId}`);
    } catch (error) {
        console.error('Failed to update game integration:', error);
        throw error;
    } finally {
        await mongoose.connection.close();
    }
} 

export async function setupMarketIntegrationForTest(
    operatorId: string,
    objectId: string,
    merge: Record<string, any>,
    selections: Array<any>
): Promise<void> {
    try {
        await tryConnect();

        const MarketIntegrationModel = mongoose.connection.model<MarketIntegration>(
            'MarketIntegration', MarketIntegrationSchema, 'market_integrations'
        );

        await MarketIntegrationModel.updateOne(
            { operatorId: new mongoose.Types.ObjectId(operatorId), _id: new mongoose.Types.ObjectId(objectId) },
            {
                $set: {
                    merge,
                    selections
                }
            }
        );

        console.log(`Updated market integration for operator ID: ${operatorId}, object ID: ${objectId}`);
    } catch (error) {
        console.error('Failed to update market integration:', error);
        throw error;
    } finally {
        await mongoose.connection.close();
    }
}
