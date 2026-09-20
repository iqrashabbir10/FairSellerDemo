import { apiFetch, toPagedQuery } from "./client";
import type {
  CreateWithdrawalPayload,
  PagedRequest,
  PagedResult,
  PickOrderResultDto,
  ProductDto,
  SellerDashboardDto,
  SellerProductDto,
  SellerOrderDto,
  SellerProfileDto,
  UpdateSellerProfilePayload,
  SupportConversationDto,
  SupportMessageDto,
  WalletDto,
  WalletTransactionDto,
  WithdrawalDto,
} from "./types";

export function getSellerProfile() {
  return apiFetch<SellerProfileDto>("/api/seller/profile");
}

export function updateSellerProfile(payload: UpdateSellerProfilePayload) {
  return apiFetch<SellerProfileDto>("/api/seller/profile", { method: "PUT", body: payload });
}

export function getSellerDashboard() {
  return apiFetch<SellerDashboardDto>("/api/seller/dashboard");
}

export function getSellerProducts(request?: PagedRequest) {
  return apiFetch<PagedResult<ProductDto>>("/api/seller/products", { query: toPagedQuery(request) });
}

// The signed-in seller's own listings (not the catalog).
export function getSellerListings(request?: PagedRequest & { search?: string }) {
  return apiFetch<PagedResult<SellerProductDto>>("/api/seller/products/mine", {
    query: { ...toPagedQuery(request), search: request?.search },
  });
}

export function getSellerOrders(request?: PagedRequest) {
  return apiFetch<PagedResult<SellerOrderDto>>("/api/seller/orders", { query: toPagedQuery(request) });
}

export function pickSellerOrder(orderId: string) {
  return apiFetch<PickOrderResultDto>(`/api/seller/orders/${orderId}/pick`, { method: "POST" });
}

export function getSellerWallet() {
  return apiFetch<WalletDto>("/api/seller/wallet");
}

export function getSellerWalletTransactions(request?: PagedRequest) {
  return apiFetch<PagedResult<WalletTransactionDto>>("/api/seller/wallet/transactions", { query: toPagedQuery(request) });
}

export function getSellerWithdrawals(request?: PagedRequest) {
  return apiFetch<PagedResult<WithdrawalDto>>("/api/seller/withdrawals", { query: toPagedQuery(request) });
}

export function createSellerWithdrawal(payload: CreateWithdrawalPayload) {
  return apiFetch<WithdrawalDto>("/api/seller/withdrawals", { method: "POST", body: payload });
}

// Plain array, not paginated — resolve the seller's own conversation(s) before sending anything.
export function getSellerSupportConversations() {
  return apiFetch<SupportConversationDto[]>("/api/seller/support");
}

export function createSellerSupportConversation() {
  return apiFetch<SupportConversationDto>("/api/seller/support", { method: "POST" });
}

// Attachments go to the dedicated multipart endpoint (`message` + `files`); it may reply with a single
// message or a list, so normalise to one message. Plain text uses the JSON endpoint.
export async function sendSellerSupportMessage(conversationId: string, message: string, attachment?: File | null, replyToMessageId?: string | null) {
  if (attachment) {
    const formData = new FormData();
    formData.append("message", message);
    if (replyToMessageId) formData.append("replyToMessageId", replyToMessageId);
    formData.append("files", attachment);
    const result = await apiFetch<SupportMessageDto | SupportMessageDto[]>(`/api/seller/support/${conversationId}/messages/attachments`, { method: "POST", body: formData });
    return Array.isArray(result) ? result[result.length - 1] : result;
  }
  return apiFetch<SupportMessageDto>(`/api/seller/support/${conversationId}/messages`, {
    method: "POST",
    body: { message, replyToMessageId: replyToMessageId ?? null },
  });
}

export function getSellerSupportMessages(conversationId: string, request?: PagedRequest) {
  return apiFetch<PagedResult<SupportMessageDto>>(`/api/seller/support/${conversationId}/messages`, {
    query: toPagedQuery(request),
  });
}

export function markSellerSupportMessagesRead(conversationId: string) {
  return apiFetch<{ success: boolean }>(`/api/seller/support/${conversationId}/messages/read`, { method: "POST" });
}
