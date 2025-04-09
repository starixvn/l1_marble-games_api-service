import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class Selection {
  @Prop({ type: Number })
  id: number;

  @Prop({ type: String })
  name: string;

  @Prop({ type: Number })
  price: number;

  @Prop({ type: String })
  settlementStatus: string;
}

export const SelectionSchema = SchemaFactory.createForClass(Selection);
