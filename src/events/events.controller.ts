import {
  Controller,
  Get,
  Query,
  BadRequestException,
  UseGuards,
  UseInterceptors,
  Req,
  NotFoundException,
} from '@nestjs/common';
import { EventService } from './events.service';
import { JwtAuthGuard } from '../common/guards/jwt.auth.guard';
import { LoggerInterceptor } from '../logger/database-logger.interceptor';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { GameIntegrationService } from '../game-integration/game-integration.service';
import { extractGameId } from '../utils/event-id';
import { EventQueryDto } from './dto/event.dto';

@ApiTags('events')
@ApiBearerAuth()
@Controller('events')
@UseGuards(JwtAuthGuard)
@UseInterceptors(LoggerInterceptor)
export class EventsController {
  constructor(
    private readonly eventService: EventService,
    private readonly gameIntegrationService: GameIntegrationService,
  ) {}

  @ApiOperation({ summary: 'Get an event by ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns an event by ID',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request: eventID is missing or invalid',
  })
  @ApiResponse({
    status: 404,
    description: 'Event not found',
  })
  @ApiQuery({
    name: 'eventID',
    type: Number,
    description: 'The ID of the event to retrieve',
    required: true,
  })
  @Get()
  async getEvents(@Query() eventQueryDto: EventQueryDto, @Req() req?: any) {
    const eventId = eventQueryDto.eventID;

    const operatorId = req.user.userId;
    const gameId = extractGameId(eventId);

    const gameIntegration = await this.gameIntegrationService.getGameIntegration({
      query: {
        operatorId,
        gameId,
      },
    });

    if (!gameIntegration) {
      throw new NotFoundException('Game integration not found');
    }

    const rawEventData = await this.eventService.getEventById(eventId); 
    
    return this.gameIntegrationService.processEventWithGameIntegration({
      gameIntegration,
      targets: rawEventData
    });
  }
} 
