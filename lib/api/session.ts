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

// Set just before the app signs someone out because of the server (account blocked, sign-in switched off), and shown
// once on the login page. sessionStorage survives the redirect but not a new tab.
const LOGOUT_REASON_KEY = "wayfeir-logout-reason";

export function setLogoutReason(message: string) {
  try {
    window.sessionStorage.setItem(LOGOUT_REASON_KEY, message);
  } catch {
    // storage blocked - the login page just won't show the explanation
  }
}

export function takeLogoutReason(): string | null {
  try {
    const reason = window.sessionStorage.getItem(LOGOUT_REASON_KEY);
    window.sessionStorage.removeItem(LOGOUT_REASON_KEY);
    return reason;
  } catch {
    return null;
  }
}
