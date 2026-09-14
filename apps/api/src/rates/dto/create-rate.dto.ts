import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateRateDto {
  @IsOptional()
  @IsString()
  hotelId?: string | null;

  @IsIn(['INITIAL_RENEWAL', 'REGULAR', 'EMERGENCY', 'REINSPECTION'])
  serviceType!: 'INITIAL_RENEWAL' | 'REGULAR' | 'EMERGENCY' | 'REINSPECTION';

  @IsInt()
  @Min(0)
  price!: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsString()
  note?: string;
}
