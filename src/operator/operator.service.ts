import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Operator, OperatorDocument } from './schema/operator.schema';
import mongoose, { Model } from 'mongoose';

@Injectable()
export class OperatorService {
  constructor(
    @InjectModel(Operator.name)
    private readonly operatorModel: Model<OperatorDocument>,
  ) {}

  async getOperator(operatorId: string): Promise<OperatorDocument | null> {
    if (!mongoose.Types.ObjectId.isValid(operatorId)) {
      return null;
    }
    return this.operatorModel.findById(operatorId).lean().exec();
  }
}
