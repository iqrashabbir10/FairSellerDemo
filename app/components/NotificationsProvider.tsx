"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Bell, PackageCheck, RefreshCw, ShoppingBag, Wallet, X, type LucideIcon } from "lucide-react";
import { getNotifications, getUnreadNotificationCount, markAllNotificationsRead, markNotificationRead } from "@/lib/api/notifications";
import type { NotificationDto, UserRole } from "@/lib/api/types";
import { onNotificationReceived, onReconnected } from "@/lib/signalr/supportHub";
import { isNotificationSoundEnabled, playNotificationSound, setNotificationSoundEnabled, unlockAudio } from "@/lib/notificationSound";

const RECENT_COUNT = 15;
const TOAST_MS = 7000;
const MAX_TOASTS = 3;

export interface NotificationMeta {
  icon: LucideIcon;
  tone: string;
}

/** Icon + colour for a notification, chosen from its type. */
export function notificationMeta(type?: string | null): NotificationMeta {
  switch (type) {
    case "OrderAssigned":
    case "OrderCreated":
      return { icon: ShoppingBag, tone: "bg-blue-50 text-blue-600" };
    case "OrderStatusChanged":
      return { icon: RefreshCw, tone: "bg-amber-50 text-amber-600" };
    case "OrderPicked":
      return { icon: PackageCheck, tone: "bg-emerald-50 text-emerald-600" };
    case "WalletCredited":
    case "WithdrawalApproved":
      return { icon: Wallet, tone: "bg-emerald-50 text-emerald-600" };
    case "WithdrawalRequested":
      return { icon: Wallet, tone: "bg-amber-50 text-amber-600" };
    case "WithdrawalRejected":
      return { icon: Wallet, tone: "bg-red-50 text-red-600" };
    default:
      return { icon: Bell, tone: "bg-slate-100 text-slate-500" };
  }
}

export function relativeTime(iso: string) {
  const seconds = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 45) return "Just now";
  if (seconds < 3600) return `${Math.max(1, Math.round(seconds / 60))} min ago`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)} h ago`;
  if (seconds < 86400 * 7) return `${Math.round(seconds / 86400)} d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

