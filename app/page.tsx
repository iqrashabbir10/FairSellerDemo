"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Lock, ShieldCheck, Store } from "lucide-react";
import { adminLogin, sellerLogin } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { getSession, setSession } from "@/lib/api/session";

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<"admin" | "seller">("admin");
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
      const auth = role === "admin" ? await adminLogin({ email, password }) : await sellerLogin({ email, password });
      setSession(auth);
      router.push(auth.role === "Admin" ? "/admin/dashboard" : "/seller/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to sign in. Please try again.");
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
            Sign in as admin or seller to access your marketplace dashboard.
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
                <label className="mb-2 block text-sm font-medium text-slate-700">Sign in as</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole("admin")}
                    className={`inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
                      role === "admin" ? "border-[var(--brand)] bg-[var(--brand)]/10 text-[var(--brand)]" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <ShieldCheck className="h-4 w-4" />
                    Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("seller")}
                    className={`inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
                      role === "seller" ? "border-[var(--brand)] bg-[var(--brand)]/10 text-[var(--brand)]" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Store className="h-4 w-4" />
                    Seller
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
                <input
                  type="email"
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
