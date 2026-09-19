import { apiFetch } from "./client";
import type { AuthResponse, ChangePasswordPayload, LoginPayload, SellerRegisterPayload } from "./types";

export function sellerRegister(payload: SellerRegisterPayload) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(payload)) {
    if (value instanceof File) {
      formData.append(key, value);
    } else {
      formData.append(key, String(value));
    }
  }
  return apiFetch<AuthResponse>("/api/auth/seller/register", { method: "POST", body: formData, auth: false });
}

// One sign-in for everyone: the backend looks the account up and decides whether it is an admin or a seller.
export function login(payload: LoginPayload) {
  return apiFetch<AuthResponse>("/api/auth/login", { method: "POST", body: payload, auth: false });
}

export function sellerLogin(payload: LoginPayload) {
  return apiFetch<AuthResponse>("/api/auth/seller/login", { method: "POST", body: payload, auth: false });
}

export function adminLogin(payload: LoginPayload) {
  return apiFetch<AuthResponse>("/api/auth/admin/login", { method: "POST", body: payload, auth: false });
}

export function refreshToken(refreshTokenValue: string) {
  return apiFetch<AuthResponse>("/api/auth/refresh-token", {
    method: "POST",
    body: { refreshToken: refreshTokenValue },
    auth: false,
  });
}

export function changePassword(payload: ChangePasswordPayload) {
  return apiFetch<null>("/api/auth/change-password", { method: "POST", body: payload });
}

export function logout() {
  return apiFetch<{ success: boolean; message: string }>("/api/auth/logout", { method: "POST" });
}
