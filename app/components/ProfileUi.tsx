"use client";

import { useState } from "react";
import { AlertCircle, Check, CheckCircle2, Eye, EyeOff, LockKeyhole } from "lucide-react";
import { changePassword } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";

// Building blocks shared by the seller and admin profile pages.

export const inputClass =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[var(--brand)] focus:bg-white disabled:cursor-not-allowed";

export function Card({ icon, title, hint, children }: { icon: React.ReactNode; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--brand)]/10 text-[var(--brand)]">{icon}</div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          {hint && <p className="text-sm text-slate-500">{hint}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

export function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
      {children}
      {error ? <span className="mt-1 block text-xs text-red-600">{error}</span> : hint ? <span className="mt-1 block text-xs text-slate-400">{hint}</span> : null}
    </label>
  );
}

export function Banner({ tone, children, onClose }: { tone: "success" | "error"; children: React.ReactNode; onClose?: () => void }) {
  const styles = tone === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700";
  return (
    <div className={`flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${styles}`} role={tone === "error" ? "alert" : "status"}>
      <span className="inline-flex items-start gap-2">
        {tone === "success" ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />}
        {children}
      </span>
      {onClose && <button onClick={onClose} className="opacity-60 hover:opacity-100" aria-label="Dismiss">×</button>}
    </div>
  );
}

export function ChangePasswordForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const rules = [{ label: "At least 8 characters", ok: next.length >= 8 }];
  const strong = rules.every((r) => r.ok);
  const matches = next.length > 0 && next === confirm;
  const different = next !== current;
  const canSubmit = current.length > 0 && strong && matches && different && !saving;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    setSaving(true);
    setError("");
    setDone(false);
    try {
      await changePassword({ currentPassword: current, newPassword: next, confirmPassword: confirm });
      setCurrent("");
      setNext("");
      setConfirm("");
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.errors[0] ?? err.message : "We couldn't change your password. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const type = show ? "text" : "password";

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <Banner tone="error" onClose={() => setError("")}>{error}</Banner>}
      {done && <Banner tone="success" onClose={() => setDone(false)}>Your password was changed. Use it the next time you sign in.</Banner>}

      <Field label="Current password">
        <input type={type} value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" className={inputClass} />
      </Field>
      <Field label="New password">
        <div className="relative">
          <input type={type} value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" className={`${inputClass} pr-10`} />
          <button type="button" onClick={() => setShow((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:text-slate-600" aria-label={show ? "Hide passwords" : "Show passwords"}>
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </Field>

      {next.length > 0 && (
        <ul className="grid gap-1 rounded-xl bg-slate-50 p-3 text-xs sm:grid-cols-2">
          {rules.map((rule) => (
            <li key={rule.label} className={`flex items-center gap-1.5 ${rule.ok ? "text-emerald-600" : "text-slate-500"}`}>
              <Check className={`h-3.5 w-3.5 ${rule.ok ? "" : "opacity-30"}`} />
              {rule.label}
            </li>
          ))}
        </ul>
      )}

      <Field label="Confirm new password" error={confirm.length > 0 && !matches ? "The two passwords don't match yet." : next.length > 0 && !different ? "Your new password must be different from the current one." : ""}>
        <input type={type} value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" className={inputClass} />
      </Field>

      <button
        type="submit"
        disabled={!canSubmit}
        className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[var(--brand-hover)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <LockKeyhole className="h-4 w-4" />
        {saving ? "Updating…" : "Update password"}
      </button>
    </form>
  );
}
