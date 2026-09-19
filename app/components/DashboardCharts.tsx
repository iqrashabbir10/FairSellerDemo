"use client";

import { useEffect, useRef, useState } from "react";

export interface DayPoint {
  label: string; // short axis label, e.g. "Sep 19"
  fullLabel: string; // tooltip title, e.g. "Sat, Sep 19"
  value: number;
}

const H = 220;
const PAD = { top: 12, right: 12, bottom: 28, left: 44 };

function useWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setWidth(el.clientWidth);
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
}

// Round the axis max up to a clean number so ticks read 0 / 5 / 10 / 15 rather than 0 / 3.7 / 7.4.
function niceScale(max: number, ticks = 4) {
  if (max <= 0) return { max: ticks, step: 1 };
  const raw = max / ticks;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 5, 10].map((m) => m * magnitude).find((s) => s >= raw) ?? raw;
  return { max: step * ticks, step };
}

export const compact = (value: number) =>
  new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);

function Frame({
  points,
  format,
  children,
  title,
}: {
  points: DayPoint[];
  format: (v: number) => string;
  title: string;
  children: (ctx: { width: number; x: (i: number) => number; y: (v: number) => number; ticks: number[]; hover: number | null; setHover: (i: number | null) => void; plotW: number; plotH: number }) => React.ReactNode;
}) {
  const [ref, width] = useWidth();
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(0, ...points.map((p) => p.value));
  const { max: axisMax, step } = niceScale(max);
  const plotW = Math.max(0, width - PAD.left - PAD.right);
  const plotH = H - PAD.top - PAD.bottom;
  // Points sit at the centre of equal slots so columns, lines and axis labels all line up.
  const x = (i: number) => PAD.left + (plotW / Math.max(1, points.length)) * (i + 0.5);
  const y = (v: number) => PAD.top + plotH - (v / axisMax) * plotH;
  const ticks = Array.from({ length: 5 }, (_, i) => i * step);
  const labelEvery = Math.ceil(points.length / Math.max(2, Math.floor(plotW / 64)));
  const active = hover !== null ? points[hover] : null;

  return (
    <div ref={ref} className="relative w-full min-w-0" style={{ height: H }} role="img" aria-label={title}>
      {width > 0 && (
        <svg width={width} height={H} className="absolute left-0 top-0 block">
          {ticks.map((tick) => (
            <g key={tick}>
              <line x1={PAD.left} x2={width - PAD.right} y1={y(tick)} y2={y(tick)} stroke="var(--chart-grid, #e7e5e4)" strokeWidth={1} />
              <text x={PAD.left - 8} y={y(tick) + 4} textAnchor="end" className="fill-slate-400 text-[11px]">
                {format(tick)}
              </text>
            </g>
          ))}
          {points.map((p, i) =>
            i % labelEvery === 0 ? (
              <text key={p.label + i} x={x(i)} y={H - 8} textAnchor="middle" className="fill-slate-400 text-[11px]">
                {p.label}
              </text>
            ) : null,
          )}
          {children({ width, x, y, ticks, hover, setHover, plotW, plotH })}
        </svg>
      )}
      {active && hover !== null && width > 0 && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg"
          style={{ left: Math.min(Math.max(x(hover), 70), width - 70), top: 0 }}
        >
          <div className="font-medium text-slate-500">{active.fullLabel}</div>
          <div className="mt-0.5 text-sm font-semibold text-slate-900">{format(active.value)}</div>
        </div>
      )}
      <table className="sr-only">
        <caption>{title}</caption>
        <tbody>
          {points.map((p) => (
            <tr key={p.fullLabel}>
              <th scope="row">{p.fullLabel}</th>
              <td>{format(p.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Column chart, one series. Columns are capped at 24px with a 4px rounded top and a square baseline. */
export function ColumnChart({ points, format, title }: { points: DayPoint[]; format: (v: number) => string; title: string }) {
  return (
    <Frame points={points} format={format} title={title}>
      {({ plotW, x, y, hover, setHover }) => {
        const slot = plotW / Math.max(1, points.length);
        const barW = Math.min(24, Math.max(4, slot - 6));
        const base = y(0);
        return (
          <>
            {points.map((p, i) => {
              const cx = x(i);
              const top = y(p.value);
              const h = Math.max(0, base - top);
              const r = Math.min(4, h, barW / 2);
              return (
                <g key={p.fullLabel} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
                  <rect x={cx - slot / 2} y={PAD.top} width={slot} height={base - PAD.top} fill="transparent" />
                  {hover === i && <rect x={cx - slot / 2} y={PAD.top} width={slot} height={base - PAD.top} fill="var(--brand)" opacity={0.06} />}
                  {h > 0 && (
                    <path
                      d={`M${cx - barW / 2},${base} V${top + r} Q${cx - barW / 2},${top} ${cx - barW / 2 + r},${top} H${cx + barW / 2 - r} Q${cx + barW / 2},${top} ${cx + barW / 2},${top + r} V${base} Z`}
                      fill="var(--brand)"
                      opacity={hover === null || hover === i ? 1 : 0.55}
                    />
                  )}
                </g>
              );
            })}
            <line x1={PAD.left} x2={PAD.left + plotW} y1={base} y2={base} stroke="var(--chart-axis, #d6d3d1)" strokeWidth={1} />
          </>
        );
      }}
    </Frame>
  );
}

/** Line chart with a 10% area wash, 2px line, and a ringed end dot. */
export function LineChart({ points, format, title }: { points: DayPoint[]; format: (v: number) => string; title: string }) {
  return (
    <Frame points={points} format={format} title={title}>
      {({ plotW, x, y, hover, setHover }) => {
        if (points.length === 0) return null;
        const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(p.value)}`).join(" ");
        const area = `${line} L${x(points.length - 1)},${y(0)} L${x(0)},${y(0)} Z`;
        const last = points.length - 1;
        const dot = hover ?? last;
        const slot = plotW / Math.max(1, points.length);
        return (
          <>
            <path d={area} fill="var(--brand)" opacity={0.1} />
            <path d={line} fill="none" stroke="var(--brand)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
            {hover !== null && <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={y(0)} stroke="var(--chart-axis, #d6d3d1)" strokeWidth={1} />}
            <circle cx={x(dot)} cy={y(points[dot].value)} r={4} fill="var(--brand)" stroke="#fff" strokeWidth={2} />
            <rect
              x={PAD.left}
              y={PAD.top}
              width={plotW}
              height={H - PAD.top - PAD.bottom}
              fill="transparent"
              onMouseMove={(event) => {
                const rect = (event.currentTarget as SVGRectElement).getBoundingClientRect();
                setHover(Math.min(last, Math.max(0, Math.floor((event.clientX - rect.left) / slot))));
              }}
              onMouseLeave={() => setHover(null)}
            />
          </>
        );
      }}
    </Frame>
  );
}
