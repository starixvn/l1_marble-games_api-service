import { ApiProperty } from '@nestjs/swagger';
import {IsOptional } from 'class-validator';

export class TimeRangeDto {
  @ApiProperty({
    description: 'Start time in ISO format',
    example: '2025-03-13T00:00:00',
    required: false,
  })
  @IsOptional()
  fromDate?: string;

  @ApiProperty({
    description: 'End time in ISO format',
    example: '2025-03-13T23:59:59',
    required: false,
  })
  @IsOptional()
  toDate?: string;
}
