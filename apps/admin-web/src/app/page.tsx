import { StatCard } from "./components-stat-card";

const statusBadge = (label: string, tone: "success" | "urgent") => (
  <span
    className={
      tone === "success"
        ? "rounded-full bg-status-success-bg px-3 py-1 text-xs font-medium text-status-success"
        : "rounded-full bg-status-urgent-bg px-3 py-1 text-xs font-medium text-status-urgent"
    }
  >
    {label}
  </span>
);

export default function DashboardPage() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      <h1 className="text-3xl font-bold text-foreground">대시보드</h1>
      <p className="mt-1 text-sm text-foreground-secondary">전체 호텔 실시간 현황</p>

      <section className="mt-8 flex gap-4">
        <StatCard label="오늘 점검 완료" value="14 / 28" icon="✓" />
        <StatCard label="긴급 미조치 건" value="3건" icon="!" />
        <StatCard label="승인 대기" value="5건" icon="⏳" />
      </section>

      <section className="mt-10 rounded-[20px] bg-white p-6 shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
        <h2 className="text-lg font-semibold text-foreground">최근 이슈 티켓</h2>
        <div className="mt-4 divide-y divide-background-subtle">
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium text-foreground">그랜드 워커힐 804호 · 화장실 곰팡이</p>
              <p className="text-xs text-foreground-secondary">2026-09-10 09:12 접수</p>
            </div>
            {statusBadge("긴급", "urgent")}
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium text-foreground">롯데 서울 1005호 · 에어컨 점검</p>
              <p className="text-xs text-foreground-secondary">2026-09-09 16:40 승인 완료</p>
            </div>
            {statusBadge("완료", "success")}
          </div>
        </div>
      </section>
    </main>
  );
}
