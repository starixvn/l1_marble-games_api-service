import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EventDetail, EventDetailSchema } from './schema/event-detail.schema';
import { EventService } from './events.service';
import { EventSchema, Event } from './schema/event.schema';
import { EventsController } from './events.controller';

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
  controllers: [EventsController],
  providers: [EventService],
  exports: [EventService],
})
export class EventModule {}
