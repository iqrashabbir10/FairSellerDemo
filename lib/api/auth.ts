import { apiFetch } from "./client";
import type { AuthResponse, LoginPayload, SellerRegisterPayload } from "./types";

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

export function logout() {
  return apiFetch<{ success: boolean; message: string }>("/api/auth/logout", { method: "POST" });
}
