import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

export type ScheduleType = 'INITIAL_RENEWAL' | 'REGULAR' | 'EMERGENCY' | 'REINSPECTION';

export interface ScheduleRecord {
  id: string;
  hotelId: string;
  assignedUserId: string;
  visitsPerMonth: number;
  nextVisitDate: string | null;
  lastVisitDate: string | null;
  // FR: docs/FEATURE_SCOPE.md 우선순위 B — 긴급출동/재점검 일정 타입, 호텔 담당자와 일정 공유
  scheduleType: ScheduleType;
  shareToken: string | null;
}

function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * 임시 인메모리 저장소 (Schedule 모델 대응).
 * FR: "호텔별 정기 방문 주기 자동 생성, 담당자 배정, 미방문 알림" (TODO.md Phase 6).
 * DB가 붙으면 PrismaService 기반 리포지토리로 교체 (호출부 인터페이스는 유지).
 */
@Injectable()
export class SchedulesStore {
  private schedules = new Map<string, ScheduleRecord>();

  constructor() {
    const today = new Date().toISOString().slice(0, 10);
    const seed: ScheduleRecord[] = [
      {
        id: 'sched_1',
        hotelId: 'hotel_gw',
        assignedUserId: 'user_inspector_1',
        visitsPerMonth: 4,
        lastVisitDate: addDays(today, -10),
        nextVisitDate: addDays(today, -3), // 지난 방문 예정일 — 미방문 알림 대상
        scheduleType: 'REGULAR',
        shareToken: 'share_hotel_gw',
      },
      {
        id: 'sched_2',
        hotelId: 'hotel_sb',
        assignedUserId: 'user_inspector_1',
        visitsPerMonth: 2,
        lastVisitDate: addDays(today, -5),
        nextVisitDate: addDays(today, 9),
        scheduleType: 'REGULAR',
        shareToken: 'share_hotel_sb',
      },
    ];
    for (const s of seed) this.schedules.set(s.id, s);
  }

  list(): ScheduleRecord[] {
    return Array.from(this.schedules.values());
  }

  create(input: {
    hotelId: string;
    assignedUserId: string;
    visitsPerMonth: number;
    startDate?: string;
    scheduleType?: ScheduleType;
  }): ScheduleRecord {
    const today = input.startDate ?? new Date().toISOString().slice(0, 10);
    // 긴급출동/재점검은 정기 방문 주기 계산과 무관하게 바로 다음날로 잡는다.
    const isAdHoc = input.scheduleType === 'EMERGENCY' || input.scheduleType === 'REINSPECTION';
    const intervalDays = isAdHoc ? 1 : Math.max(1, Math.round(30 / Math.max(1, input.visitsPerMonth)));
    const record: ScheduleRecord = {
      id: `sched_${randomUUID()}`,
      hotelId: input.hotelId,
      assignedUserId: input.assignedUserId,
      visitsPerMonth: input.visitsPerMonth,
      lastVisitDate: null,
      nextVisitDate: addDays(today, intervalDays),
      scheduleType: input.scheduleType ?? 'REGULAR',
      shareToken: null,
    };
    this.schedules.set(record.id, record);
    return record;
  }

  // FR: docs/FEATURE_SCOPE.md 우선순위 B — 호텔 담당자와 일정 공유용 토큰 발급(최초 요청 시 생성, 이후 재사용)
  getOrCreateShareToken(id: string): string | undefined {
    const s = this.schedules.get(id);
    if (!s) return undefined;
    if (!s.shareToken) s.shareToken = `share_${randomUUID()}`;
    return s.shareToken;
  }

  findByShareToken(token: string): ScheduleRecord | undefined {
    return this.list().find((s) => s.shareToken === token);
  }

  listByHotel(hotelId: string): ScheduleRecord[] {
    return this.list().filter((s) => s.hotelId === hotelId);
  }

  reassign(id: string, assignedUserId: string): ScheduleRecord | undefined {
    const s = this.schedules.get(id);
    if (!s) return undefined;
    s.assignedUserId = assignedUserId;
    return s;
  }

  recordVisit(id: string, visitDate: string): ScheduleRecord | undefined {
    const s = this.schedules.get(id);
    if (!s) return undefined;
    const intervalDays = Math.max(1, Math.round(30 / Math.max(1, s.visitsPerMonth)));
    s.lastVisitDate = visitDate;
    s.nextVisitDate = addDays(visitDate, intervalDays);
    return s;
  }
}
