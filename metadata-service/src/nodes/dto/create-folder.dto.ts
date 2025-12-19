import { IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class CreateFolderDto {
  @IsOptional()
  @Matches(/^[0-9]+$/)
  parentId?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;
}
