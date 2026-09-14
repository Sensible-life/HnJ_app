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

    // 호텔별 요약
    const hotelNames = Array.from(new Set(all.map((r) => r.session.hotel_name)));
    const byHotel = hotelNames.map((hotelName) => {
      const sessions = all.filter((r) => r.session.hotel_name === hotelName);
      const items = sessions.flatMap((r) => r.items);
      const bad = items.filter((i) => i.state === 'CAUTION' || i.state === 'URGENT').length;
      return {
        hotelName,
        sessionCount: sessions.length,
        defectRate: items.length > 0 ? Math.round((bad / items.length) * 1000) / 10 : 0,
      };
    });

    return {
      todayCompletedCount: todaySessions.length,
      monthCompletedCount: monthSessions.length,
      totalItemCount: allItems.length,
      urgentOpenCount: urgentItems.length,
      defectRatePercent: defectRate,
      issueBreakdown,
      dailyTrend,
      byHotel,
    };
  }
}
