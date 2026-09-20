import { apiFetch, toPagedQuery } from "./client";
import type { CreateManagedUserPayload, ManagedUserDto, PagedRequest, PagedResult } from "./types";

// Super user only: every account in the system, plus adding admins / super users and blocking sign-in.
export function getManagedUsers(request?: PagedRequest & { search?: string; role?: string }) {
  return apiFetch<PagedResult<ManagedUserDto>>("/api/superuser/users", {
    query: { ...toPagedQuery(request), search: request?.search || undefined, role: request?.role || undefined },
  });
}

export function createManagedUser(payload: CreateManagedUserPayload) {
  return apiFetch<ManagedUserDto>("/api/superuser/users", { method: "POST", body: payload });
}

export function setUserBlocked(id: string, blocked: boolean) {
  return apiFetch<ManagedUserDto>(`/api/superuser/users/${id}/blocked`, { method: "PUT", body: { blocked } });
}
