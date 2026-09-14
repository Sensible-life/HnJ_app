type Slice = { label: string; value: number; color: string };

// 원형(도넛) 차트 — 문제 유형별 분석 비중 표시용. 외부 차트 라이브러리 없이 순수 SVG로 구현.
export function DonutChart({ data, size = 140 }: { data: Slice[]; size?: number }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const radius = size / 2;
  const strokeWidth = radius * 0.32;
  const innerRadius = radius - strokeWidth / 2;
  const circumference = 2 * Math.PI * innerRadius;

  let offsetAcc = 0;

  return (
    <div className="flex items-center gap-4">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="문제 유형별 비중 도넛차트">
        <circle cx={radius} cy={radius} r={innerRadius} fill="none" stroke="var(--color-background-subtle)" strokeWidth={strokeWidth} />
        {total === 0 ? null : (
          data.map((d) => {
            const fraction = d.value / total;
            const dash = fraction * circumference;
            const dashArray = `${dash} ${circumference - dash}`;
            const dashOffset = -offsetAcc;
            offsetAcc += dash;
            return (
              <circle
                key={d.label}
                cx={radius}
                cy={radius}
                r={innerRadius}
                fill="none"
                stroke={d.color}
                strokeWidth={strokeWidth}
                strokeDasharray={dashArray}
                strokeDashoffset={dashOffset}
                transform={`rotate(-90 ${radius} ${radius})`}
                strokeLinecap="butt"
              />
            );
          })
        )}
        <text x={radius} y={radius} textAnchor="middle" dominantBaseline="middle" fontSize={size * 0.16} fontWeight={700} fill="var(--color-foreground)">
          {total}
        </text>
      </svg>
      <div className="flex flex-col gap-1.5">
        {data.map((d) => (
          <div key={d.label} className="flex items-center gap-2 text-xs">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
            <span className="text-foreground-secondary">{d.label}</span>
            <span className="font-semibold text-foreground">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
