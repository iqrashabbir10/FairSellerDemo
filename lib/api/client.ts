// Shared fetch helper that unwraps the ApiResponse<T> envelope used by every endpoint.
import type { ApiResponse, PagedRequest } from "./types";
import { clearSession, getSession } from "./session";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://localhost:55980";

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
    payload = await response.json();
  } catch {
    // No JSON body (e.g. empty 204 response).
  }

  if (!response.ok || !payload || payload.success === false) {
    const message = payload?.message || `Request failed with status ${response.status}`;
    // Session expired/invalid on an authenticated request — force back to login instead of
    // leaving the page stuck on a raw 401 error.
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
