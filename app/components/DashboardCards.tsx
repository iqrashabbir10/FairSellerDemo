"use client";

import type { ComponentType, ReactNode } from "react";
import Link from "next/link";
import { Star, TrendingUp, Trophy } from "lucide-react";
import type { OrderStatus } from "@/lib/api/types";
import { MAX_CREDIT_SCORE } from "./SellerRating";

/* Colourful building blocks shared by the admin and seller dashboards. Everything here only renders the
 * numbers it is given — nothing is invented. */

type IconType = ComponentType<{ className?: string }>;

export const GRADIENTS = {
  navy: "from-[#1a237e] to-[#3949ab]",
  orange: "from-[#e65100] to-[#ff9800]",
  green: "from-[#2e7d32] to-[#66bb6a]",
  blue: "from-[#1565c0] to-[#42a5f5]",
  amber: "from-[#f57f17] to-[#ffca28]",
  pink: "from-[#ad1457] to-[#f06292]",
  purple: "from-[#6a1b9a] to-[#ba68c8]",
  teal: "from-[#00695c] to-[#26a69a]",
  red: "from-[#c62828] to-[#ef5350]",
} as const;

export type GradientName = keyof typeof GRADIENTS;

// A soft pair of circles behind the content gives every card the same depth.
function Decor() {
  return (
    <>
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" aria-hidden />
      <div className="pointer-events-none absolute -bottom-10 right-16 h-24 w-24 rounded-full bg-white/[0.07]" aria-hidden />
    </>
  );
}

/** Gradient KPI tile: label, big number, icon bubble and an optional footer line. */
export function GradientStatCard({
  label,
  value,
  icon: Icon,
  gradient,
  foot,
  href,
}: {
  label: string;
  value: string;
  icon: IconType;
  gradient: GradientName;
  foot?: ReactNode;
  href?: string;
}) {
  const body = (
    <div className={`relative h-full overflow-hidden rounded-2xl bg-gradient-to-br ${GRADIENTS[gradient]} p-5 text-white shadow-lg transition duration-300 hover:-translate-y-0.5 hover:shadow-xl motion-reduce:transition-none motion-reduce:hover:translate-y-0`}>
      <Decor />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-white/85">{label}</p>
          <div className="mt-2 truncate text-2xl font-bold tracking-tight tabular-nums" title={value}>{value}</div>
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20 ring-1 ring-white/25">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {foot && <div className="relative mt-4 flex flex-wrap items-center gap-x-2 text-xs font-medium text-white/85">{foot}</div>}
    </div>
  );
  return href ? (
    <Link href={href} className="block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2">
      {body}
    </Link>
  ) : (
    body
  );
}

function creditTier(score: number) {
  if (score >= 800) return { label: "Excellent", tone: "text-emerald-300" };
  if (score >= 650) return { label: "Very good", tone: "text-emerald-300" };
  if (score >= 500) return { label: "Good", tone: "text-amber-200" };
  if (score >= 300) return { label: "Building credit", tone: "text-amber-200" };
  return { label: "Needs improvement", tone: "text-red-200" };
}

/** Navy credit-score card: the score, a progress bar and a standing label. */
export function CreditScoreCard({ score }: { score?: number | null }) {
  const has = score != null;
  const tier = has ? creditTier(score) : null;
  const pct = has ? Math.min(Math.max(score / MAX_CREDIT_SCORE, 0), 1) * 100 : 0;
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${GRADIENTS.navy} p-6 text-white shadow-lg`}>
      <Decor />
      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/75">Credit score</p>
          <div className="mt-2 text-5xl font-extrabold leading-none tabular-nums">{has ? score : "—"}</div>
          <div className="mt-4 flex items-center gap-3">
            <div className="h-2 w-32 overflow-hidden rounded-full bg-white/20" role="progressbar" aria-valuenow={has ? score : 0} aria-valuemin={0} aria-valuemax={MAX_CREDIT_SCORE} aria-label="Credit score">
              <div className="h-full rounded-full bg-emerald-300 transition-all duration-700" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-sm text-white/80">/ {MAX_CREDIT_SCORE}</span>
          </div>
          <p className={`mt-3 inline-flex items-center gap-1.5 text-sm font-semibold ${tier?.tone ?? "text-white/75"}`}>
            <Star className="h-4 w-4 fill-current" />
            {tier?.label ?? "Not scored yet"}
          </p>
        </div>
        <div className="relative hidden h-24 w-24 shrink-0 items-center justify-center sm:flex" aria-hidden>
          <Trophy className="h-14 w-14 text-white/90" />
          <TrendingUp className="absolute -bottom-1 -right-2 h-12 w-12 text-white/25" />
        </div>
      </div>
    </div>
  );
}

const RATING_LABEL = ["", "Poor", "Fair", "Good", "Very good", "Top rated seller"];

/** Orange seller-rating card: big number, five stars and a label. */
export function RatingCard({ rating }: { rating?: number | null }) {
  const value = rating ?? 0;
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${GRADIENTS.orange} p-6 text-white shadow-lg`}>
      <Decor />
      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/80">Seller rating</p>
          <div className="mt-2 text-5xl font-extrabold leading-none tabular-nums">{rating ? `${rating}.0` : "0.0"}</div>
          <div className="mt-4 flex items-center gap-1" role="img" aria-label={rating ? `${rating} out of 5 stars` : "Not rated"}>
            {[1, 2, 3, 4, 5].map((n) => (
              <Star key={n} className={`h-7 w-7 ${n <= value ? "fill-yellow-300 text-yellow-300" : "fill-white/10 text-white/50"}`} />
            ))}
          </div>
          <p className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-white/90">
            <Star className="h-4 w-4 fill-current" />
            {rating ? RATING_LABEL[rating] : "Not yet rated"}
          </p>
        </div>
        <div className="relative hidden h-24 w-24 shrink-0 items-center justify-center sm:flex" aria-hidden>
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-[#e65100] shadow-md">
            <Star className="h-9 w-9 fill-current" />
          </span>
          <span className="absolute -bottom-1 right-0 flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
            <Star className="h-7 w-7 fill-white/40 text-white/40" />
          </span>
        </div>
      </div>
    </div>
  );
}

