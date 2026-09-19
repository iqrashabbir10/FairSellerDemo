"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Lock } from "lucide-react";
import { login } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { clearSession, getSession, setSession } from "@/lib/api/session";
import { getSellerProfile } from "@/lib/api/seller";

const PENDING_MESSAGES: Record<string, string> = {
  Pending: "Your seller application is still being reviewed. You'll be able to sign in once an admin approves it.",
  Rejected: "Your seller application wasn't approved. Please contact support for details.",
  Frozen: "Your seller account is temporarily frozen. Please contact support.",
};

function friendlyLoginError(err: unknown) {
  if (err instanceof ApiError) {
    if (err.status === 0) return err.message; // network problem — already worded for the user
    if (err.status === 400 || err.status === 401) {
      // Lockout has its own wording from the server; everything else is a credentials problem.
      return /too many/i.test(err.message) ? err.message : "Incorrect email or password. Please check your details and try again.";
    }
    if (err.status === 403) return "This account doesn't have access to sign in. Please contact support.";
    if (err.status >= 500) return "Something went wrong on our side. Please try again in a moment.";
  }
  return "Unable to sign in. Please try again.";
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const session = getSession();
    if (session?.role === "Admin") router.push("/admin/dashboard");
    if (session?.role === "Seller") router.push("/seller/dashboard");
  }, [router]);

  const submitLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const auth = await login({ email: email.trim(), password });
      setSession(auth);

      // A seller who hasn't been approved can't use the portal yet — explain why instead of dropping them on a broken dashboard.
      if (auth.role === "Seller") {
        try {
          const profile = await getSellerProfile();
          if (profile.status !== "Approved") {
            clearSession();
            setError(PENDING_MESSAGES[profile.status] ?? "Your seller account isn't active yet.");
            return;
          }
        } catch {
          // Couldn't check — let them in; the server still enforces access on every request.
        }
      }

      router.push(auth.role === "Admin" ? "/admin/dashboard" : "/seller/dashboard");
    } catch (err) {
      setError(friendlyLoginError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6f5f3] p-4 sm:p-6">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_20px_70px_rgba(15,23,42,0.08)] lg:grid-cols-[1.05fr_0.95fr]">
        <div className="bg-[var(--brand)] p-8 text-white sm:p-10">
          <div className="mb-10 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-lg font-bold">W</div>
            <div className="text-2xl font-semibold tracking-tight">WayFeir</div>
          </div>

          <div className="mb-6 text-sm font-medium uppercase tracking-[0.18em] text-white/80">Marketplace control</div>
          <h1 className="max-w-md text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            Sell smarter, manage faster.
          </h1>
          <p className="mt-4 max-w-md text-base text-white/85">
            Sign in with your email and password to open your dashboard.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <div className="rounded-full bg-white/10 px-3 py-1.5 text-sm font-medium">Admin panel</div>
            <div className="rounded-full bg-white/10 px-3 py-1.5 text-sm font-medium">Seller onboarding</div>
          </div>
        </div>

        <div className="flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-[#fffdfc] p-5 shadow-sm sm:p-7">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--brand)]/10 text-[var(--brand)]">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Welcome back</div>
                <h2 className="text-2xl font-semibold text-slate-900">Sign in</h2>
              </div>
            </div>

            <form onSubmit={submitLogin} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
                <input
                  type="email"
                  required
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[var(--brand)] focus:bg-white"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Password</label>
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[var(--brand)] focus:bg-white"
                  placeholder="Enter password"
                />
              </div>

              {error && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-hover)] disabled:opacity-60"
              >
                {loading ? "Signing in..." : "Login"}
                <ArrowRight className="h-4 w-4" />
              </button>

              <a
                href="/auth/seller-register"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Create new seller account
              </a>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
