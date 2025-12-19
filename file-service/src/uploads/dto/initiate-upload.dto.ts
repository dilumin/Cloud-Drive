import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class InitiateUploadDto {
  @IsNotEmpty()
  @Matches(/^[0-9]+$/)
  fileNodeId!: string;

  @IsNotEmpty()
  @Matches(/^[0-9]+$/)
  totalSize!: string;

  @IsOptional()
  @IsString()
  mimeType?: string;
}
