"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Eye, EyeOff, KeyRound, ShieldCheck } from "lucide-react";
import { setNewPassword } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { clearSession, getSession, setSession } from "@/lib/api/session";
import { homeFor } from "@/lib/api/roles";
import { Banner, Field, inputClass } from "@/app/components/ProfileUi";

const rules = (value: string) => [{ label: "At least 8 characters", ok: value.length >= 8 }];

// Shown after signing in with a temporary password issued by an admin.
export default function SetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const session = getSession();
    if (!session) {
      router.replace("/");
      return;
    }
    if (!session.mustChangePassword) {
      router.replace(homeFor(session.role));
      return;
    }
    setReady(true);
  }, [router]);

  const checklist = rules(password);
  const strong = checklist.every((r) => r.ok);
  const matches = password.length > 0 && password === confirm;
  const canSubmit = strong && matches && !saving;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    setSaving(true);
    setError("");
    try {
      const auth = await setNewPassword({ newPassword: password, confirmPassword: confirm });
      setSession(auth); // fresh tokens, no longer restricted
      router.replace(homeFor(auth.role));
    } catch (err) {
      setError(err instanceof ApiError ? err.errors[0] ?? err.message : "We couldn't save your new password. Please try again.");
      setSaving(false);
    }
  };

  const signOut = () => {
    clearSession();
    router.replace("/");
  };

  if (!ready) return null;
  const type = show ? "text" : "password";

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6f5f3] px-4 py-8">
      <div className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_70px_rgba(15,23,42,0.08)] sm:p-8">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--brand)]/10 text-[var(--brand)]">
          <KeyRound className="h-7 w-7" />
        </div>
        <h1 className="mt-5 text-2xl font-semibold tracking-tight text-slate-900">Choose a new password</h1>
        <p className="mt-2 text-sm text-slate-600">
          You signed in with a temporary password from an administrator. Set your own password to continue — you&apos;ll use it from now on.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          {error && <Banner tone="error" onClose={() => setError("")}>{error}</Banner>}

          <Field label="New password">
            <div className="relative">
              <input type={type} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" autoFocus className={`${inputClass} pr-10`} />
              <button type="button" onClick={() => setShow((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:text-slate-600" aria-label={show ? "Hide passwords" : "Show passwords"}>
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </Field>

          {password.length > 0 && (
            <ul className="grid gap-1 rounded-xl bg-slate-50 p-3 text-xs sm:grid-cols-2">
              {checklist.map((rule) => (
                <li key={rule.label} className={`flex items-center gap-1.5 ${rule.ok ? "text-emerald-600" : "text-slate-500"}`}>
                  <Check className={`h-3.5 w-3.5 ${rule.ok ? "" : "opacity-30"}`} />
                  {rule.label}
                </li>
              ))}
            </ul>
          )}

          <Field label="Confirm new password" error={confirm.length > 0 && !matches ? "The two passwords don't match yet." : ""}>
            <input type={type} value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" className={inputClass} />
          </Field>

          <button type="submit" disabled={!canSubmit} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand)] px-4 py-3 text-sm font-semibold text-white hover:bg-[var(--brand-hover)] disabled:cursor-not-allowed disabled:opacity-50">
            <ShieldCheck className="h-4 w-4" />
            {saving ? "Saving…" : "Save new password"}
          </button>
        </form>

        <button onClick={signOut} className="mt-4 w-full text-center text-sm font-medium text-slate-500 hover:text-slate-700">
          Sign out
        </button>
      </div>
    </main>
  );
}
