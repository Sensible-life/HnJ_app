import { IsOptional, IsString } from 'class-validator';

export class UpdateScheduleDto {
  @IsOptional()
  @IsString()
  assignedUserId?: string;

  // 방문 완료 처리 시 방문일(YYYY-MM-DD)을 넘기면 다음 방문일이 자동 재계산된다.
  @IsOptional()
  @IsString()
  visitCompletedOn?: string;
}
