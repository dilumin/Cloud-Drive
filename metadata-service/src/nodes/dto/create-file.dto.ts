import { IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class CreateFileDto {
  @IsOptional()
  @Matches(/^[0-9]+$/)
  parentId?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;
}
