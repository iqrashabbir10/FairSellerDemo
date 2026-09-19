"use client";

import { useState } from "react";
import { Gauge, Star } from "lucide-react";

export const MAX_CREDIT_SCORE = 1000;

const RATING_LABELS = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];

/** Read-only stars. `value` null/undefined renders all-empty stars. */
export function StarRating({ value, size = "h-4 w-4" }: { value: number | null | undefined; size?: string }) {
  const filled = value ?? 0;
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={value ? `${value} out of 5 stars` : "Not rated"}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={`${size} ${n <= filled ? "fill-amber-400 text-amber-400" : "fill-slate-100 text-slate-300"}`} />
      ))}
    </span>
  );
}

function scoreTone(score: number) {
  if (score >= 750) return "bg-emerald-50 text-emerald-700";
  if (score >= 500) return "bg-amber-50 text-amber-700";
  return "bg-red-50 text-red-700";
}

/** Compact "★★★★☆ · 720/1000" line used wherever a seller is shown. Shows "Not rated" until an admin rates them. */
export function SellerRatingSummary({ rating, creditScore, className = "" }: { rating?: number | null; creditScore?: number | null; className?: string }) {
  if (!rating && creditScore == null) {
    return <span className={`text-xs text-slate-400 ${className}`}>Not rated yet</span>;
  }
  return (
    <span className={`inline-flex flex-wrap items-center gap-x-2 gap-y-1 ${className}`}>
      <StarRating value={rating} size="h-3.5 w-3.5" />
      {creditScore != null && (
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${scoreTone(creditScore)}`} title="Credit score (0–1000)">
          <Gauge className="h-3 w-3" />
          {creditScore}/{MAX_CREDIT_SCORE}
        </span>
      )}
    </span>
  );
}

/** Larger read-only card for a seller's own profile page. */
export function SellerRatingCard({ rating, creditScore }: { rating?: number | null; creditScore?: number | null }) {
  const score = creditScore ?? null;
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Store rating</div>
        <div className="mt-2 flex items-center gap-2">
          <StarRating value={rating} size="h-5 w-5" />
          <span className="text-sm font-semibold text-slate-800">{rating ? `${rating}/5 · ${RATING_LABELS[rating]}` : "Not rated yet"}</span>
        </div>
      </div>
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Credit score</div>
        <div className="mt-2 text-2xl font-semibold text-slate-900">
          {score ?? "—"}
          <span className="text-sm font-normal text-slate-500"> / {MAX_CREDIT_SCORE}</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
          <div className="h-full rounded-full bg-[var(--brand)]" style={{ width: `${((score ?? 0) / MAX_CREDIT_SCORE) * 100}%` }} />
        </div>
      </div>
    </div>
  );
}

/** Admin dialog: pick 1–5 stars and a 0–1000 credit score. */
export function SellerRatingDialog({
  sellerName,
  initialRating,
  initialCreditScore,
  saving,
  error,
  onCancel,
  onSave,
}: {
  sellerName: string;
  initialRating?: number | null;
  initialCreditScore?: number | null;
  saving: boolean;
  error: string;
  onCancel: () => void;
  onSave: (rating: number, creditScore: number) => void;
}) {
  const [rating, setRating] = useState<number>(initialRating ?? 0);
  const [hover, setHover] = useState(0);
  const [scoreText, setScoreText] = useState(String(initialCreditScore ?? 0));

  const parsed = scoreText.trim() === "" ? NaN : Number(scoreText);
  const scoreValid = Number.isInteger(parsed) && parsed >= 0 && parsed <= MAX_CREDIT_SCORE;
  const canSave = rating >= 1 && scoreValid && !saving;
  const shown = hover || rating;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" onClick={saving ? undefined : onCancel}>
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl" role="dialog" aria-modal="true" aria-label="Rate seller" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-slate-900">Rate {sellerName}</h2>
        <p className="mt-1 text-sm text-slate-500">The rating and credit score are visible to the seller on their profile.</p>

        <div className="mt-5">
          <div className="text-sm font-medium text-slate-700">Star rating</div>
          <div className="mt-2 flex items-center gap-3">
            <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onMouseEnter={() => setHover(n)}
                  onClick={() => setRating(n)}
                  aria-label={`${n} star${n === 1 ? "" : "s"}`}
                  aria-pressed={rating === n}
                  className="rounded p-0.5 transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]"
                >
                  <Star className={`h-8 w-8 ${n <= shown ? "fill-amber-400 text-amber-400" : "fill-slate-100 text-slate-300"}`} />
                </button>
              ))}
            </div>
            <span className="text-sm font-medium text-slate-600">{shown ? RATING_LABELS[shown] : "Select a rating"}</span>
          </div>
        </div>

        <div className="mt-5">
          <label htmlFor="credit-score" className="text-sm font-medium text-slate-700">Credit score (0–{MAX_CREDIT_SCORE})</label>
          <div className="mt-2 flex items-center gap-3">
            <input
              type="range"
              min={0}
              max={MAX_CREDIT_SCORE}
              step={10}
              value={scoreValid ? parsed : 0}
              onChange={(e) => setScoreText(e.target.value)}
              aria-label="Credit score slider"
              className="h-2 flex-1 cursor-pointer accent-[var(--brand)]"
            />
            <input
              id="credit-score"
              type="number"
              inputMode="numeric"
              min={0}
              max={MAX_CREDIT_SCORE}
              value={scoreText}
              onChange={(e) => setScoreText(e.target.value)}
              className={`w-24 rounded-xl border px-3 py-2 text-sm outline-none focus:border-[var(--brand)] ${scoreValid ? "border-slate-200" : "border-red-300"}`}
            />
          </div>
          {!scoreValid && <p className="mt-1 text-xs text-red-600">Enter a whole number from 0 to {MAX_CREDIT_SCORE}.</p>}
        </div>

        {error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</div>}

        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onCancel} disabled={saving} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">Cancel</button>
          <button onClick={() => onSave(rating, parsed)} disabled={!canSave} className="rounded-xl bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--brand-hover)] disabled:opacity-50">
            {saving ? "Saving…" : "Save rating"}
          </button>
        </div>
      </div>
    </div>
  );
}

function creditTier(score: number) {
  if (score >= 800) return { label: "Excellent standing", tone: "text-emerald-300" };
  if (score >= 650) return { label: "Very good standing", tone: "text-emerald-300" };
  if (score >= 500) return { label: "Good standing", tone: "text-amber-300" };
  if (score >= 300) return { label: "Building credit", tone: "text-amber-300" };
  return { label: "Needs attention", tone: "text-red-300" };
}

/** Circular 0–1000 gauge drawn with an SVG arc. */
function ScoreRing({ score }: { score: number | null }) {
  const size = 132;
  const stroke = 11;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const fraction = score == null ? 0 : Math.min(Math.max(score / MAX_CREDIT_SCORE, 0), 1);
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="white"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - fraction)}
          style={{ transition: "stroke-dashoffset 800ms ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
        <span className="text-3xl font-semibold tabular-nums leading-none">{score ?? "—"}</span>
        <span className="mt-1 text-[11px] uppercase tracking-wider text-white/70">of {MAX_CREDIT_SCORE}</span>
      </div>
    </div>
  );
}

/** Top-of-dashboard banner: the seller's star rating and credit score. */
export function SellerRatingHero({ rating, creditScore, name }: { rating?: number | null; creditScore?: number | null; name?: string }) {
  const rated = !!rating || creditScore != null;
  const tier = creditScore != null ? creditTier(creditScore) : null;
  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[var(--brand)] to-[var(--brand-hover)] p-6 text-white shadow-lg sm:p-8">
      <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10" aria-hidden />
      <div className="pointer-events-none absolute -bottom-24 right-24 h-48 w-48 rounded-full bg-white/5" aria-hidden />
      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium text-white/75">{name ? `Welcome back, ${name}` : "Your seller reputation"}</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">Your seller rating</h2>
          {rated ? (
            <>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1" role="img" aria-label={rating ? `${rating} out of 5 stars` : "Not rated"}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star key={n} className={`h-7 w-7 sm:h-8 sm:w-8 ${n <= (rating ?? 0) ? "fill-amber-300 text-amber-300" : "fill-white/10 text-white/40"}`} />
                  ))}
                </span>
                <span className="text-lg font-semibold">{rating ? `${rating}.0` : "—"}<span className="text-sm font-normal text-white/70"> / 5</span></span>
              </div>
              {rating ? <p className="mt-1 text-sm text-white/80">{RATING_LABELS[rating]} · rated by the WayFeir team</p> : null}
            </>
          ) : (
            <p className="mt-3 max-w-md text-sm text-white/80">You haven&apos;t been rated yet. Once our team reviews your account activity, your star rating and credit score will appear here.</p>
          )}
        </div>

        <div className="flex items-center gap-5 self-start rounded-2xl bg-white/10 p-4 ring-1 ring-white/20 backdrop-blur-sm sm:self-auto">
          <ScoreRing score={creditScore ?? null} />
          <div>
            <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-white/75"><Gauge className="h-3.5 w-3.5" /> Credit score</div>
            <div className={`mt-1 text-sm font-semibold ${tier?.tone ?? "text-white/80"}`}>{tier?.label ?? "Not scored yet"}</div>
            <div className="mt-1 text-xs text-white/70">Scale 0 – {MAX_CREDIT_SCORE}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
