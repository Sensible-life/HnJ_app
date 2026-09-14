import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateScheduleDto {
  @IsString()
  hotelId!: string;

  @IsString()
  assignedUserId!: string;

  @IsInt()
  @Min(1)
  @Max(30)
  visitsPerMonth!: number;

  @IsOptional()
  @IsString()
  startDate?: string;
}
