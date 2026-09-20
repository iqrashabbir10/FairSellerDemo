"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, Lock } from "lucide-react";
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

const fieldClass =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[var(--brand)] focus:bg-white";

/** The one login page for admins and sellers: the role comes back from the server and decides where they land. */
export function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Already signed in: skip the form.
  useEffect(() => {
    const session = getSession();
    if (session?.mustChangePassword) {
      router.push("/auth/set-password");
      return;
    }
    if (session?.role === "Admin") router.push("/admin/dashboard");
    if (session?.role === "Seller") router.push("/seller/dashboard");
  }, [router]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const auth = await login({ email: email.trim(), password });
      setSession(auth);

      // An admin reset this account's password: they must choose a new one before anything else.
      if (auth.mustChangePassword) {
        router.push("/auth/set-password");
        return;
      }

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
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--brand)] text-lg font-bold text-white">W</div>
          <div className="text-2xl font-semibold tracking-tight text-slate-900">WayFair</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_20px_70px_rgba(15,23,42,0.08)] sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--brand)]/10 text-[var(--brand)]">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Welcome back</div>
              <h1 className="text-2xl font-semibold text-slate-900">Sign in</h1>
            </div>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="mb-2 block text-sm font-medium text-slate-700">Email</label>
              <input
                id="login-email"
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={fieldClass}
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="login-password" className="mb-2 block text-sm font-medium text-slate-700">Password</label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${fieldClass} pr-10`}
                  placeholder="Enter password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-hover)] disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Login"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
