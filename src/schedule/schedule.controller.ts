import {
  Controller,
  UseGuards,
  UseInterceptors,
  Inject,
  Get,
  Query,
  Req,
  UsePipes,
  ValidationPipe,
  BadRequestException,
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
  @ApiResponse({
    status: 400,
    description: 'Invalid date format provided',
  })
  @Get()
  @UsePipes(new ValidationPipe({ transform: true }))
  async getSchedule(
    @Query()
    query: TimeRangeDto,
    @Req() req: any,
  ): Promise<any> {
    const operatorId = req.user.userId;
    
    let startTime: Date | undefined;
    let endTime: Date | undefined;
    
    try {
      if (query.fromDate) {
        startTime = new Date(query.fromDate);
        if (isNaN(startTime.getTime())) {
          throw new BadRequestException('Invalid fromDate format');
        }
      }
      
      if (query.toDate) {
        endTime = new Date(query.toDate);
        if (isNaN(endTime.getTime())) {
          throw new BadRequestException('Invalid toDate format');
        }
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Invalid date format provided');
    }

    if (startTime && endTime && startTime.getTime() > endTime.getTime()) {
      throw new BadRequestException('fromDate must be before toDate');
    }



    const events = await this.eventService.getEventByTimeSpan({
      startTime,
      endTime,
    });

    const results = await Promise.all(
      events.map(async (event) => {
        const query = {
          operatorId: operatorId,
          gameId: event.gameId,
        }

        const gameIntegration = await this.gameIntegrationService.getGameIntegration({
          query
        });

        if (!gameIntegration) {
          return null;
        }

        return this.gameIntegrationService.processForScheduleEventsWithGameIntegration({
          targets: event,
          gameIntegration,
        });
      })
    );

    return results.filter(result => result !== null);
  }
}
