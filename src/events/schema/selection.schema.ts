import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class Selection {
  @Prop({ type: String })
  name: string;
  
  @Prop({ type: Number })
  point: number;
  
  @Prop({ type: Number })
  price: number;

  @Prop({ type: String })
  settlementStatus: string;
}

export const SelectionSchema = SchemaFactory.createForClass(Selection);
