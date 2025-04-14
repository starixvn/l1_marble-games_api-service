import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { SelectionSchema, Selection } from './selection.schema';

@Schema()
export class EventDetail {
  @Prop({ type: Date })
  scheduleStartTs: Date;

  @Prop({ type: Date })
  resultsAvailableTs: Date;

  @Prop({ type: Date })
  oddsAvailableTs: Date;

  @Prop({ type: String })
  playlist: string;

  @Prop({ type: String })
  goalInfo: string;

  @Prop({ type: [SelectionSchema] })
  selections: Array<Selection>;

  @Prop({ type: mongoose.Schema.Types.Mixed })
  result: Record<string, any>;
}

export const EventDetailSchema = SchemaFactory.createForClass(EventDetail);
