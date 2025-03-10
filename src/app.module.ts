import * as dotenv from 'dotenv';
dotenv.config();
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { ScheduleModule } from './schedule/schedule.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ConfigKeys } from './config/config-keys';
import configuration from './config/configuration';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration]
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
          ...configService.get(ConfigKeys.Database)
      })
    }
    ),
    AuthModule,
    ScheduleModule,
  ],
})
export class AppModule {}
