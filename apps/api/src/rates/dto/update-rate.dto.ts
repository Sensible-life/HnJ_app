import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateRateDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsString()
  note?: string;
}
