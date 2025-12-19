import { IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class RenameNodeDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  // optimistic locking: if provided, rename will only succeed if row_version matches
  @IsOptional()
  @Matches(/^[0-9]+$/)
  expectedRowVersion?: string;
}
