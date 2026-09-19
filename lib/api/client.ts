// Shared fetch helper that unwraps the ApiResponse<T> envelope used by every endpoint.
import type { ApiResponse, PagedRequest } from "./types";
import { clearSession, getSession } from "./session";
import { API_BASE_URL as BASE_URL } from "./config";

export class ApiError extends Error {
  status: number;
  errors: string[];

  constructor(message: string, status: number, errors: string[] = []) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
}

interface ApiFetchOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  auth?: boolean;
}

function buildUrl(path: string, query?: ApiFetchOptions["query"]) {
  const url = new URL(path, BASE_URL);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

/** Resolves a relative path (e.g. an uploaded document URL) against the API base URL. */
export function resolveApiUrl(path?: string | null) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return new URL(path, BASE_URL).toString();
}

// Older backend builds serialised error bodies PascalCase ("Message"); lower-case the envelope keys so both work.
function normalizePayload<T>(raw: unknown): ApiResponse<T> | null {
  if (!raw || typeof raw !== "object") return null;
  const body = raw as Record<string, unknown>;
  return {
    success: (body.success ?? body.Success) as boolean,
    message: (body.message ?? body.Message ?? null) as string | null,
    errors: ((body.errors ?? body.Errors) as string[] | undefined) ?? [],
    data: (body.data ?? body.Data) as T,
  };
}

function friendlyStatusMessage(status: number) {
  switch (status) {
    case 400:
      return "That couldn't be completed. Please check your details and try again.";
    case 401:
      return "Your session has expired. Please sign in again.";
    case 403:
      return "You don't have permission to do that.";
    case 404:
    case 405:
      return "We couldn't complete that right now. Please refresh the page and try again — if it keeps happening, contact support.";
    case 408:
    case 429:
      return "Too many requests at once. Please wait a moment and try again.";
    default:
      return status >= 500 ? "Something went wrong on our side. Please try again in a moment." : "Something went wrong. Please try again.";
  }
}

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { method = "GET", body, query, auth = true } = options;

  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

  if (body !== undefined && !isFormData) {
    headers["Content-Type"] = "application/json";
  }
  // Let the browser set the multipart boundary itself when sending FormData.

  if (auth) {
    const session = getSession();
    if (session?.accessToken) {
      headers.Authorization = `Bearer ${session.accessToken}`;
    }
  }

  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: body === undefined ? undefined : isFormData ? (body as FormData) : JSON.stringify(body),
    });
  } catch {
    throw new ApiError("Unable to reach the server. Please check your connection.", 0);
  }

  let payload: ApiResponse<T> | null = null;
  try {
    payload = normalizePayload(await response.json());
  } catch {
    // No JSON body (e.g. empty 204 response).
  }

  if (!response.ok || !payload || payload.success === false) {
    const message = payload?.message || friendlyStatusMessage(response.status);
    // Session expired/invalid on an authenticated request — force back to login instead of
    // leaving the page stuck on a raw 401 error.
    if (response.status === 403 && auth && payload?.errors?.includes("PASSWORD_CHANGE_REQUIRED")) {
      if (typeof window !== "undefined" && window.location.pathname !== "/auth/set-password") {
        window.location.href = "/auth/set-password";
      }
    }
    if (response.status === 401 && auth) {
      clearSession();
      if (typeof window !== "undefined" && window.location.pathname !== "/") {
        window.location.href = "/";
      }
    }
    throw new ApiError(message, response.status, payload?.errors ?? []);
  }

  return payload.data;
}

export function toPagedQuery(request?: PagedRequest) {
  return { page: request?.page, pageSize: request?.pageSize };
}
