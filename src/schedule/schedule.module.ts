import { Module } from '@nestjs/common';
import { ScheduleController } from './schedule.controller';
import { EventModule } from '../events/events.module';
import { GameIntegrationModule } from '../game-integration/game-integration.module';

@Module({
  imports: [EventModule, GameIntegrationModule],
  controllers: [ScheduleController],
})
export class ScheduleModule {}
