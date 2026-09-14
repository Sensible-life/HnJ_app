"use client";

import { useEffect, useState, useCallback } from "react";
import { api, API_BASE_URL, Hotel, AdminUser, Schedule, ScheduleType } from "../../../lib/api";

const SCHEDULE_TYPE_LABEL: Record<ScheduleType, string> = {
  INITIAL_RENEWAL: "최초 리뉴얼",
  REGULAR: "정기점검",
  EMERGENCY: "긴급출동",
  REINSPECTION: "재점검",
};
const SCHEDULE_TYPES: ScheduleType[] = ["REGULAR", "EMERGENCY", "REINSPECTION", "INITIAL_RENEWAL"];

// FR: "호텔별 정기 방문 주기 자동 생성, 담당자 배정, 미방문 알림" — TODO.md Phase 6
export default function SchedulePage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formHotelId, setFormHotelId] = useState("");
  const [formUserId, setFormUserId] = useState("");
  const [formVisits, setFormVisits] = useState(4);
  const [formScheduleType, setFormScheduleType] = useState<ScheduleType>("REGULAR");
  const [submitting, setSubmitting] = useState(false);
  const [copiedShareId, setCopiedShareId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [s, h, u] = await Promise.all([api.getSchedules(), api.getHotels(), api.getUsers()]);
      setSchedules(s);
      setHotels(h);
      setUsers(u.filter((user) => user.role === "INSPECTOR"));
      if (!formHotelId && h.length > 0) setFormHotelId(h[0].id);
      if (!formUserId && u.length > 0) setFormUserId(u.find((x) => x.role === "INSPECTOR")?.id ?? u[0].id);
      setError(null);
    } catch {
      setError("API 서버(localhost:3001)에 연결할 수 없어요. 서버를 실행한 뒤 새로고침 해주세요.");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 마운트 시 1회 데이터 로드(표준 패턴)
    load();
  }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!formHotelId || !formUserId) return;
    setSubmitting(true);
    try {
      await api.createSchedule({
        hotelId: formHotelId,
        assignedUserId: formUserId,
        visitsPerMonth: formVisits,
        scheduleType: formScheduleType,
      });
      await load();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReassign(scheduleId: string, userId: string) {
    await api.reassignSchedule(scheduleId, userId);
    await load();
  }

  // FR: docs/FEATURE_SCOPE.md 우선순위 B — 호텔 담당자와 일정 공유
  async function handleShare(scheduleId: string) {
    const { path } = await api.getScheduleShareLink(scheduleId);
    const url = `${API_BASE_URL}${path}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // 클립보드 권한이 없는 브라우저 환경에서도 링크 자체는 화면에 표시해준다.
    }
    setCopiedShareId(scheduleId);
    window.setTimeout(() => setCopiedShareId((cur) => (cur === scheduleId ? null : cur)), 2500);
  }

  const overdueCount = schedules.filter((s) => s.overdue).length;

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      <h1 className="text-3xl font-bold text-foreground">일정 관리</h1>
      <p className="mt-1 text-sm text-foreground-secondary">호텔별 정기 방문 주기와 담당자를 관리하세요</p>

      {error && <p className="mt-4 rounded-xl bg-status-urgent-bg px-4 py-3 text-sm text-status-urgent">{error}</p>}
      {overdueCount > 0 && (
        <p className="mt-4 rounded-xl bg-status-urgent-bg px-4 py-3 text-sm font-medium text-status-urgent">
          🔔 미방문 알림: {overdueCount}개 호텔이 방문 예정일을 지났어요.
        </p>
      )}

      <form onSubmit={handleCreate} className="mt-8 flex flex-wrap items-end gap-3 rounded-[20px] bg-white p-6 shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
        <div>
          <label className="mb-1 block text-xs font-medium text-foreground-secondary">호텔</label>
          <select
            className="rounded-xl border border-background-subtle bg-background-subtle px-3 py-2 text-sm outline-none focus:border-primary"
            value={formHotelId}
            onChange={(e) => setFormHotelId(e.target.value)}
          >
            {hotels.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-foreground-secondary">담당 점검자</label>
          <select
            className="rounded-xl border border-background-subtle bg-background-subtle px-3 py-2 text-sm outline-none focus:border-primary"
            value={formUserId}
            onChange={(e) => setFormUserId(e.target.value)}
          >
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-foreground-secondary">월 방문 횟수</label>
          <input
            type="number"
            min={1}
            max={30}
            value={formVisits}
            onChange={(e) => setFormVisits(Number(e.target.value))}
            className="w-24 rounded-xl border border-background-subtle bg-background-subtle px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-foreground-secondary">일정 유형</label>
          <select
            className="rounded-xl border border-background-subtle bg-background-subtle px-3 py-2 text-sm outline-none focus:border-primary"
            value={formScheduleType}
            onChange={(e) => setFormScheduleType(e.target.value as ScheduleType)}
          >
            {SCHEDULE_TYPES.map((t) => (
              <option key={t} value={t}>
                {SCHEDULE_TYPE_LABEL[t]}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-nav-active-bg px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? "생성 중..." : "일정 자동 생성"}
        </button>
      </form>

      <section className="mt-6 rounded-[20px] bg-white p-6 shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
        <h2 className="text-lg font-semibold text-foreground">등록된 일정</h2>
        {loading ? (
          <p className="mt-4 text-sm text-foreground-secondary">불러오는 중...</p>
        ) : schedules.length === 0 ? (
          <p className="mt-4 text-sm text-foreground-secondary">등록된 일정이 없어요.</p>
        ) : (
          <div className="mt-4 divide-y divide-background-subtle">
            {schedules.map((s) => (
              <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {s.hotel?.name ?? s.hotelId}
                    <span className="ml-2 rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-semibold text-primary">
                      {SCHEDULE_TYPE_LABEL[s.scheduleType]}
                    </span>
                    {s.overdue && (
                      <span className="ml-2 rounded-full bg-status-urgent-bg px-2 py-0.5 text-[11px] font-semibold text-status-urgent">
                        미방문
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-foreground-secondary">
                    월 {s.visitsPerMonth}회 · 지난 방문 {s.lastVisitDate ?? "-"} · 다음 방문 예정 {s.nextVisitDate ?? "-"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    className="rounded-xl border border-background-subtle bg-background-subtle px-3 py-2 text-sm outline-none focus:border-primary"
                    value={s.assignedUserId}
                    onChange={(e) => handleReassign(s.id, e.target.value)}
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => handleShare(s.id)}
                    className="rounded-full bg-background-subtle px-3 py-2 text-xs font-semibold text-foreground-secondary transition hover:opacity-80"
                  >
                    {copiedShareId === s.id ? "링크 복사됨 ✓" : "🔗 호텔과 공유"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
