import * as dotenv from 'dotenv';
dotenv.config();
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { ScheduleModule } from './schedule/schedule.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ConfigKeys } from './config/config-keys';
import configuration from './config/config';
import { HealthCheckModule } from './healthcheck/healthcheck.module';
import { LoggerModule } from './logger/logger.module';
import { ConnectionNames } from './config/connection-names';
import { GameIntegrationModule } from './game-integration/game-integration.module';
import { CacheModule } from './cache/cache.module';

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
        ...(await configService.get(ConfigKeys.Database)),
      }),
    }),
    MongooseModule.forRootAsync({
      connectionName: ConnectionNames.Log,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        ...(await configService.get(ConfigKeys.Database)),
      }),
    }),
    CacheModule,
    LoggerModule,
    GameIntegrationModule,
    AuthModule,
    ScheduleModule,
    HealthCheckModule,
  ],
})
export class AppModule {}
