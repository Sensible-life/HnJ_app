import { StatCard } from "../components-stat-card";
import { BarChart } from "./components/BarChart";
import { DonutChart } from "./components/DonutChart";
import { api } from "../../lib/api";

const statusBadge = (label: string, tone: "success" | "urgent" | "caution") => {
  const toneClass =
    tone === "success"
      ? "bg-status-success-bg text-status-success"
      : tone === "urgent"
        ? "bg-status-urgent-bg text-status-urgent"
        : "bg-primary-soft text-primary";
  return <span className={`rounded-full px-3 py-1 text-xs font-medium ${toneClass}`}>{label}</span>;
};

// FR: 관리자 웹 통계 대시보드 (일일/월간, 청소 불량률, 문제 유형별 분석) — TODO.md Phase 6
export default async function DashboardPage() {
  const stats = await api.getStatsDashboard().catch(() => null);

  const dailyTrendData =
    stats?.dailyTrend.map((d) => ({ label: d.date.slice(5).replace("-", "/"), value: d.count })) ?? [];

  const donutColors = ["#DC2626", "#FDBA5C", "#2F6FED", "#16A34A", "#8A8F98"];
  const donutData =
    stats?.issueBreakdown.slice(0, 5).map((issue, i) => ({
      label: issue.itemName.length > 10 ? `${issue.itemName.slice(0, 10)}…` : issue.itemName,
      value: issue.caution + issue.urgent,
      color: donutColors[i % donutColors.length],
    })) ?? [];

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      <h1 className="text-3xl font-bold text-foreground">대시보드</h1>
      <p className="mt-1 text-sm text-foreground-secondary">전체 호텔 실시간 현황</p>

      {!stats && (
        <p className="mt-4 rounded-xl bg-status-urgent-bg px-4 py-3 text-sm text-status-urgent">
          API 서버(localhost:3001)에 연결할 수 없어 통계를 불러오지 못했어요. 서버를 실행한 뒤 새로고침 해주세요.
        </p>
      )}

      <section className="mt-8 flex flex-wrap gap-4">
        <StatCard label="오늘 점검 완료" value={`${stats?.todayCompletedCount ?? 0}건`} icon="✓" />
        <StatCard label="이번 달 점검" value={`${stats?.monthCompletedCount ?? 0}건`} icon="📅" />
        <StatCard label="긴급 미조치 건" value={`${stats?.urgentOpenCount ?? 0}건`} icon="!" />
        <StatCard label="청소 불량률" value={`${stats?.defectRatePercent ?? 0}%`} icon="⚠" />
      </section>

      <section className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-[20px] bg-white p-6 shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
          <h2 className="text-lg font-semibold text-foreground">최근 7일 점검 추이</h2>
          <p className="text-xs text-foreground-secondary">일별 완료 세션 수</p>
          <div className="mt-4">
            <BarChart data={dailyTrendData} />
          </div>
        </div>

        <div className="rounded-[20px] bg-white p-6 shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
          <h2 className="text-lg font-semibold text-foreground">문제 유형별 분석</h2>
          <p className="text-xs text-foreground-secondary">주의/긴급 발생 빈도 상위 항목</p>
          <div className="mt-4">
            {donutData.length > 0 ? (
              <DonutChart data={donutData} />
            ) : (
              <p className="text-sm text-foreground-secondary">아직 집계된 이슈가 없어요.</p>
            )}
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-[20px] bg-white p-6 shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
        <h2 className="text-lg font-semibold text-foreground">호텔별 요약</h2>
        <div className="mt-4 divide-y divide-background-subtle">
          {(stats?.byHotel.length ?? 0) === 0 && (
            <p className="py-3 text-sm text-foreground-secondary">아직 동기화된 점검 데이터가 없어요.</p>
          )}
          {stats?.byHotel.map((h) => (
            <div key={h.hotelName} className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-foreground">{h.hotelName}</p>
                <p className="text-xs text-foreground-secondary">누적 점검 {h.sessionCount}건</p>
              </div>
              {statusBadge(`불량률 ${h.defectRate}%`, h.defectRate >= 30 ? "urgent" : h.defectRate > 0 ? "caution" : "success")}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
