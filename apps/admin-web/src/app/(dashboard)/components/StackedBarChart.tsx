// FR: docs/FEATURE_SCOPE.md 우선순위 B — 화장실 상태 변화 그래프 (BATH PRO 일자별 정상/주의/긴급 추이)
type Point = { label: string; normal: number; caution: number; urgent: number };

export function StackedBarChart({ data, height = 140 }: { data: Point[]; height?: number }) {
  const totals = data.map((d) => d.normal + d.caution + d.urgent);
  const max = Math.max(1, ...totals);
  const barWidth = 16;
  const gap = 8;
  const width = data.length * (barWidth + gap) + gap;

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height + 24}`} role="img" aria-label="화장실 상태 변화 그래프">
      {data.map((d, i) => {
        const total = d.normal + d.caution + d.urgent;
        const scale = total > 0 ? height / max : 0;
        const urgentH = d.urgent * scale;
        const cautionH = d.caution * scale;
        const normalH = d.normal * scale;
        const x = gap + i * (barWidth + gap);
        let y = height;
        const segments: { h: number; color: string }[] = [
          { h: normalH, color: "#16A34A" },
          { h: cautionH, color: "#FDBA5C" },
          { h: urgentH, color: "#DC2626" },
        ];
        return (
          <g key={d.label}>
            {segments.map((seg, si) => {
              if (seg.h <= 0) return null;
              y -= seg.h;
              return <rect key={si} x={x} y={y} width={barWidth} height={seg.h} rx={3} fill={seg.color} />;
            })}
            <text x={x + barWidth / 2} y={height + 16} textAnchor="middle" fontSize="9" fill="var(--color-foreground-secondary)">
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
