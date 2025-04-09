import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EventSchema } from './schema/event.schema';
import { EventDetailSchema } from './schema/event-detail.schema';
import { EventService } from './events.service';
import { Event } from './schema/event.schema';
import { EventDetail } from './schema/event-detail.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Event.name,
        schema: EventSchema,
        collection: 'events',
      },
      {
        name: EventDetail.name,
        schema: EventDetailSchema,
        collection: 'event_details',
      },
    ]),
  ],
  providers: [EventService],
  exports: [EventService],
})
export class EventModule {}
