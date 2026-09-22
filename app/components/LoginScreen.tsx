"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, Lock, ShieldCheck, Store, TriangleAlert, UserPlus } from "lucide-react";
import { login } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { clearSession, getSession, setSession, takeLogoutReason } from "@/lib/api/session";
import { getLoginStatus } from "@/lib/api/settings";
import { getSellerProfile } from "@/lib/api/seller";
import { homeFor } from "@/lib/api/roles";
import type { UserRole } from "@/lib/api/types";
import { Logo } from "@/app/components/Logo";

type Portal = "seller" | "admin";

const PENDING_MESSAGES: Record<string, string> = {
  Pending: "Your seller application is still being reviewed. You'll be able to sign in once an admin approves it.",
  Rejected: "Your seller application wasn't approved. Please contact support for details.",
  Frozen: "Your seller account is temporarily frozen. Please contact support.",
};

// Sellers and super users both count as "Admin" for the admin login (super users share the admin screens);
// anything else signing in on the admin page is the wrong portal.
const ALLOWED_ON: Record<Portal, (role: UserRole) => boolean> = {
  seller: (role) => role === "Seller",
  admin: (role) => role === "Admin" || role === "SuperUser",
};

// Someone signing in on the wrong portal is pointed at the right one instead of just being refused.
const WRONG_PORTAL: Record<Portal, { message: string; href: string; label: string }> = {
  seller: { message: "That's an admin account. Admins sign in on the admin login page.", href: "/auth/admin", label: "Go to admin login" },
  admin: { message: "That's a seller account. Sellers sign in on the seller login page.", href: "/", label: "Go to seller login" },
};

function friendlyLoginError(err: unknown) {
  if (err instanceof ApiError) {
    if (err.status === 0) return err.message; // network problem — already worded for the user
    if (err.status === 400 || err.status === 401) {
      // Lockout has its own wording from the server; everything else is a credentials problem.
      return /too many/i.test(err.message) ? err.message : "Incorrect email or password. Please check your details and try again.";
    }
    // 403s carry a message written for people: blocked account, sign-in switched off, not allowed to sign in.
    if (err.status === 403) return err.message || "This account doesn't have access to sign in. Please contact support.";
    if (err.status >= 500) return "Something went wrong on our side. Please try again in a moment.";
  }
  return "Unable to sign in. Please try again.";
}

const fieldClass =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[var(--brand)] focus:bg-white";

/** Sign-in state shared by both portals: same backend call, a check that the account belongs on this portal, redirects. */
function usePortalLogin(portal: Portal) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [wrongPortal, setWrongPortal] = useState(false);
  const [loading, setLoading] = useState(false);
  // Why this person was just signed out, and whether sign-in is currently switched off.
  const [signedOutReason, setSignedOutReason] = useState<string | null>(null);
  const [loginsOffMessage, setLoginsOffMessage] = useState<string | null>(null);

  // Already signed in: skip the form.
  useEffect(() => {
    const session = getSession();
    if (session?.mustChangePassword) {
      router.push("/auth/set-password");
      return;
    }
    if (session) router.push(homeFor(session.role));
  }, [router]);

  useEffect(() => {
    // (Only set when there is one: React dev mode runs this effect twice and the second read would clear it.)
    const reason = takeLogoutReason();
    if (reason) setSignedOutReason(reason);
    getLoginStatus()
      .then((status) => setLoginsOffMessage(status.loginsDisabled ? status.message ?? "Sign-in is temporarily unavailable. Please try again shortly." : null))
      .catch(() => {});
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setWrongPortal(false);
    setLoading(true);

    try {
      const auth = await login({ email: email.trim(), password });

      if (!ALLOWED_ON[portal](auth.role)) {
        // The account is real, just not for this page — don't leave a session behind.
        clearSession();
        setError(WRONG_PORTAL[portal].message);
        setWrongPortal(true);
        return;
      }
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

      router.push(homeFor(auth.role));
    } catch (err) {
      setError(friendlyLoginError(err));
    } finally {
      setLoading(false);
    }
  };

  return { email, setEmail, password, setPassword, showPassword, setShowPassword, error, wrongPortal, loading, submit, signedOutReason, loginsOffMessage };
}

function LoginForm({ portal, state }: { portal: Portal; state: ReturnType<typeof usePortalLogin> }) {
  const { email, setEmail, password, setPassword, showPassword, setShowPassword, error, wrongPortal, loading, submit, signedOutReason, loginsOffMessage } = state;
  return (
    <form onSubmit={submit} className="space-y-4">
      {(loginsOffMessage || signedOutReason) && (
        <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-800" role="status">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            {signedOutReason && <p className="font-semibold">You were signed out.</p>}
            <p>{loginsOffMessage ?? signedOutReason}</p>
          </div>
        </div>
      )}

      <div>
        <label htmlFor={`${portal}-email`} className="mb-2 block text-sm font-medium text-slate-700">Email</label>
        <input
          id={`${portal}-email`}
          type="email"
          required
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={fieldClass}
          placeholder={portal === "admin" ? "admin@example.com" : "you@example.com"}
        />
      </div>

      <div>
        <label htmlFor={`${portal}-password`} className="mb-2 block text-sm font-medium text-slate-700">Password</label>
        <div className="relative">
          <input
            id={`${portal}-password`}
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
          {wrongPortal && (
            <Link href={WRONG_PORTAL[portal].href} className="mt-1 block font-semibold underline">
              {WRONG_PORTAL[portal].label}
            </Link>
          )}
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
  );
}

/**
 * Seller login (the default page, "/"): the sign-in form plus a "Register as a new seller" button.
 * `inviteCode` (from a link an admin shared) is carried through to the registration form.
 */
export function SellerLoginScreen({ inviteCode }: { inviteCode?: string }) {
  const state = usePortalLogin("seller");
  const registerHref = inviteCode ? `/auth/seller-register?invite=${encodeURIComponent(inviteCode)}` : "/auth/seller-register";

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6f5f3] p-4 sm:p-6">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-center">
          <Logo size="lg" className="text-slate-900" />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_20px_70px_rgba(15,23,42,0.08)] sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--brand)]/10 text-[var(--brand)]">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Seller portal</div>
              <h1 className="text-2xl font-semibold text-slate-900">Sign in</h1>
            </div>
          </div>

          <LoginForm portal="seller" state={state} />

  
        </div>

      </div>
    </main>
  );
}

/** Admin login ("/auth/admin"): email and password only — no registration. */
export function AdminLoginScreen() {
  const state = usePortalLogin("admin");

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6f5f3] p-4 sm:p-6">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-center">
          <Logo size="lg" className="text-slate-900" />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_20px_70px_rgba(15,23,42,0.08)] sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--brand)]/10 text-[var(--brand)]">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Administration</div>
              <h1 className="text-2xl font-semibold text-slate-900">Admin login</h1>
            </div>
          </div>

          <LoginForm portal="admin" state={state} />
        </div>

        
      </div>
    </main>
  );
}
