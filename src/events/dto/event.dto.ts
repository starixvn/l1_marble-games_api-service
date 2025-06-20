import { IsInt, IsNotEmpty } from "class-validator";

export class EventQueryDto {
  @IsNotEmpty()
  @IsInt()
  eventID: number;
}