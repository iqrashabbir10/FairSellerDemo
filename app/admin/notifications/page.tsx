"use client";

import { NotificationsView } from "@/app/components/NotificationsView";
import { useAuthGuard } from "@/lib/api/useAuthGuard";

export default function AdminNotificationsPage() {
  const ready = useAuthGuard("Admin");
  if (!ready) return null;
  return <NotificationsView />;
}
