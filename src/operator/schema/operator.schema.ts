import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

export interface OperatorConfig {
    productCodes:  string[]
}


@Schema({
    collection: "operator"
})
export class Operator {

    @Prop({ type: String })
    operatorId: string;

    @Prop({ type: String })
    operatorHashedPassword: string;

    @Prop( {type: Object })
    operatorConfig: OperatorConfig;
}

export const OperatorSchema = SchemaFactory.createForClass(Operator);
