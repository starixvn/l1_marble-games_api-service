import {
  Controller,
  Get,
  Param,
  UseGuards,
  HttpException,
  HttpStatus,
  Query,
  Inject,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt.auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { ScheduleEventItemDto } from './dto/schedule.dto';
import { EventDto } from '../events/dto/event.dto';
import { TimeRangeDto } from './dto/time-range.dto';
import { EventService } from 'src/events/events.service';

@ApiTags('schedule')
@ApiBearerAuth()
@Controller('schedule')
@UseGuards(JwtAuthGuard)
export class ScheduleController {
  constructor(
    @Inject(EventService)
    private readonly eventService: EventService
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
    query: TimeRangeDto
  ): Promise<ScheduleEventItemDto[]> {
      const events = await this.eventService.getEventByTimeSpan({
        startTime: query.start,
        endTime: query.end
      });

      return events.map(event => ({
        eventID: event.eventID,
        eventNameAKey: event.eventNameAKey,
        eventNameBKey: event.eventNameBKey,
        productCode: "Spinner_Soccer",
        productTypeKey: "Marble_RNG",
      }))
    };
  }

