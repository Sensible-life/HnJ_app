import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

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

  // FR: docs/FEATURE_SCOPE.md 우선순위 B — 긴급출동/재점검 일정 타입
  @IsOptional()
  @IsIn(['INITIAL_RENEWAL', 'REGULAR', 'EMERGENCY', 'REINSPECTION'])
  scheduleType?: 'INITIAL_RENEWAL' | 'REGULAR' | 'EMERGENCY' | 'REINSPECTION';
}
