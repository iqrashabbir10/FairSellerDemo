"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { UserRole } from "./types";
import { getSession } from "./session";

/** Redirects to the login page unless a session with the given role exists. */
export function useAuthGuard(role: UserRole) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const session = getSession();
    if (!session || session.role !== role) {
      router.replace("/");
      return;
    }
    setReady(true);
  }, [role, router]);

  return ready;
}
