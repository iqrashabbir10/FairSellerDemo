import { apiFetch, toPagedQuery } from "./client";
import type { NotificationDto, PagedRequest, PagedResult } from "./types";

// The signed-in user's own notifications — the same endpoints serve admins and sellers.
export function getNotifications(request?: PagedRequest) {
  return apiFetch<PagedResult<NotificationDto>>("/api/notifications", { query: toPagedQuery(request) });
}

export function getUnreadNotificationCount() {
  return apiFetch<{ count: number }>("/api/notifications/unread-count");
}

export function markNotificationRead(id: string) {
  return apiFetch<null>(`/api/notifications/${id}/read`, { method: "POST" });
}

export function markAllNotificationsRead() {
  return apiFetch<null>("/api/notifications/read-all", { method: "POST" });
}
