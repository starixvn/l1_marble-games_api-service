import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { EventDocument } from './schema/event.schema';
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
}
