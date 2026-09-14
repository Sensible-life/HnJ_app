import { StatCard } from "../components-stat-card";
import { BarChart } from "./components/BarChart";
import { DonutChart } from "./components/DonutChart";
import { StackedBarChart } from "./components/StackedBarChart";
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
        <StatCard
          label="전월 대비 개선율"
          value={
            stats?.improvementRatePercent === null || stats?.improvementRatePercent === undefined
              ? "—"
              : `${stats.improvementRatePercent > 0 ? "▲" : stats.improvementRatePercent < 0 ? "▼" : ""} ${Math.abs(stats.improvementRatePercent)}%`
          }
          icon="📈"
        />
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
        <h2 className="text-lg font-semibold text-foreground">호텔별 문제 발생 순위</h2>
        <div className="mt-4 divide-y divide-background-subtle">
          {(stats?.byHotel.length ?? 0) === 0 && (
            <p className="py-3 text-sm text-foreground-secondary">아직 동기화된 점검 데이터가 없어요.</p>
          )}
          {stats?.byHotel.map((h) => (
            <div key={h.hotelName} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-background-subtle text-xs font-bold text-foreground-secondary">
                  {h.rank}
                </span>
                <div>
                  <p className="text-sm font-medium text-foreground">{h.hotelName}</p>
                  <p className="text-xs text-foreground-secondary">누적 점검 {h.sessionCount}건 · 문제 {h.badCount}건</p>
                </div>
              </div>
              {statusBadge(`불량률 ${h.defectRate}%`, h.defectRate >= 30 ? "urgent" : h.defectRate > 0 ? "caution" : "success")}
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-[20px] bg-white p-6 shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
          <h2 className="text-lg font-semibold text-foreground">담당자별 점검 실적</h2>
          <div className="mt-4 divide-y divide-background-subtle">
            {(stats?.byInspector.length ?? 0) === 0 && (
              <p className="py-3 text-sm text-foreground-secondary">아직 담당자 실적 데이터가 없어요.</p>
            )}
            {stats?.byInspector.map((insp) => (
              <div key={insp.inspectorName} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{insp.inspectorName}</p>
                  <p className="text-xs text-foreground-secondary">
                    점검 {insp.sessionCount}건 · 긴급 {insp.urgentCount}건
                  </p>
                </div>
                {statusBadge(`불량률 ${insp.defectRate}%`, insp.defectRate >= 30 ? "urgent" : insp.defectRate > 0 ? "caution" : "success")}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[20px] bg-white p-6 shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
          <h2 className="text-lg font-semibold text-foreground">청소팀별 인스펙션 점수</h2>
          <p className="text-xs text-foreground-secondary">정상 판정 비율 기준 (100점 만점)</p>
          <div className="mt-4 divide-y divide-background-subtle">
            {(stats?.byCleaningTeam.length ?? 0) === 0 && (
              <p className="py-3 text-sm text-foreground-secondary">청소팀이 기록된 점검이 아직 없어요.</p>
            )}
            {stats?.byCleaningTeam.map((team) => (
              <div key={team.teamName} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{team.teamName}</p>
                  <p className="text-xs text-foreground-secondary">점검 {team.sessionCount}건</p>
                </div>
                {statusBadge(
                  team.score === null ? "—" : `${team.score}점`,
                  team.score === null ? "caution" : team.score >= 80 ? "success" : team.score >= 50 ? "caution" : "urgent",
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-[20px] bg-white p-6 shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
          <h2 className="text-lg font-semibold text-foreground">객실별 문제 발생 횟수</h2>
          <div className="mt-4 divide-y divide-background-subtle">
            {(stats?.byRoom.length ?? 0) === 0 && (
              <p className="py-3 text-sm text-foreground-secondary">아직 집계된 데이터가 없어요.</p>
            )}
            {stats?.byRoom.slice(0, 8).map((r) => (
              <div key={`${r.hotelName}__${r.roomLabel}`} className="flex items-center justify-between py-2.5">
                <p className="text-sm text-foreground">
                  {r.hotelName} · {r.roomLabel}
                </p>
                <span className="text-xs font-semibold text-foreground-secondary">{r.badCount}건</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[20px] bg-white p-6 shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
          <h2 className="text-lg font-semibold text-foreground">반복 문제 객실 (재발)</h2>
          <p className="text-xs text-foreground-secondary">같은 객실·같은 항목이 2회 이상 주의/긴급으로 판정된 경우</p>
          <div className="mt-4 divide-y divide-background-subtle">
            {(stats?.recurringIssues.length ?? 0) === 0 && (
              <p className="py-3 text-sm text-foreground-secondary">반복 발생한 문제가 아직 없어요.</p>
            )}
            {stats?.recurringIssues.slice(0, 8).map((r) => (
              <div key={`${r.hotelName}__${r.roomLabel}__${r.itemName}`} className="flex items-center justify-between py-2.5">
                <p className="text-sm text-foreground">
                  {r.hotelName} · {r.roomLabel} · {r.itemName}
                </p>
                {statusBadge(`${r.count}회 재발`, "urgent")}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-[20px] bg-white p-6 shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
        <h2 className="text-lg font-semibold text-foreground">화장실 상태 변화 그래프</h2>
        <p className="text-xs text-foreground-secondary">BATH PRO 세션의 최근 14일 정상/주의/긴급 추이</p>
        <div className="mt-4">
          {stats && stats.bathProTrend.some((d) => d.normal + d.caution + d.urgent > 0) ? (
            <StackedBarChart
              data={stats.bathProTrend.map((d) => ({
                label: d.date.slice(5).replace("-", "/"),
                normal: d.normal,
                caution: d.caution,
                urgent: d.urgent,
              }))}
            />
          ) : (
            <p className="text-sm text-foreground-secondary">아직 BATH PRO 점검 데이터가 없어요.</p>
          )}
        </div>
      </section>
    </main>
  );
}
