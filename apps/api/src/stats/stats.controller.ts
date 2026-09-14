import { Controller, Get } from '@nestjs/common';
import { InspectionsStore } from '../inspections/inspections.store.js';

// FR: 관리자 웹 통계 대시보드 (일일/월간, 청소 불량률, 문제 유형별 분석) — API_SPEC.md 8장
@Controller('admin/stats')
export class StatsController {
  constructor(private readonly inspectionsStore: InspectionsStore) {}

  @Get('dashboard')
  dashboard() {
    const all = this.inspectionsStore.all();
    const now = new Date();
    const todayKey = now.toISOString().slice(0, 10);
    const monthKey = now.toISOString().slice(0, 7);

    const todaySessions = all.filter((r) => (r.session.completed_at ?? r.syncedAt).slice(0, 10) === todayKey);
    const monthSessions = all.filter((r) => (r.session.completed_at ?? r.syncedAt).slice(0, 7) === monthKey);

    const allItems = all.flatMap((r) => r.items);
    const badItems = allItems.filter((i) => i.state === 'CAUTION' || i.state === 'URGENT');
    const urgentItems = allItems.filter((i) => i.state === 'URGENT');
    const defectRate = allItems.length > 0 ? Math.round((badItems.length / allItems.length) * 1000) / 10 : 0;

    // 문제 유형별 분석 — 항목명 기준으로 주의/긴급 발생 빈도 집계
    const byItemName = new Map<string, { itemName: string; caution: number; urgent: number }>();
    for (const item of allItems) {
      if (item.state !== 'CAUTION' && item.state !== 'URGENT') continue;
      const entry = byItemName.get(item.item_name) ?? { itemName: item.item_name, caution: 0, urgent: 0 };
      if (item.state === 'CAUTION') entry.caution += 1;
      else entry.urgent += 1;
      byItemName.set(item.item_name, entry);
    }
    const issueBreakdown = Array.from(byItemName.values()).sort(
      (a, b) => b.caution + b.urgent - (a.caution + a.urgent),
    );

    // 최근 7일 일별 점검 건수 (막대 그래프용)
    const dailyTrend: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const count = all.filter((r) => (r.session.completed_at ?? r.syncedAt).slice(0, 10) === key).length;
      dailyTrend.push({ date: key, count });
    }

    // 호텔별 요약 (문제 발생률 내림차순 = 호텔별 문제 발생 순위)
    const hotelNames = Array.from(new Set(all.map((r) => r.session.hotel_name)));
    const byHotel = hotelNames
      .map((hotelName) => {
        const sessions = all.filter((r) => r.session.hotel_name === hotelName);
        const items = sessions.flatMap((r) => r.items);
        const bad = items.filter((i) => i.state === 'CAUTION' || i.state === 'URGENT').length;
        return {
          hotelName,
          sessionCount: sessions.length,
          badCount: bad,
          defectRate: items.length > 0 ? Math.round((bad / items.length) * 1000) / 10 : 0,
        };
      })
      .sort((a, b) => b.defectRate - a.defectRate)
      .map((h, idx) => ({ ...h, rank: idx + 1 }));

    // FR: docs/FEATURE_SCOPE.md 우선순위 B — 담당자별 점검 실적
    const inspectorNames = Array.from(
      new Set(all.map((r) => r.session.inspector_name).filter((n): n is string => Boolean(n))),
    );
    const byInspector = inspectorNames
      .map((inspectorName) => {
        const sessions = all.filter((r) => r.session.inspector_name === inspectorName);
        const items = sessions.flatMap((r) => r.items);
        const bad = items.filter((i) => i.state === 'CAUTION' || i.state === 'URGENT').length;
        const urgent = items.filter((i) => i.state === 'URGENT').length;
        return {
          inspectorName,
          sessionCount: sessions.length,
          badCount: bad,
          urgentCount: urgent,
          defectRate: items.length > 0 ? Math.round((bad / items.length) * 1000) / 10 : 0,
        };
      })
      .sort((a, b) => b.sessionCount - a.sessionCount);

