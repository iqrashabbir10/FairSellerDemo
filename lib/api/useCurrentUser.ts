"use client";

import { useEffect, useState } from "react";
import type { UserRole } from "./types";
import { getSession } from "./session";

function emailFromToken(token?: string): string | null {
  if (!token) return null;
  try {
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const bytes = Uint8Array.from(atob(payload), (c) => c.charCodeAt(0));
    const claims = JSON.parse(new TextDecoder().decode(bytes)) as Record<string, unknown>;
    const email = claims.email ?? claims["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"];
    return typeof email === "string" && email.trim() ? email : null;
  } catch {
    return null;
  }
}

/** Email of the signed-in user, read from the JWT `email` claim (falls back to the role label). */
export function useCurrentUser(role: UserRole) {
  const [label, setLabel] = useState<string>(role);

  useEffect(() => {
    const email = emailFromToken(getSession()?.accessToken);
    if (email) setLabel(email);
  }, []);

  return label;
}