interface NotificationsContextValue {
  role: UserRole;
  items: NotificationDto[];
  unread: number;
  loading: boolean;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  hrefFor: (notification: NotificationDto) => string;
  open: (notification: NotificationDto) => void;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  refresh: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export function useNotifications() {
  const value = useContext(NotificationsContext);
  if (!value) throw new Error("useNotifications must be used inside <NotificationsProvider>");
  return value;
}

interface Toast {
  key: string;
  notification: NotificationDto;
}

// Owns the signed-in user's notification state for a whole layout: loads recent items, listens for live pushes,
// and shows a toast + plays a sound when a new one arrives.
export function NotificationsProvider({ role, children }: { role: UserRole; children: ReactNode }) {
  const router = useRouter();
  const [items, setItems] = useState<NotificationDto[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [soundEnabled, setSoundState] = useState(true);
  const timers = useRef(new Map<string, number>());

  const basePath = role === "Admin" ? "/admin" : "/seller";

  const hrefFor = useCallback(
    (notification: NotificationDto) => {
      switch (notification.entityType) {
        case "Order":
          return `${basePath}/orders`;
        case "Wallet":
          return `${basePath}/wallet`;
        case "Withdrawal":
          // Admins review requests on their own page; sellers follow them on the wallet page.
          return basePath === "/admin" ? "/admin/withdrawals" : "/seller/wallet";
        default:
          return `${basePath}/notifications`;
      }
    },
    [basePath],
  );

  const refresh = useCallback(async () => {
    try {
      const [page, count] = await Promise.all([getNotifications({ page: 1, pageSize: RECENT_COUNT }), getUnreadNotificationCount()]);
      setItems(page.items);
      setUnread(count.count);
    } catch {
      // Keep whatever we already have; the next push or refresh will correct it.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setSoundState(isNotificationSoundEnabled());
    refresh();
  }, [refresh]);

  // Browsers block audio until the user has interacted with the page once — unlock on the first click / key press.
  useEffect(() => {
    const unlock = () => {
      unlockAudio();
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  const dismissToast = useCallback((key: string) => {
    const timer = timers.current.get(key);
    if (timer) window.clearTimeout(timer);
    timers.current.delete(key);
    setToasts((current) => current.filter((t) => t.key !== key));
  }, []);

  const showToast = useCallback(
    (notification: NotificationDto) => {
      const key = `${notification.id}-${Date.now()}`;
      setToasts((current) => [{ key, notification }, ...current].slice(0, MAX_TOASTS));
      timers.current.set(key, window.setTimeout(() => dismissToast(key), TOAST_MS));
    },
    [dismissToast],
  );

  useEffect(() => {
    const timerMap = timers.current;
    const offPush = onNotificationReceived(({ notification, unreadCount }) => {
      setItems((current) => (current.some((n) => n.id === notification.id) ? current : [notification, ...current].slice(0, RECENT_COUNT)));
      setUnread(unreadCount);
      showToast(notification);
      playNotificationSound();
    });
    // Anything pushed while we were disconnected is only visible after a re-fetch.
    const offReconnect = onReconnected(() => {
      refresh();
    });
    const onVisible = () => document.visibilityState === "visible" && refresh();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      offPush();
      offReconnect();
      document.removeEventListener("visibilitychange", onVisible);
      timerMap.forEach((timer) => window.clearTimeout(timer));
      timerMap.clear();
    };
  }, [refresh, showToast]);

  const markRead = useCallback(async (id: string) => {
    let wasUnread = false;
    setItems((current) =>
      current.map((n) => {
        if (n.id === id && !n.isRead) {
          wasUnread = true;
          return { ...n, isRead: true };
        }
        return n;
      }),
    );
    if (wasUnread) setUnread((count) => Math.max(0, count - 1));
    try {
      await markNotificationRead(id);
    } catch {
      refresh();
    }
  }, [refresh]);

  const markAllRead = useCallback(async () => {
    setItems((current) => current.map((n) => ({ ...n, isRead: true })));
    setUnread(0);
    try {
      await markAllNotificationsRead();
    } catch {
      refresh();
    }
  }, [refresh]);

  const open = useCallback(
    (notification: NotificationDto) => {
      if (!notification.isRead) void markRead(notification.id);
      router.push(hrefFor(notification));
    },
    [hrefFor, markRead, router],
  );

  const setSoundEnabled = useCallback((enabled: boolean) => {
    setNotificationSoundEnabled(enabled);
    setSoundState(enabled);
    if (enabled) {
      unlockAudio();
      playNotificationSound(); // a short preview so the user hears what they turned on
    }
  }, []);

  const value = useMemo<NotificationsContextValue>(
    () => ({ role, items, unread, loading, soundEnabled, setSoundEnabled, hrefFor, open, markRead, markAllRead, refresh }),
    [role, items, unread, loading, soundEnabled, setSoundEnabled, hrefFor, open, markRead, markAllRead, refresh],
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-20 z-[70] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-3" aria-live="polite">
        {toasts.map(({ key, notification }) => {
          const { icon: Icon, tone } = notificationMeta(notification.type);
          return (
            <div
              key={key}
              role="status"
              className="pointer-events-auto relative flex animate-[toast-in_0.3s_ease-out] cursor-pointer items-start gap-3 overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 pr-10 shadow-xl"
              onClick={() => {
                dismissToast(key);
                open(notification);
              }}
            >
              <span className="absolute inset-y-0 left-0 w-1 bg-[var(--brand)]" />
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${tone}`}>
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-slate-900">{notification.title}</div>
                <p className="mt-0.5 line-clamp-2 text-sm text-slate-600">{notification.message}</p>
                <span className="mt-1 block text-xs font-medium text-[var(--brand)]">View</span>
              </div>
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  dismissToast(key);
                }}
                className="absolute right-2 top-2 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                aria-label="Dismiss notification"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </NotificationsContext.Provider>
  );
}
