import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  GameIntegration,
  GameIntegrationDocument,
} from './schema/game-integration.schema';
import { Model, Types } from 'mongoose';
import { MemoryCacheService } from '../cache/cache.service';
import { apply } from 'json-merge-patch';
import { MarketIntegrationDocument } from './schema/market_integration.schema';
import { Event } from '../events/schema/event.schema';
import { Selection } from '../events/schema/selection.schema';
import { MergeSelection } from './schema/merge-selection.schema';
import { EventDetail } from '../events/schema/event-detail.schema';
interface GameIntegrationQuery {
  operatorId: string;
  gameId: number;
}

interface MergeArgs {
  targets: Partial<Event>;
  query: GameIntegrationQuery;
}

@Injectable()
export class GameIntegrationService {
  constructor(
    @InjectModel(GameIntegration.name)
    private readonly gameIntegrationModel: Model<GameIntegrationDocument>,
    private readonly cacheService: MemoryCacheService,
  ) {}

  async mergeWithEvents(args: MergeArgs) {
    const gameIntegration =
      await this.getGameIntegrationWithCache(args.query);

    const merge = gameIntegration?.merge;

    if (!merge) {
      return args.targets;
    }

    return apply(args.targets, merge);
  }

  async mergeEventWithEventDetails(args: MergeArgs) {
    const mergedEvent = await this.mergeWithEvents(args);
    const gameIntegration = await this.getGameIntegrationWithCache(args.query);
    
    const eventDetails = mergedEvent.eventDetails as EventDetail[];

    const mergedEventDetails: any[] = []

    for (const eventDetail of eventDetails) {
      const mergedEventDetail = this.composeMergedEventDetail(gameIntegration, eventDetail);
      mergedEventDetails.push(mergedEventDetail);
    }
      
    return apply(mergedEvent, {
      eventDetails: mergedEventDetails,
    });
  }

  private composeMergedEventDetail(gameIntegration: GameIntegrationDocument, eventDetail: EventDetail) {
    
    const markets = this.composeMergedMarkets(gameIntegration, eventDetail.selections);
    
    const result = apply(eventDetail, {
      markets,
      selections: null,
    })
    
    return result;
  }

  private composeMergedMarkets(gameIntegration: GameIntegrationDocument, selections: Selection[] = []) {
    const markets = gameIntegration?.markets;
    if (selections.length === 0) {
      return selections;
    }

    const selectionMap = {}

    for (const selection of selections) {
      selectionMap[selection.name] = selection;
    }

    return (markets as MarketIntegrationDocument[]).map(market => {
      const marketMergeCopy: Record<string, any> = JSON.parse(JSON.stringify(market.merge || {}));
      const marketSelectionsCopy: MergeSelection[] = JSON.parse(JSON.stringify(market.selections || []));
      
      return apply(marketMergeCopy, {
        selections: marketSelectionsCopy
          .map(selection => {
            const target = selectionMap[selection.name];
            return target ? this.composeMergedSelection(selection, target) : null;
          })
          .filter(selection => selection)
      })
    })
  }

  private composeMergedSelection(source: MergeSelection, target: Selection) {
    return apply(source, target);
  }

  private async getGameIntegrationWithCache(query: GameIntegrationQuery) {
    const cacheKey = this.composeCacheKey(query, GameIntegration.name);
    return await this.cacheService.get<GameIntegrationDocument>(cacheKey, () =>
        this.getGameIntegrationFromDb(query),
      );
  }

  private composeCacheKey(query: GameIntegrationQuery, modelName: string) {
    return `${modelName}:${query.operatorId}:${query.gameId}`;
  }

  private async getGameIntegrationFromDb(
    args: GameIntegrationQuery,
  ): Promise<GameIntegrationDocument | null> {
    const result = await this.gameIntegrationModel
      .findOne({
        operatorId: new Types.ObjectId(args.operatorId),
        gameId: args.gameId,
      })
      .populate('markets', '-_id -operatorId')
      .lean()
      .exec();
    return result;
  }
}
