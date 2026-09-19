"use client";

import { useEffect, useState } from "react";
import { BellOff, CheckCheck } from "lucide-react";
import { Pagination } from "@/app/components/Pagination";
import { getNotifications } from "@/lib/api/notifications";
import { ApiError } from "@/lib/api/client";
import type { NotificationDto, PagedResult } from "@/lib/api/types";
import { notificationMeta, relativeTime, useNotifications } from "./NotificationsProvider";

// Full-page notification history, shared by the admin and seller "Notifications" pages.
export function NotificationsView() {
  const { unread, items: recent, open, markAllRead } = useNotifications();
  const [result, setResult] = useState<PagedResult<NotificationDto> | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Re-fetch when the page changes, and whenever the bell learns of something new (a live push or a read).
  const latestId = recent[0]?.id;
  useEffect(() => {
    let cancelled = false;
    getNotifications({ page, pageSize })
      .then((data) => {
        if (!cancelled) {
          setResult(data);
          setError("");
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "We couldn't load your notifications. Please refresh the page.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page, pageSize, latestId, unread]);

  const items = (result?.items ?? []).filter((n) => !onlyUnread || !n.isRead);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">Updates</p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Notifications</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm" role="group" aria-label="Filter">
            {[
              [false, "All"],
              [true, `Unread${unread ? ` (${unread})` : ""}`],
            ].map(([value, label]) => (
              <button
                key={String(label)}
                onClick={() => setOnlyUnread(value as boolean)}
                aria-pressed={onlyUnread === value}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${onlyUnread === value ? "bg-[var(--brand)] text-white shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
              >
                {label as string}
              </button>
            ))}
          </div>
          <button onClick={markAllRead} disabled={unread === 0} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-40">
            <CheckCheck className="h-4 w-4" />
            Mark all read
          </button>
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="space-y-3 p-5" aria-hidden>
            {[0, 1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />)}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-14 text-center text-slate-500">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400"><BellOff className="h-5 w-5" /></span>
            <div className="font-medium text-slate-700">{onlyUnread ? "No unread notifications" : "No notifications yet"}</div>
            <p className="text-sm">New orders, status changes and wallet updates will appear here.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {items.map((item) => {
              const { icon: Icon, tone } = notificationMeta(item.type);
              return (
                <li key={item.id}>
                  <button onClick={() => open(item)} className={`flex w-full items-start gap-4 px-5 py-4 text-left transition hover:bg-slate-50 ${item.isRead ? "" : "bg-[var(--brand)]/[0.04]"}`}>
                    <span className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${tone}`}><Icon className="h-5 w-5" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className={`text-sm ${item.isRead ? "font-medium text-slate-700" : "font-semibold text-slate-900"}`}>{item.title}</span>
                        {!item.isRead && <span className="h-2 w-2 rounded-full bg-[var(--brand)]" aria-label="Unread" />}
                      </span>
                      <span className="mt-0.5 block text-sm text-slate-600">{item.message}</span>
                      <span className="mt-1 block text-xs text-slate-400" title={new Date(item.createdAtUtc).toLocaleString()}>{relativeTime(item.createdAtUtc)}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {result && result.totalCount > 0 && (
        <Pagination
          page={result.page}
          totalPages={result.totalPages}
          totalCount={result.totalCount}
          pageSize={pageSize}
          onChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
        />
      )}
    </div>
  );
}
