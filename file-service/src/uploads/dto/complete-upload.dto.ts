import { ArrayMinSize, IsArray, IsInt, IsNotEmpty, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class PartDto {
  @IsInt() @Min(1) partNumber!: number;
  @IsString() @IsNotEmpty() etag!: string;
}

export class CompleteUploadDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PartDto)
  parts!: PartDto[];
}
