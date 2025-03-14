import { ApiProperty } from "@nestjs/swagger";

export class TimeRangeDto {

  @ApiProperty({ description: 'Start time in ISO format', example: '2025-03-14T00:00:00Z' })
  start: Date;

  @ApiProperty({ description: 'End time in ISO format', example: '2025-03-15T23:59:59Z' })
  end: Date;
}
