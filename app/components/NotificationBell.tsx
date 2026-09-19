"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, BellOff, CheckCheck, Volume2, VolumeX } from "lucide-react";
import { notificationMeta, relativeTime, useNotifications } from "./NotificationsProvider";

// Bell in the header: unread badge, a dropdown of recent notifications, mark-all-read and a sound switch.
export function NotificationBell() {
  const { role, items, unread, loading, soundEnabled, setSoundEnabled, open, markAllRead } = useNotifications();
  const [expanded, setExpanded] = useState(false);
  const [ringing, setRinging] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const previousUnread = useRef(unread);

  // Give the bell a little shake whenever the unread count goes up.
  useEffect(() => {
    if (unread > previousUnread.current) {
      setRinging(true);
      const timer = window.setTimeout(() => setRinging(false), 900);
      previousUnread.current = unread;
      return () => window.clearTimeout(timer);
    }
    previousUnread.current = unread;
  }, [unread]);

  useEffect(() => {
    if (!expanded) return;
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setExpanded(false);
    };
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setExpanded(false);
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [expanded]);

  const allHref = role === "Admin" ? "/admin/notifications" : "/seller/notifications";

  return (
    <div ref={rootRef} className="relative">
      <button
        onClick={() => setExpanded((v) => !v)}
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
        aria-expanded={expanded}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/30 bg-white/5 transition hover:bg-white/15"
      >
        <Bell className={`h-5 w-5 ${ringing ? "animate-[bell-ring_0.9s_ease-in-out]" : ""}`} />
        {unread > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[11px] font-bold text-[var(--brand)] shadow ring-2 ring-[var(--brand)]">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {expanded && (
        <div className="absolute right-0 z-50 mt-3 w-[380px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-800 shadow-2xl">
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
            <div className="text-sm font-semibold text-slate-900">
              Notifications {unread > 0 && <span className="ml-1 rounded-full bg-[var(--brand)]/10 px-2 py-0.5 text-xs font-semibold text-[var(--brand)]">{unread} new</span>}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
                aria-label={soundEnabled ? "Mute notification sound" : "Turn on notification sound"}
                title={soundEnabled ? "Sound on" : "Sound off"}
              >
                {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </button>
              <button
                onClick={markAllRead}
                disabled={unread === 0}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-40"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            </div>
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            {loading ? (
              <div className="space-y-3 p-4" aria-hidden>
                {[0, 1, 2].map((i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100" />)}
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-6 py-10 text-center text-sm text-slate-500">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400"><BellOff className="h-5 w-5" /></span>
                You&apos;re all caught up. New updates will show up here.
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {items.map((item) => {
                  const { icon: Icon, tone } = notificationMeta(item.type);
                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => {
                          setExpanded(false);
                          open(item);
                        }}
                        className={`flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-slate-50 ${item.isRead ? "" : "bg-[var(--brand)]/[0.04]"}`}
                      >
                        <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${tone}`}><Icon className="h-4 w-4" /></span>
                        <span className="min-w-0 flex-1">
                          <span className={`block text-sm ${item.isRead ? "font-medium text-slate-700" : "font-semibold text-slate-900"}`}>{item.title}</span>
                          <span className="line-clamp-2 block text-sm text-slate-600">{item.message}</span>
                          <span className="mt-0.5 block text-xs text-slate-400">{relativeTime(item.createdAtUtc)}</span>
                        </span>
                        {!item.isRead && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[var(--brand)]" aria-label="Unread" />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <Link href={allHref} onClick={() => setExpanded(false)} className="block border-t border-slate-100 px-4 py-3 text-center text-sm font-medium text-[var(--brand)] hover:bg-slate-50">
            View all notifications
          </Link>
        </div>
      )}
    </div>
  );
}
