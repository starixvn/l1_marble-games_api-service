import { ApiProperty } from '@nestjs/swagger';

export class TimeRangeDto {
  @ApiProperty({
    description: 'Start time in ISO format',
    example: '2025-03-13T00:00:00Z',
    required: false,
  })
  fromDate?: Date;

  @ApiProperty({
    description: 'End time in ISO format',
    example: '2025-03-13T23:59:59Z',
    required: false,
  })
  toDate?: Date;
}
