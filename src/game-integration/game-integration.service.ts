import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { GameIntegration, GameIntegrationDocument } from "./schema/game-integration.schema";
import { Model } from "mongoose";

interface MergeArgs {
  targets: any[],
  operatorId: string;
}

@Injectable()
export class GameIntegrationService {
  constructor(
    @InjectModel(GameIntegration.name)
    private readonly gameIntegrationMode: Model<GameIntegrationDocument>
  ) {}
  
  async mergeWithEvents(args: MergeArgs) {
    
  }

  private async getGameIntegrationByOperatorId(operatorId: string) {

  }

}
