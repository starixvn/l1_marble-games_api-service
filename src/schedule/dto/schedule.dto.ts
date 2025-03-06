import { ApiProperty } from '@nestjs/swagger';

export class ScheduleEventDto {
  @ApiProperty({
    description: 'Unique identifier of the event',
    example: 'evt-1623456789-1',
  })
  id: string;

  @ApiProperty({
    description: 'Title of the event',
    example: 'Event #1',
  })
  title: string;

  @ApiProperty({
    description: 'Description of the event',
    example: 'Generated at 2023-06-12T10:30:00.000Z',
  })
  description: string;
}
