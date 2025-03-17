import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { LogRecord, LogRecordDocument } from './schema/log-record.schema';
import { Model } from 'mongoose';
import { ConnectionNames } from '../config/connection-names';

@Injectable()
export class DatabaseLogService {
  constructor(
    @InjectModel(LogRecord.name, ConnectionNames.Log)
    private readonly logModel: Model<LogRecordDocument>,
  ) {}

  async insertLog(logRecord: LogRecord) {
    await this.logModel.insertOne(logRecord);
  }
}
