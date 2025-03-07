import { ApiProperty } from "@nestjs/swagger";

export class ResultDto {
    @ApiProperty({
        description: "The main market result. (1H score in first EventDetail, 2H score in second EventDetail",
        example: "1:2"
    })
    mainResult: string;

    @ApiProperty({
        description: "A list of lists containing result entries",
        example: [["key", "value"]]
    })
    resultEntries?: [[string, string]]
}