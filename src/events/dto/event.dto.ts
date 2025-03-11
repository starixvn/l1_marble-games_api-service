import { ScheduleEventItemDto } from 'src/schedule/dto/schedule.dto';
import { EventDetailDto } from './event-detail.dto';
import { ApiProperty } from '@nestjs/swagger';

export class EventDto extends ScheduleEventItemDto {
  @ApiProperty({
    description: 'Detail of each half in the round',
    type: [EventDetailDto],
  })
  eventDetails: Array<EventDetailDto>;
}
