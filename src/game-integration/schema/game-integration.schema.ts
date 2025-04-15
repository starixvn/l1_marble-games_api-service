import { Prop, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { ObjectId, Document } from 'mongoose';
import { MarketIntegration } from './market_integration.schema';

export class GameIntegration {
  @Prop({ type: mongoose.Types.ObjectId })
  operatorId: ObjectId;

  @Prop({ type: Number })
  gameId: number;

  @Prop({ type: mongoose.Schema.Types.Mixed })
  merge: Record<string, any>;

  @Prop({ type: [mongoose.Types.ObjectId], ref: MarketIntegration.name })
  markets: Array<ObjectId>;

  @Prop({ type: [mongoose.Schema.Types.Mixed] })
  patches: Array<any>;
}

export type GameIntegrationDocument = GameIntegration & Document<unknown>;

export const GameIntegrationSchema =
  SchemaFactory.createForClass(GameIntegration);
