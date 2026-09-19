"use client";

import { useState } from "react";
import { Check, Clock, Copy, KeyRound, LockKeyhole, Mail, ShieldCheck, UserRound } from "lucide-react";
import { Card, ChangePasswordForm } from "@/app/components/ProfileUi";
import { getSession } from "@/lib/api/session";
import { useAuthGuard } from "@/lib/api/useAuthGuard";
import { useCurrentUser } from "@/lib/api/useCurrentUser";

function Row({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 text-sm">
      <span className="inline-flex items-center gap-2 text-slate-500">
        {icon}
        {label}
      </span>
      <span className="min-w-0 text-right font-medium text-slate-800">{children}</span>
    </div>
  );
}

export default function AdminProfilePage() {
  const ready = useAuthGuard("Admin");
  const email = useCurrentUser("Admin");
  const [copied, setCopied] = useState(false);

  if (!ready) return null;

  const session = getSession();
  const expires = session?.expiresAtUtc ? new Date(session.expiresAtUtc) : null;
  const displayName = email.includes("@") ? email.split("@")[0] : email;
  const initials = displayName.slice(0, 2).toUpperCase() || "AD";

  const copyId = async () => {
    if (!session?.userId) return;
    try {
      await navigator.clipboard.writeText(session.userId);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard can be blocked (e.g. insecure context); the id is still visible to copy by hand.
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-slate-500">Account settings</p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Profile & Password</h1>
      </div>

      <section className="flex flex-wrap items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[var(--brand)]/10 text-xl font-semibold text-[var(--brand)]">{initials}</div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-xl font-semibold text-slate-900">{displayName}</h2>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
              <ShieldCheck className="h-3.5 w-3.5" />
              Administrator
            </span>
          </div>
          <p className="mt-1 truncate text-sm text-slate-500">{email}</p>
        </div>
      </section>

      <div className="grid items-start gap-6 xl:grid-cols-2">
        <Card icon={<UserRound className="h-4 w-4" />} title="Account details" hint="These details come from your sign-in and can't be edited here.">
          <div className="divide-y divide-slate-100">
            <Row icon={<Mail className="h-4 w-4" />} label="Email">
              <span className="break-all">{email}</span>
            </Row>
            <Row icon={<ShieldCheck className="h-4 w-4" />} label="Role">Marketplace administrator</Row>
            <Row icon={<KeyRound className="h-4 w-4" />} label="User ID">
              <span className="inline-flex items-center gap-2">
                <span className="max-w-[180px] truncate font-mono text-xs text-slate-600" title={session?.userId}>{session?.userId ?? "—"}</span>
                {session?.userId && (
                  <button onClick={copyId} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600" aria-label="Copy user ID">
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                )}
              </span>
            </Row>
            <Row icon={<Clock className="h-4 w-4" />} label="Session expires">
              {expires ? expires.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "—"}
            </Row>
          </div>
        </Card>

        <Card icon={<LockKeyhole className="h-4 w-4" />} title="Change password" hint="Use a strong password you don't use anywhere else.">
          <ChangePasswordForm />
        </Card>
      </div>
    </div>
  );
}
