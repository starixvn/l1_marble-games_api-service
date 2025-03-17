import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EventSchema } from './schema/event.schema';
import { EventService } from './events.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Event.name,
        schema: EventSchema,
        collection: 'events',
      },
    ]),
  ],
  providers: [EventService],
  exports: [EventService],
})
export class EventModule {}
