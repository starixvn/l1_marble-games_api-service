import { ApiProperty } from '@nestjs/swagger';

export class ScheduleEventItemDto {
  @ApiProperty({
    description: 'Unique identifier of the event',
    example: 1,
  })
  eventID: number;

  @ApiProperty({
    description: 'Event name for team A',
    example: 'Wales'
  })
  eventNameAKey: string;

  @ApiProperty({
    description: 'Event name for team B',
    example: 'Poland'
  })
  eventNameBKey: string;

  @ApiProperty({
    description: 'Event name language dictrionary',
    example: {
      "en": "Wales V Poland"
    }
  })
  eventName?: Record<string, string>;

  @ApiProperty({
    description: "Code representing the product associated with the event",
    example: "PG_SOCCER_SPEED_MAX"
  })
  productCode: string;

  @ApiProperty({
    description: 'Product name language dictionary',
    example: {
      "en": "Soccer Pingoal RNG Max"
    }
  })
  productName?: Record<string, string>;

  @ApiProperty({
    description: "Product type key",
    example: "PG_RNG"
  })
  productTypeKey: string;

  selectionIcon1?: string;
  selectionIcon2?: string;
}