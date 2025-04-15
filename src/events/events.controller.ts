import {
  Controller,
  Get,
  Query,
  BadRequestException,
  UseGuards,
  UseInterceptors,
  Req,
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

@ApiTags('events')
@ApiBearerAuth()
@Controller('events')
@UseGuards(JwtAuthGuard)
@UseInterceptors(LoggerInterceptor)
export class EventsController {
  constructor(private readonly eventService: EventService) {}

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
    type: String,
    description: 'The ID of the event to retrieve',
    required: true,
  })
  @Get()
  async getEvents(@Query('eventID') eventID?: string, @Req() req?: any) {
    if (!eventID) {
      throw new BadRequestException('eventID is required');
    }

    const eventId = parseInt(eventID, 10);
    if (isNaN(eventId)) {
      throw new BadRequestException('eventID must be a valid integer');
    }
    
    return this.eventService.getEventById(eventId);
  }
} 
