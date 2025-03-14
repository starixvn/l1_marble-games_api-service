import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { LogRecord, LogRecordDocument } from "./schema/log-record.schema";
import { Model } from "mongoose";

@Injectable()
export class DatabaseLogService {
  constructor(
    @InjectModel(LogRecord.name)
    private readonly logModel: Model<LogRecordDocument> 
  ) {}

  async insertLog(logRecord: LogRecord) {
    await this.logModel.insertOne(logRecord);
  }
}
