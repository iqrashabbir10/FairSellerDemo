// Client-side session storage for the WAYFEIR JWT auth state.
import type { UserRole } from "./types";

const STORAGE_KEY = "wayfeir-session";

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  expiresAtUtc: string;
  userId: string;
  role: UserRole;
  mustChangePassword?: boolean;
}

export function getSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

export function setSession(session: AuthSession) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearSession() {
  window.localStorage.removeItem(STORAGE_KEY);
}
