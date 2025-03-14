import * as dotenv from 'dotenv';
dotenv.config();
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { ScheduleModule } from './schedule/schedule.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ConfigKeys } from './config/config-keys';
import configuration from './config/configuration';
import { HealthCheckModule } from './healthcheck/healthcheck.module';
import { LoggerModule } from './logger/logger.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        ...configService.get(ConfigKeys.Database),
      }),
    }),
    LoggerModule,
    AuthModule,
    ScheduleModule,
    HealthCheckModule
  ],
})
export class AppModule {}
