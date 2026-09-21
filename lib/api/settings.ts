import { apiFetch } from "./client";
import type { LoginStatusDto } from "./types";

// Public: the login page asks whether sign-in is currently switched off.
export function getLoginStatus() {
  return apiFetch<LoginStatusDto>("/api/auth/login-status", { auth: false });
}

// Super user only: read and flip the switch.
export function getLoginSwitch() {
  return apiFetch<LoginStatusDto>("/api/superuser/settings/logins");
}

export function setLoginsDisabled(disabled: boolean, message?: string) {
  return apiFetch<LoginStatusDto>("/api/superuser/settings/logins", { method: "PUT", body: { disabled, message: message || null } });
}
