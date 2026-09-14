type Point = { label: string; value: number };

export function BarChart({ data, height = 140 }: { data: Point[]; height?: number }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const barWidth = 28;
  const gap = 16;
  const width = data.length * (barWidth + gap) + gap;

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height + 24}`} role="img" aria-label="일별 점검 건수 막대그래프">
      {data.map((d, i) => {
        const barHeight = Math.max(2, (d.value / max) * height);
        const x = gap + i * (barWidth + gap);
        const y = height - barHeight;
        return (
          <g key={d.label}>
            <rect x={x} y={y} width={barWidth} height={barHeight} rx={6} fill="var(--color-primary)" opacity={0.85} />
            <text x={x + barWidth / 2} y={height + 16} textAnchor="middle" fontSize="10" fill="var(--color-foreground-secondary)">
              {d.label}
            </text>
            {d.value > 0 && (
              <text x={x + barWidth / 2} y={y - 4} textAnchor="middle" fontSize="10" fill="var(--color-foreground)">
                {d.value}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
