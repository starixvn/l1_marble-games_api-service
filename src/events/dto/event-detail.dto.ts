import { ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { MarketDto } from './market.dto';
import { ResultDto } from './result.dto';

export class EventDetailDto {
  @ApiProperty({
    description:
      'Start time of the scheduled eent. Close odds and preparing for live stream',
    example: new Date('2025-02-25T10:48:00Z'),
  })
  scheduleStartTs: Date;

  @ApiProperty({
    description:
      'Timestamp when results become available. Get game result after live-streaming',
    example: new Date('2025-02-25T10:48:01Z'),
  })
  resultAvailableTs: Date;

  @ApiProperty({
    description:
      'Event video url with mp4 format, available at the ScheduleStartTimeTs',
    example: 'https://example.com',
    required: false,
  })
  playlist?: string;

  @ApiProperty({
    description:
      'Url of the JSON file with goal information, available at ScheduleStartTimeTs',
    example: 'https://api.example.com',
  })
  goalInfo?: string;

  @ApiProperty({
    description: 'List of market objects related to the event',
    type: [MarketDto],
  })
  markets: Array<MarketDto>;

  @ApiProperty({
    description:
      'Event results dictionary with language as the key. Available at the ResultAvailableTs',
    additionalProperties: {
      type: 'object',
      example: {
        mainResult: '1:2',
        resultEntries: [['key', 'value']],
      },
    },
  })
  result: Record<string, ResultDto>;

  @ApiProperty({
    description: 'Number of markets associated with the event',
    example: 1,
  })
  marketCount: number;
}
