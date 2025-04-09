import { Prop, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { ObjectId } from "mongoose";
import { MergeSelection, MergeSelectionSchema } from "./merge-selection.schema";

export class MarketIntegration {
  @Prop({type: mongoose.Types.ObjectId})
  operatorId: ObjectId;

  @Prop({type: mongoose.Schema.Types.Mixed })
  merge: Record<string, any>;
  
  @Prop({ type: [MergeSelectionSchema]})
  selections: Array<MergeSelection>;
}

export type MarketIntegrationDocument = MarketIntegration & mongoose.Document;

export const MarketIntegrationSchema = SchemaFactory.createForClass(MarketIntegration);
