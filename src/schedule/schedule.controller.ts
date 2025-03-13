import {
  Controller,
  Get,
  Param,
  UseGuards,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ScheduleService, ScheduleEvent } from './schedule.service';
import { JwtAuthGuard } from '../common/guards/jwt.auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { ScheduleEventItemDto } from './dto/schedule.dto';
import { EventDto } from '../events/dto/event.dto';

@ApiTags('schedule')
@ApiBearerAuth()
@Controller('schedule')
@UseGuards(JwtAuthGuard)
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @ApiOperation({ summary: 'Get all scheduled events' })
  @ApiResponse({
    status: 200,
    description: 'Returns a list of all scheduled events',
    type: [ScheduleEventItemDto],
  })
  @Get()
  getSchedule(): ScheduleEventItemDto[] {
    return this.scheduleService.getSchedule().map((item) => {
      return {
        eventID: item.id,
        eventNameAKey: 'Poland',
        eventNameBKey: 'Wales',
        productCode: 'PG_SOCCER_SPEED_MAX',
        productTypeKey: 'PG_RNG',
      };
    });
  }
}
