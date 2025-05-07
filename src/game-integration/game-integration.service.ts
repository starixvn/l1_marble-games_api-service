import { Injectable, Logger, LoggerService, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  GameIntegration,
} from './schema/game-integration.schema';
import { Model, Types } from 'mongoose';
import { MemoryCacheService } from '../cache/cache.service';
import { apply } from 'json-merge-patch';
import { MarketIntegration } from './schema/market-integration.schema';
import { Event } from '../events/schema/event.schema';
import { Selection } from '../events/schema/selection.schema';
import { MergeSelection } from './schema/merge-selection.schema';
import { EventDetail } from '../events/schema/event-detail.schema';
import { applyPatch, deepClone, validatePatch } from '../utils/json-patch';


interface GameIntegrationQuery {
  operatorId: string;
  gameId: number;
}

interface IntegrationArgs {
  targets: Partial<Event>;
  query: GameIntegrationQuery;
  forSchedule?: boolean;
}

@Injectable()
export class GameIntegrationService {
  constructor(
    @InjectModel(GameIntegration.name)
    private readonly gameIntegrationModel: Model<GameIntegration>,
    private readonly cacheService: MemoryCacheService,
    @Inject(Logger) private readonly logger: LoggerService,
  ) {}

  async processForScheduleEvents(args: IntegrationArgs) {
    const processed = await this.processEvent({...args, forSchedule: true});
    return apply(processed, {
      eventDetails: null
    });
  }

  async processEvent(args: IntegrationArgs) {
    const gameIntegration = await this.getGameIntegrationWithCache(args.query);
    const eventDetailMerged = await this.mergeEventWithEventDetails(args);
    const merged = this.mergeEventWithGameIntegration(eventDetailMerged, gameIntegration);
    return this.patchEventWithGameIntegration(merged, gameIntegration);
  }

  async mergeWithEvents(args: IntegrationArgs) {
    const gameIntegration =
      await this.getGameIntegrationWithCache(args.query);
    return this.mergeEventWithGameIntegration(args.targets, gameIntegration);
  }

  async patchEvent(args: IntegrationArgs) {
    const gameIntegration =
      await this.getGameIntegrationWithCache(args.query);
    return this.patchEventWithGameIntegration(args.targets, gameIntegration, args.forSchedule);
  }

  private mergeEventWithGameIntegration(target: Partial<Event>, gameIntegration: GameIntegration) {
    const merge = gameIntegration?.mergeEvent ?? {};
    return apply(target, merge);
  }

  private async patchEventWithGameIntegration(target: Partial<Event>, gameIntegration: GameIntegration, forSchedule: boolean = false) {
    const patches = gameIntegration?.patches ?? [];

    if (patches.length === 0) {
      return target;
    }
    let result = deepClone(target)
    
    for (const patch of patches) {
      if (forSchedule) {
        const path = patch.path;
        if (path.includes('eventDetails')) {
          continue;
        }
      }
      const patchError = validatePatch(result, patch);
      if (patchError) {
        this.logger.warn(`Patch error: ${patchError.message}`, GameIntegrationService.name);
        continue;
      }
      result = await applyPatch(result, patch);
    }

    return result;
  }

  async mergeEventWithEventDetails(args: IntegrationArgs) {
    const event = args.targets;
    const gameIntegration = await this.getGameIntegrationWithCache(args.query);
    const merge = gameIntegration?.mergeEvent ?? {};
    const eventDetails = (event.eventDetails ?? []) as EventDetail[];

    const mergedEventDetails = eventDetails.map((eventDetail, index) => this.composeMergedEventDetail(gameIntegration, eventDetail, index));

    const mergedEvent = apply(event, {
      eventDetails: mergedEventDetails,
    });

    return apply(mergedEvent, merge);
  }

  private composeMergedEventDetail(gameIntegration: GameIntegration, eventDetail: EventDetail, index: number) {
    
    const markets = this.composeMergedMarkets(gameIntegration, eventDetail.selections);
    
    const mergeEventDetails = gameIntegration?.mergeEventDetails?.[index] ?? {};
    return apply({ ...eventDetail,markets }, {
      ...mergeEventDetails
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

    return markets.map((market) => {
      const marketMergeCopy: Record<string, any> = JSON.parse(JSON.stringify((market as MarketIntegration)?.merge ?? {}));
      const marketSelectionsCopy: MergeSelection[] = JSON.parse(JSON.stringify((market as MarketIntegration)?.selections ?? []));
      
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
    return apply(apply(source, target), {
      name: null
    });
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
