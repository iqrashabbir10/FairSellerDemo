"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { UserRole } from "./types";
import { getSession } from "./session";
import { isAdminRole } from "./roles";

/** Redirects to the login page unless a session with the given role exists. */
export function useAuthGuard(role: UserRole) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const session = getSession();
    // A super user is an admin too, so the Admin guard lets them through; the SuperUser guard is strict.
    const allowed = !!session && (session.role === role || (role === "Admin" && isAdminRole(session.role)));
    if (!session || !allowed) {
      router.replace("/");
      return;
    }
    if (session.mustChangePassword) {
      router.replace("/auth/set-password");
      return;
    }
    setReady(true);
  }, [role, router]);

  return ready;
}
