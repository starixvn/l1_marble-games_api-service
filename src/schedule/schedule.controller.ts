import {
  Controller,
  UseGuards,
  UseInterceptors,
  Inject,
  Get,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt.auth.guard';
import { EventService } from '../events/events.service';
import { LoggerInterceptor } from '../logger/database-logger.interceptor';
import { ScheduleEventItemDto } from './dto/schedule.dto';
import { TimeRangeDto } from './dto/time-range.dto';

@ApiTags('schedule')
@ApiBearerAuth()
@Controller('schedule')
@UseGuards(JwtAuthGuard)
@UseInterceptors(LoggerInterceptor)
export class ScheduleController {
  constructor(
    @Inject(EventService)
    private readonly eventService: EventService,
  ) {}

  @ApiOperation({ summary: 'Get all scheduled events' })
  @ApiResponse({
    status: 200,
    description: 'Returns a list of all scheduled events',
    type: [ScheduleEventItemDto],
  })
  @Get()
  async getSchedule(
    @Query()
    query: TimeRangeDto,
  ): Promise<ScheduleEventItemDto[]> {
    const events = await this.eventService.getEventByTimeSpan({
      startTime: query.fromDate,
      endTime: query.toDate,
    });

    return events.map((event) => ({
      eventID: event.eventID,
      eventNameAKey: event.eventNameAKey,
      eventNameBKey: event.eventNameBKey,
      productCode: 'Spinner_Soccer',
      productTypeKey: 'Marble_RNG',
    }));
  }
}
