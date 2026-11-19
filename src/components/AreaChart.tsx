import { useId } from "react";

/** Lightweight dependency-free area chart. */
export function AreaChart({
  data,
  height = 180,
  className,
}: {
  data: number[];
  height?: number;
  className?: string;
}) {
  const id = useId().replace(/:/g, "");
  const w = 600;
  const h = height;
  const pad = 6;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * (w - pad * 2) + pad;
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    return [x, y] as const;
  });

  // smooth path (catmull-rom -> bezier)
  const line = pts
    .map((p, i) => {
      if (i === 0) return `M ${p[0]},${p[1]}`;
      const prev = pts[i - 1];
      const cx = (prev[0] + p[0]) / 2;
      return `C ${cx},${prev[1]} ${cx},${p[1]} ${p[0]},${p[1]}`;
    })
    .join(" ");

  const area = `${line} L ${pts[pts.length - 1][0]},${h} L ${pts[0][0]},${h} Z`;
  const last = pts[pts.length - 1];

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className={className}
      preserveAspectRatio="none"
      role="img"
      aria-label="Evolución de ventas"
    >
      <defs>
        <linearGradient id={`g-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgb(var(--brand))" stopOpacity="0.28" />
          <stop offset="100%" stopColor="rgb(var(--brand))" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#g-${id})`} />
      <path
        d={line}
        fill="none"
        stroke="rgb(var(--brand))"
        strokeWidth="2.5"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle cx={last[0]} cy={last[1]} r="4" fill="rgb(var(--brand))" />
      <circle cx={last[0]} cy={last[1]} r="8" fill="rgb(var(--brand))" opacity="0.18" />
    </svg>
  );
}
