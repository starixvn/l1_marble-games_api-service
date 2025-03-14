import { ApiProperty } from '@nestjs/swagger';
import { SelectionDto } from './selection.dto';

export class MarketDto {
  @ApiProperty({
    description: 'Unique identifier for the market',
    example: 1,
  })
  marketID: number;

  @ApiProperty({
    description: 'Market name key',
    example: 'MARKET_HANDICAP',
  })
  marketNameKey: string;

  @ApiProperty({
    description: 'Market name language dictionary',
    example: {
      en: 'Handicap',
    },
  })
  marketName?: Record<string, string>;

  @ApiProperty({
    description: 'List of selection object related to the market',
    type: [SelectionDto],
  })
  selection: Array<SelectionDto>;
}
