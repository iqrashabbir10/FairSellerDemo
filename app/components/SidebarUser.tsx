"use client";

import { ShieldCheck, Store } from "lucide-react";
import type { UserRole } from "@/lib/api/types";
import { useCurrentUser } from "@/lib/api/useCurrentUser";

// Signed-in user's name with a small icon showing whether they are an admin or a seller.
export function SidebarUser({ role }: { role: UserRole }) {
  const name = useCurrentUser(role);
  const Icon = role === "Admin" ? ShieldCheck : Store;
  return (
    <div className="flex items-center gap-2.5 px-3 py-2" title={`${name} (${role})`}>
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--brand)]/10 text-[var(--brand)]">
        <Icon className="h-3.5 w-3.5" aria-label={role} />
      </span>
      <span className="truncate text-sm font-semibold text-slate-900">{name}</span>
    </div>
  );
}
