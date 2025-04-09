import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { EventDetail } from './event-detail.schema';
import { Document, Schema as MongooseSchema, ObjectId } from 'mongoose';

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

  @Prop({
    type: [{ type: MongooseSchema.Types.ObjectId, ref: EventDetail.name }],
  })
  eventDetails: Array<ObjectId | EventDetail>;
}

export const EventSchema = SchemaFactory.createForClass(Event);