    // FR: docs/FEATURE_SCOPE.md 우선순위 B — 객실별 문제 발생 횟수 / 반복 문제 객실(재발)
    const roomKey = (hotelName: string, roomLabel: string) => `${hotelName}__${roomLabel}`;
    const byRoomMap = new Map<
      string,
      { hotelName: string; roomLabel: string; sessionCount: number; badCount: number }
    >();
    for (const r of all) {
      const key = roomKey(r.session.hotel_name, r.session.room_label);
      const entry = byRoomMap.get(key) ?? {
        hotelName: r.session.hotel_name,
        roomLabel: r.session.room_label,
        sessionCount: 0,
        badCount: 0,
      };
      entry.sessionCount += 1;
      entry.badCount += r.items.filter((i) => i.state === 'CAUTION' || i.state === 'URGENT').length;
      byRoomMap.set(key, entry);
    }
    const byRoom = Array.from(byRoomMap.values()).sort((a, b) => b.badCount - a.badCount);
    // 재발: 같은 객실의 같은 항목명이 서로 다른 세션에서 2회 이상 주의/긴급으로 잡힌 경우
    const recurrenceMap = new Map<string, { hotelName: string; roomLabel: string; itemName: string; count: number }>();
    for (const r of all) {
      for (const item of r.items) {
        if (item.state !== 'CAUTION' && item.state !== 'URGENT') continue;
        const key = `${r.session.hotel_name}__${r.session.room_label}__${item.item_name}`;
        const entry = recurrenceMap.get(key) ?? {
          hotelName: r.session.hotel_name,
          roomLabel: r.session.room_label,
          itemName: item.item_name,
          count: 0,
        };
        entry.count += 1;
        recurrenceMap.set(key, entry);
      }
    }
    const recurringIssues = Array.from(recurrenceMap.values())
      .filter((e) => e.count >= 2)
      .sort((a, b) => b.count - a.count);

    // FR: docs/FEATURE_SCOPE.md 우선순위 B — 전월 대비 개선율 (불량률 기준)
    const prevMonthDate = new Date(now);
    prevMonthDate.setMonth(prevMonthDate.getMonth() - 1);
    const prevMonthKey = prevMonthDate.toISOString().slice(0, 7);
    const prevMonthItems = all
      .filter((r) => (r.session.completed_at ?? r.syncedAt).slice(0, 7) === prevMonthKey)
      .flatMap((r) => r.items);
    const prevMonthBad = prevMonthItems.filter((i) => i.state === 'CAUTION' || i.state === 'URGENT').length;
    const prevMonthDefectRate =
      prevMonthItems.length > 0 ? Math.round((prevMonthBad / prevMonthItems.length) * 1000) / 10 : null;
    const currentMonthItems = monthSessions.flatMap((r) => r.items);
    const currentMonthBad = currentMonthItems.filter((i) => i.state === 'CAUTION' || i.state === 'URGENT').length;
    const currentMonthDefectRate =
      currentMonthItems.length > 0 ? Math.round((currentMonthBad / currentMonthItems.length) * 1000) / 10 : null;
    const improvementRatePercent =
      prevMonthDefectRate !== null && prevMonthDefectRate > 0 && currentMonthDefectRate !== null
        ? Math.round(((prevMonthDefectRate - currentMonthDefectRate) / prevMonthDefectRate) * 1000) / 10
        : null;

    // FR: docs/FEATURE_SCOPE.md 우선순위 B — 청소팀별 인스펙션 점수 (정상 비율 기준 100점 환산)
    const teamNames = Array.from(
      new Set(all.map((r) => r.session.cleaning_team).filter((n): n is string => Boolean(n))),
    );
    const byCleaningTeam = teamNames
      .map((teamName) => {
        const sessions = all.filter((r) => r.session.cleaning_team === teamName);
        const items = sessions.flatMap((r) => r.items).filter((i) => i.state !== 'UNSET' && i.state !== 'NOT_APPLICABLE');
        const normal = items.filter((i) => i.state === 'NORMAL').length;
        const score = items.length > 0 ? Math.round((normal / items.length) * 1000) / 10 : null;
        return { teamName, sessionCount: sessions.length, score };
      })
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

    // FR: docs/FEATURE_SCOPE.md 우선순위 B — 화장실 상태 변화 그래프 (BATH PRO 세션의 일자별 정상/주의/긴급 추이)
    const bathProSessions = all.filter((r) => r.session.type === 'BATH_PRO');
    const bathProTrend: { date: string; normal: number; caution: number; urgent: number }[] = [];
    for (let i = 13; i >= 0; i -= 1) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const dayItems = bathProSessions
        .filter((r) => (r.session.completed_at ?? r.syncedAt).slice(0, 10) === key)
        .flatMap((r) => r.items);
      bathProTrend.push({
        date: key,
        normal: dayItems.filter((i) => i.state === 'NORMAL').length,
        caution: dayItems.filter((i) => i.state === 'CAUTION').length,
        urgent: dayItems.filter((i) => i.state === 'URGENT').length,
      });
    }

    return {
      todayCompletedCount: todaySessions.length,
      monthCompletedCount: monthSessions.length,
      totalItemCount: allItems.length,
      urgentOpenCount: urgentItems.length,
      defectRatePercent: defectRate,
      issueBreakdown,
      dailyTrend,
      byHotel,
      byInspector,
      byRoom,
      recurringIssues,
      improvementRatePercent,
      byCleaningTeam,
      bathProTrend,
    };
  }
}
