import { Prop, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { ObjectId, Document } from "mongoose";

export class GameIntegration {
  @Prop({type: mongoose.Types.ObjectId })
  operatorId: ObjectId;

  @Prop({type: Number})
  gameId: number;

  @Prop({type: mongoose.Schema.Types.Mixed})
  merged: Record<string, any>;

  @Prop({type: [mongoose.Types.ObjectId]})
  markets: Array<ObjectId>

  @Prop({type: [mongoose.Schema.Types.Mixed]})
  patches: Array<any>
}

export type GameIntegrationDocument = Event & Document<unknown>;

export const GameIntegrationSchema = SchemaFactory.createForClass(GameIntegration);
