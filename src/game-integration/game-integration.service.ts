import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  GameIntegration,
} from './schema/game-integration.schema';
import { Model, Types } from 'mongoose';
import { MemoryCacheService } from '../cache/cache.service';
import { apply } from 'json-merge-patch';
import { MarketIntegrationDocument } from './schema/market-integration.schema';
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
    private readonly gameIntegrationModel: Model<GameIntegration>,
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
    const event = args.targets;
    const gameIntegration = await this.getGameIntegrationWithCache(args.query);
    const merge = gameIntegration?.merge ?? {};
    const eventDetails = event.eventDetails as EventDetail[];

    const mergedEventDetails = eventDetails.map(eventDetail => this.composeMergedEventDetail(gameIntegration, eventDetail));
    
    const mergedEvent = apply(event, {
      eventDetails: mergedEventDetails,
    });

    return apply(mergedEvent, merge);
  }

  private composeMergedEventDetail(gameIntegration: GameIntegration, eventDetail: EventDetail) {
    
    const markets = this.composeMergedMarkets(gameIntegration, eventDetail.selections);
    const liveServer = gameIntegration.streamServer ? `${gameIntegration.streamServer}/` : "";
    const videoExtension = gameIntegration.videoExtension ? `.${gameIntegration.videoExtension}` : "";
    const playlist = eventDetail.playlist ? `${liveServer}${eventDetail.playlist}${videoExtension}` : "";
    const goalInfo = eventDetail.goalInfo ? `${liveServer}${eventDetail.goalInfo}.json` : "";
    
    return apply({ ...eventDetail,
      playlist,
      goalInfo
    }, {
      markets,
    })
  }

  private composeMergedMarkets(gameIntegration: GameIntegration, selections: Selection[] = []) {
    const markets = gameIntegration?.markets;
    if (!markets || markets.length === 0) {
      return [];
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
    return this.cacheService.get<GameIntegration>(cacheKey, () =>
        this.getGameIntegrationFromDb(query),
      );
  }

  private composeCacheKey(query: GameIntegrationQuery, modelName: string) {
    return `${modelName}:${query.operatorId}:${query.gameId}`;
  }

  private async getGameIntegrationFromDb(
    args: GameIntegrationQuery,
  ): Promise<GameIntegration | null> {
    return this.gameIntegrationModel
      .findOne({
        operatorId: new Types.ObjectId(args.operatorId),
        gameId: args.gameId,
      })
      .populate('markets', '-_id -operatorId')
      .lean()
      .exec();
  }
}
