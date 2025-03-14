import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, ObjectId } from 'mongoose';

export type OperatorDocument = Operator & Document<unknown>;

@Schema()
export class Operator {
  @Prop({ type: String })
  password: string;
}

export const OperatorSchema = SchemaFactory.createForClass(Operator);
