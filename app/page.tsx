"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Lock, ShieldCheck, Store } from "lucide-react";

const validUsers = {
  admin: "admin",
  seller: "saller",
};

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin");
  const [error, setError] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("wayfeir-user");
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed?.role === "admin") router.push("/admin/dashboard");
      if (parsed?.role === "seller") router.push("/seller/dashboard");
    }
  }, [router]);

  const submitLogin = (event: React.FormEvent) => {
    event.preventDefault();

    const expectedPassword = validUsers[username as keyof typeof validUsers];

    if (!expectedPassword || password !== expectedPassword) {
      setError("Invalid username or password. Try admin/admin or seller/saller");
      return;
    }

    const role = username === "admin" ? "admin" : "seller";
    localStorage.setItem("wayfeir-user", JSON.stringify({ username, role }));
    setError("");

    router.push(role === "admin" ? "/admin/dashboard" : "/seller/dashboard");
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6f5f3] p-4 sm:p-6">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_20px_70px_rgba(15,23,42,0.08)] lg:grid-cols-[1.05fr_0.95fr]">
        <div className="bg-[#f0563f] p-8 text-white sm:p-10">
          <div className="mb-10 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-lg font-bold">W</div>
            <div className="text-2xl font-semibold tracking-tight">WayFeir</div>
          </div>

          <div className="mb-6 text-sm font-medium uppercase tracking-[0.18em] text-white/80">Marketplace control</div>
          <h1 className="max-w-md text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            Sell smarter, manage faster.
          </h1>
          <p className="mt-4 max-w-md text-base text-white/85">
            Sign in as admin or seller to view the mock marketplace dashboard.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <div className="rounded-full bg-white/10 px-3 py-1.5 text-sm font-medium">Admin panel</div>
            <div className="rounded-full bg-white/10 px-3 py-1.5 text-sm font-medium">Seller onboarding</div>
            <div className="rounded-full bg-white/10 px-3 py-1.5 text-sm font-medium">Mock data</div>
          </div>
        </div>

        <div className="flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-[#fffdfc] p-5 shadow-sm sm:p-7">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f0563f]/10 text-[#f0563f]">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Welcome back</div>
                <h2 className="text-2xl font-semibold text-slate-900">Sign in</h2>
              </div>
            </div>

            <form onSubmit={submitLogin} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Username</label>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value.trim().toLowerCase())}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#f0563f] focus:bg-white"
                  placeholder="admin or seller"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#f0563f] focus:bg-white"
                  placeholder="Enter password"
                />
              </div>

              {error && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#f0563f] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#dc4b34]"
              >
                Login
                <ArrowRight className="h-4 w-4" />
              </button>

              <a
                href="/auth/seller-register"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Create new seller account
              </a>
            </form>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="mb-1 flex items-center gap-2 text-sm font-medium text-slate-800">
                  <ShieldCheck className="h-4 w-4 text-[#f0563f]" />
                  Admin
                </div>
                <div className="text-xs text-slate-500">username: admin</div>
                <div className="text-xs text-slate-500">password: admin</div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="mb-1 flex items-center gap-2 text-sm font-medium text-slate-800">
                  <Store className="h-4 w-4 text-[#f0563f]" />
                  Seller
                </div>
                <div className="text-xs text-slate-500">username: seller</div>
                <div className="text-xs text-slate-500">password: saller</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
