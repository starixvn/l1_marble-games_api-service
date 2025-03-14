import { Global, Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { LogRecord, LogRecordSchema } from "./schema/log-record.schema";
import { DatabaseLogService } from "./database-logger.service";

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: LogRecord.name,
        schema: LogRecordSchema,
        collection: "log_records" 
      }
    ])
  ],
  providers: [DatabaseLogService],
  exports: [DatabaseLogService]
})
export class LoggerModule {}
