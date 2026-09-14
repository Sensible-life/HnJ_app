import { Body, Controller, Get, NotFoundException, Param, Patch, Post } from '@nestjs/common';
import { SchedulesStore } from './schedules.store.js';
import { HotelsStore } from '../hotels/hotels.store.js';
import { UsersStore } from '../users/users.store.js';
import { CreateScheduleDto } from './dto/create-schedule.dto.js';
import { UpdateScheduleDto } from './dto/update-schedule.dto.js';

// API_SPEC.md 8장: GET/POST /schedules, PATCH /schedules/:id
@Controller('schedules')
export class SchedulesController {
  constructor(
    private readonly schedulesStore: SchedulesStore,
    private readonly hotelsStore: HotelsStore,
    private readonly usersStore: UsersStore,
  ) {}

  private enrich(schedule: ReturnType<SchedulesStore['list']>[number]) {
    const today = new Date().toISOString().slice(0, 10);
    const overdue = Boolean(schedule.nextVisitDate && schedule.nextVisitDate < today);
    return {
      ...schedule,
      hotel: this.hotelsStore.get(schedule.hotelId) ?? null,
      assignedUser: this.usersStore.get(schedule.assignedUserId) ?? null,
      overdue, // 미방문 알림: 다음 방문 예정일이 지났는데 아직 방문 기록이 없는 경우
    };
  }

  @Get()
  list() {
    return this.schedulesStore.list().map((s) => this.enrich(s));
  }

  // FR: docs/FEATURE_SCOPE.md 우선순위 B — 호텔 담당자와 일정 공유용 링크 발급
  @Post(':id/share-link')
  getShareLink(@Param('id') id: string) {
    const token = this.schedulesStore.getOrCreateShareToken(id);
    if (!token) throw new NotFoundException('일정을 찾을 수 없습니다.');
    return { token, path: `/schedules/shared/${token}` };
  }

  // 공개 조회 — 호텔 담당자가 로그인 없이 자신의 호텔 방문 일정을 확인하는 용도.
  // 해당 일정과 같은 호텔의 모든 일정을 함께 보여준다(호텔 담당자 입장에서는 호텔 단위로 의미가 있음).
  @Get('shared/:token')
  getShared(@Param('token') token: string) {
    const schedule = this.schedulesStore.findByShareToken(token);
    if (!schedule) throw new NotFoundException('공유된 일정을 찾을 수 없습니다.');
    return this.schedulesStore.listByHotel(schedule.hotelId).map((s) => this.enrich(s));
  }

  @Post()
  create(@Body() dto: CreateScheduleDto) {
    const schedule = this.schedulesStore.create(dto);
    return this.enrich(schedule);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateScheduleDto) {
    let updated = this.schedulesStore.list().find((s) => s.id === id);
    if (!updated) throw new NotFoundException('일정을 찾을 수 없습니다.');
    if (dto.assignedUserId) {
      updated = this.schedulesStore.reassign(id, dto.assignedUserId);
    }
    if (dto.visitCompletedOn) {
      updated = this.schedulesStore.recordVisit(id, dto.visitCompletedOn);
    }
    if (!updated) throw new NotFoundException('일정을 찾을 수 없습니다.');
    return this.enrich(updated);
  }
}
