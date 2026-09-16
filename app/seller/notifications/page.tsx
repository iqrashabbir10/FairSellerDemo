"use client";

import { useEffect, useState } from "react";
import { Bell, Check } from "lucide-react";
import { getSellerNotifications, markSellerNotificationRead } from "@/lib/api/seller";
import { ApiError } from "@/lib/api/client";
import type { NotificationDto } from "@/lib/api/types";
import { useAuthGuard } from "@/lib/api/useAuthGuard";

export default function SellerNotificationsPage() {
  const ready = useAuthGuard("Seller");
  const [items, setItems] = useState<NotificationDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await getSellerNotifications({ pageSize: 50 });
      setItems(result.items);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ready) load();
  }, [ready]);

  if (!ready) return null;

  const markRead = async (id: string) => {
    try {
      await markSellerNotificationRead(id);
      setItems((current) => current.map((item) => (item.id === id ? { ...item, isRead: true } : item)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update notification.");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-slate-500">Updates</p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Notifications</h1>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading notifications…</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No notifications yet.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {items.map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-3 p-4">
                <div className="flex gap-3">
                  <div className={`mt-1 flex h-8 w-8 items-center justify-center rounded-full ${item.isRead ? "bg-slate-100 text-slate-400" : "bg-[#fdf2ef] text-[#f0563f]"}`}>
                    <Bell className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-medium text-slate-800">{item.title}</div>
                    <p className="mt-1 text-sm text-slate-600">{item.message}</p>
                    <span className="mt-1 block text-xs text-slate-400">{new Date(item.createdAtUtc).toLocaleString()}</span>
                  </div>
                </div>
                {!item.isRead && (
                  <button onClick={() => markRead(item.id)} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
                    <Check className="h-3.5 w-3.5" />
                    Mark read
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
