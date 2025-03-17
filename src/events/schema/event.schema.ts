import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { EventDetailSchema, EventDetail } from './event-detail.schema';
import { Document } from 'mongoose';

export type EventDocument = Event & Document<unknown>;

@Schema()
export class Event {
  @Prop({ type: Number })
  eventID: number;

  @Prop({ type: String })
  eventNameAKey: string;

  @Prop({ type: String })
  eventNameBKey: string;

  @Prop({ type: Number })
  gameId: number;

  @Prop({ type: Date })
  startTime: Date;

  @Prop({ type: Date })
  endTime: Date;

  @Prop({ type: [EventDetailSchema] })
  eventDetails: Array<EventDetail>;
}

export const EventSchema = SchemaFactory.createForClass(Event);
