import { apiFetch } from "./client";
import type { CreateOrderPayload, CreatedOrderDto } from "./types";

// Public checkout endpoint — no seller/admin bearer token required.
export function createOrder(payload: CreateOrderPayload) {
  return apiFetch<CreatedOrderDto[]>("/api/orders", { method: "POST", body: payload, auth: false });
}
