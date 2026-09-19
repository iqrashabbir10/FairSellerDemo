"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Copy, LogIn, Mail, MessageCircle, Share2, UserPlus, X } from "lucide-react";
import { getInviteCodes } from "@/lib/api/admin";
import type { InviteCodeDto } from "@/lib/api/types";

type LinkKind = "portal" | "register";

const KINDS: { id: LinkKind; path: string; title: string; hint: string; icon: typeof LogIn }[] = [
  {
    id: "portal",
    path: "/auth/seller",
    title: "Seller sign-in page",
    hint: "Sellers land on a page with Sign in and a “Register as a new seller” button. Best for everyone.",
    icon: LogIn,
  },
  {
    id: "register",
    path: "/auth/seller-register",
    title: "Direct registration",
    hint: "Opens the registration form straight away. Best for brand-new sellers.",
    icon: UserPlus,
  },
];

function buildLink(path: string, invite: string) {
  const url = `${window.location.origin}${path}`;
  return invite ? `${url}?invite=${encodeURIComponent(invite)}` : url;
}

export function ShareSellerLinkDialog({ onClose, initialInvite = "" }: { onClose: () => void; initialInvite?: string }) {
  const [kind, setKind] = useState<LinkKind>("portal");
  const [invite, setInvite] = useState(initialInvite);
  const [codes, setCodes] = useState<InviteCodeDto[]>([]);
  const [copied, setCopied] = useState(false);

  // Active invite codes are optional — if they can't be loaded the link still works without one.
  useEffect(() => {
    let cancelled = false;
    getInviteCodes({ pageSize: 100 })
      .then((result) => {
        if (!cancelled) setCodes(result.items.filter((c) => c.isActive));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const active = KINDS.find((k) => k.id === kind)!;
  const link = useMemo(() => buildLink(active.path, invite), [active.path, invite]);
  const message = `You're invited to sell on WayFeir. ${kind === "portal" ? "Sign in or register here" : "Register here"}: ${link}`;
  const canNativeShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard blocked — the link is selectable in the field below.
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" onClick={onClose}>
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl" role="dialog" aria-modal="true" aria-label="Share seller link" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--brand)]/10 text-[var(--brand)]"><Share2 className="h-5 w-5" /></div>
            <h2 className="mt-3 text-lg font-semibold text-slate-900">Share seller link</h2>
            <p className="mt-1 text-sm text-slate-500">Send this link to a seller so they can sign in or register without hunting for the page.</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"><X className="h-5 w-5" /></button>
        </div>

        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          {KINDS.map((k) => {
            const Icon = k.icon;
            const selected = k.id === kind;
            return (
              <button
                key={k.id}
                type="button"
                onClick={() => setKind(k.id)}
                aria-pressed={selected}
                className={`rounded-xl border p-3 text-left transition ${selected ? "border-[var(--brand)] bg-[var(--brand)]/5 ring-1 ring-[var(--brand)]" : "border-slate-200 hover:bg-slate-50"}`}
              >
                <span className="flex items-center gap-2 text-sm font-semibold text-slate-900"><Icon className="h-4 w-4 text-[var(--brand)]" />{k.title}</span>
                <span className="mt-1 block text-xs text-slate-500">{k.hint}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-4">
          <label htmlFor="share-invite" className="text-sm font-medium text-slate-700">Invite code <span className="font-normal text-slate-400">(optional)</span></label>
          <select
            id="share-invite"
            value={invite}
            onChange={(e) => setInvite(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-[var(--brand)]"
          >
            <option value="">No invite code</option>
            {initialInvite && !codes.some((c) => c.code === initialInvite) && <option value={initialInvite}>{initialInvite}</option>}
            {codes.map((c) => (
              <option key={c.id} value={c.code}>{c.code} · {c.usedCount}/{c.maxUses} used</option>
            ))}
          </select>
          <p className="mt-1 text-xs text-slate-500">When chosen, the code is filled in for the seller on the registration form.</p>
        </div>

        <div className="mt-4">
          <div className="text-sm font-medium text-slate-700">Link</div>
          <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-1.5 pl-3">
            <input readOnly value={link} onFocus={(e) => e.currentTarget.select()} aria-label="Seller link" className="min-w-0 flex-1 bg-transparent text-sm text-slate-700 outline-none" />
            <button onClick={copy} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[var(--brand)] px-3 py-2 text-xs font-semibold text-white hover:bg-[var(--brand-hover)]">
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy link"}
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <a href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            <MessageCircle className="h-4 w-4 text-emerald-600" /> WhatsApp
          </a>
          <a href={`mailto:?subject=${encodeURIComponent("Sell on WayFeir")}&body=${encodeURIComponent(message)}`} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            <Mail className="h-4 w-4 text-sky-600" /> Email
          </a>
          {canNativeShare && (
            <button onClick={() => navigator.share({ title: "Sell on WayFeir", text: "You're invited to sell on WayFeir.", url: link }).catch(() => {})} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              <Share2 className="h-4 w-4" /> More…
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
