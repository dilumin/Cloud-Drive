import { IsNotEmpty, IsOptional, Matches } from 'class-validator';

export class MoveNodeDto {
  @IsNotEmpty()
  @Matches(/^[0-9]+$/)
  newParentId!: string;

  // optimistic locking: if provided, move will only succeed if row_version matches
  @IsOptional()
  @Matches(/^[0-9]+$/)
  expectedRowVersion?: string;
}
