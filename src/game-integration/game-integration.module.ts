import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  GameIntegration,
  GameIntegrationSchema,
} from './schema/game-integration.schema';
import {
  MarketIntegration,
  MarketIntegrationSchema,
} from './schema/market-integration.schema';
import { CacheModule } from '../cache/cache.module';
import { GameIntegrationService } from './game-integration.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: GameIntegration.name,
        schema: GameIntegrationSchema,
        collection: 'game_integrations',
      },
      {
        name: MarketIntegration.name,
        schema: MarketIntegrationSchema,
        collection: 'market_integrations',
      },
    ]),
    CacheModule,
  ],
  providers: [GameIntegrationService],
  exports: [GameIntegrationService],
})
export class GameIntegrationModule {}
