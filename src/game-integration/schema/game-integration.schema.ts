import { Prop, SchemaFactory, Schema } from '@nestjs/mongoose';
import mongoose, { ObjectId, Document, Schema as MongooseSchema } from 'mongoose';
import { MarketIntegration } from './market_integration.schema';

@Schema()
export class GameIntegration {
  @Prop({ type: mongoose.Types.ObjectId })
  operatorId: ObjectId;

  @Prop({ type: Number })
  gameId: number;

  @Prop({ type: mongoose.Schema.Types.Mixed })
  merge: Record<string, any>;

  @Prop({ 
    type: [{ type: MongooseSchema.Types.ObjectId, ref: MarketIntegration.name }]
  })
  markets: Array<ObjectId | MarketIntegration>;

  @Prop({ type: [mongoose.Schema.Types.Mixed] })
  patches: Array<any>;

  @Prop({ type: String })
  streamServer: string;

  @Prop({ type: String })
  videoExtension: string;
}

export type GameIntegrationDocument = GameIntegration & Document<unknown>;

export const GameIntegrationSchema =
  SchemaFactory.createForClass(GameIntegration);
