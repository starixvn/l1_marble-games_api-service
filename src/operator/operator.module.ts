import { Module } from '@nestjs/common';
import { OperatorService } from './operator.service';
import { Operator, OperatorSchema } from './schema/operator.schema';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Operator.name,
        schema: OperatorSchema,
        collection: 'operators',
      },
    ]),
  ],
  providers: [OperatorService],
  exports: [OperatorService],
})
export class OperatorModule {}
