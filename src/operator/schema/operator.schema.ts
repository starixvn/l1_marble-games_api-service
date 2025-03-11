import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, ObjectId } from 'mongoose';

export interface OperatorConfig {
  productCodes: string[];
}

export type OperatorDocument = Operator & Document<ObjectId>;

@Schema()
export class Operator {
  @Prop({ type: String })
  hashedPassword: string;

  @Prop({ type: Object })
  configs: OperatorConfig;
}

export const OperatorSchema = SchemaFactory.createForClass(Operator);
