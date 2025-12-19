import { Transform } from 'class-transformer';
import { IsOptional, Matches, Max, Min } from 'class-validator';

export class ListChildrenQuery {
  @IsOptional()
  cursor?: string;

  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : Number(value)))
  @Min(1)
  @Max(200)
  limit?: number;
}
