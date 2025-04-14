import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  GameIntegration,
  GameIntegrationDocument,
} from './schema/game-integration.schema';
import { Model, Types } from 'mongoose';
import { MemoryCacheService } from '../cache/cache.service';
import { apply } from 'json-merge-patch';

interface GameIntegrationQuery {
  operatorId: string;
  gameId: number;
}

interface MergeArgs {
  targets: any;
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
    const cacheKey = this.composeCacheKey(args);
    const gameIntegration =
      await this.cacheService.get<GameIntegrationDocument>(cacheKey, () =>
        this.getGameIntegrationFromDb(args.query),
      );

    const merge = gameIntegration?.merge;

    if (!merge) {
      return args.targets;
    }

    return apply(args.targets, merge);
  }

  private composeCacheKey(args: MergeArgs) {
    return `${GameIntegration.name}:${args.query.operatorId}:${args.query.gameId}`;
  }

  private async getGameIntegrationFromDb(
    args: GameIntegrationQuery,
  ): Promise<GameIntegrationDocument | null> {
    return this.gameIntegrationModel
      .findOne({
        operatorId: new Types.ObjectId(args.operatorId),
        gameId: args.gameId,
      })
      .lean()
      .exec();
  }
}