/* ---- Order status grouping ---- */

export type StatusGroup = "New" | "Picked" | "OnWay" | "Completed" | "Cancelled";

export function groupStatus(status: OrderStatus): StatusGroup {
  switch (status) {
    case "Picked":
      return "Picked";
    case "OnTheWay":
      return "OnWay";
    case "Delivered":
    case "Completed":
      return "Completed";
    case "Cancelled":
    case "Returned":
      return "Cancelled";
    default:
      return "New";
  }
}

export const STATUS_GROUPS: { key: StatusGroup; label: string; bar: string; dot: string }[] = [
  { key: "New", label: "New", bar: "bg-sky-400", dot: "bg-sky-500" },
  { key: "Cancelled", label: "Cancelled", bar: "bg-red-400", dot: "bg-red-500" },
  { key: "OnWay", label: "On the way", bar: "bg-amber-400", dot: "bg-amber-500" },
  { key: "Picked", label: "Picked", bar: "bg-purple-400", dot: "bg-purple-500" },
  { key: "Completed", label: "Completed", bar: "bg-emerald-400", dot: "bg-emerald-500" },
];

export function countByGroup(statuses: OrderStatus[]): Record<StatusGroup, number> {
  const counts: Record<StatusGroup, number> = { New: 0, Picked: 0, OnWay: 0, Completed: 0, Cancelled: 0 };
  for (const status of statuses) counts[groupStatus(status)] += 1;
  return counts;
}

/** Navy "Sales overview": the total, a coloured tile per order stage and a few summary pills. */
export function SalesOverviewCard({
  subtitle,
  total,
  totalLabel = "Total revenue",
  counts,
  pills,
}: {
  subtitle: string;
  total: string;
  totalLabel?: string;
  counts: Record<StatusGroup, number>;
  pills: string[];
}) {
  return (
    <section className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${GRADIENTS.navy} p-5 text-white shadow-lg sm:p-6`} aria-label="Sales overview">
      <Decor />
      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Sales overview</h2>
          <p className="mt-1 text-sm text-white/75">{subtitle}</p>
        </div>
        <div className="rounded-xl bg-white/10 px-4 py-2.5 text-right ring-1 ring-white/15">
          <div className="text-2xl font-bold tabular-nums text-emerald-300">{total}</div>
          <div className="text-[11px] uppercase tracking-wider text-white/70">{totalLabel}</div>
        </div>
      </div>

      <div className="relative mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {STATUS_GROUPS.map((group) => (
          <div key={group.key} className="rounded-xl bg-white/10 p-3 text-center ring-1 ring-white/10">
            <div className="text-2xl font-bold tabular-nums">{counts[group.key].toLocaleString()}</div>
            <div className={`mx-auto mt-2 h-1 w-full rounded-full ${group.bar}`} />
            <div className="mt-2 text-xs font-medium text-white/80">{group.label}</div>
          </div>
        ))}
      </div>

      <div className="relative mt-5 flex flex-wrap gap-2">
        {pills.map((pill) => (
          <span key={pill} className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/90 ring-1 ring-white/15">
            {pill}
          </span>
        ))}
      </div>
    </section>
  );
}

/** White panel with a coloured title accent — the "secondary" cards under the gradient ones. */
export function ColorPanel({ title, accent, action, children, className = "" }: { title: string; accent: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2.5 text-base font-semibold text-slate-900">
          <span className={`h-5 w-1.5 rounded-full ${accent}`} aria-hidden />
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}
