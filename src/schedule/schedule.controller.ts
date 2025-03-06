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
import { ScheduleEventDto } from './dto/schedule.dto';

@ApiTags('schedule')
@ApiBearerAuth()
@Controller('api')
@UseGuards(JwtAuthGuard)
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @ApiOperation({ summary: 'Get all scheduled events' })
  @ApiResponse({
    status: 200,
    description: 'Returns a list of all scheduled events',
    type: [ScheduleEventDto],
  })
  @Get('schedule')
  getSchedule(): ScheduleEvent[] {
    return this.scheduleService.getSchedule();
  }

  @ApiOperation({ summary: 'Get event details by ID' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns the event details',
    type: ScheduleEventDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Event not found',
  })
  @Get('event/:id')
  getEventById(@Param('id') id: string) {
    const event = this.scheduleService.getEventDetail(id);
    if (!event) {
      throw new HttpException('Event not found', HttpStatus.NOT_FOUND);
    }
    return event;
  }
}
