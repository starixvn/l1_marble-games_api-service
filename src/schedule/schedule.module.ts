import { Module } from '@nestjs/common';
import { ScheduleController } from './schedule.controller';
import { EventModule } from 'src/events/events.module';

@Module({
  imports: [EventModule],
  controllers: [ScheduleController],
})
export class ScheduleModule {}
