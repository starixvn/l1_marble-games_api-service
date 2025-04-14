import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { EventDocument, Event } from './schema/event.schema';
import { Model } from 'mongoose';

export type EventQueryOptions = {
  startTime: Date;
  endTime: Date;
};

@Injectable()
export class EventService {
  constructor(
    @InjectModel(Event.name)
    private readonly eventModel: Model<EventDocument>,
  ) {}

  async getEventByTimeSpan(query: EventQueryOptions) {
    return this.eventModel
      .find(
        {
          startTime: {
            $gte: query.startTime,
            $lte: query.endTime,
          },
        },
        {
          eventDetails: 0,
        },
      )
      .lean()
      .exec();
  }

  async getEventById(eventId: number) {
    const event = await this.eventModel
      .findOne({ eventID: eventId }, { _id: 0 })
      .populate('eventDetails', '-_id')
      .lean()
      .exec();
    
    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }
    
    return event;
  }
}
