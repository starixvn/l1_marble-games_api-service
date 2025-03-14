import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { Document } from "mongoose";

export type LogRecordDocument = LogRecord & Document<unknown>

@Schema()
export class LogRecord {
  @Prop({ type: mongoose.Schema.Types.Mixed})
  request: object;
  @Prop({ type: mongoose.Schema.Types.Mixed})
  response: object;
}

export const LogRecordSchema = SchemaFactory.createForClass(LogRecord);
