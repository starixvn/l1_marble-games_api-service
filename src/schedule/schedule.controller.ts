import {
  Controller,
  UseGuards,
  UseInterceptors,
  Inject,
  Get,
  Query,
  Req,
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
import { GameIntegrationService } from '../game-integration/game-integration.service';

@ApiTags('schedule')
@ApiBearerAuth()
@Controller('schedule')
@UseGuards(JwtAuthGuard)
@UseInterceptors(LoggerInterceptor)
export class ScheduleController {
  constructor(
    @Inject(EventService)
    private readonly eventService: EventService,

    @Inject(GameIntegrationService)
    private readonly gameIntegrationService: GameIntegrationService,
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
    @Req() req: any,
  ): Promise<any> {
    const operatorId = req.user.userId;
    const events = await this.eventService.getEventByTimeSpan({
      startTime: query.fromDate,
      endTime: query.toDate,
    });

    return Promise.all(
      events.map(async (event) => {
        return this.gameIntegrationService.mergeWithEvents({
          targets: event,
          query: {
            operatorId: operatorId,
            gameId: event.gameId,
          },
        });
      }),
    );
  }
}
