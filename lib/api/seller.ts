import { apiFetch, toPagedQuery } from "./client";
import type {
  CreateWithdrawalPayload,
  NotificationDto,
  PagedRequest,
  PagedResult,
  ProductDto,
  SellerDashboardDto,
  SellerOrderDto,
  SellerProfileDto,
  SupportConversationDto,
  SupportMessageDto,
  WalletDto,
  WalletTransactionDto,
  WithdrawalDto,
} from "./types";

export function getSellerProfile() {
  return apiFetch<SellerProfileDto>("/api/seller/profile");
}

export function getSellerDashboard() {
  return apiFetch<SellerDashboardDto>("/api/seller/dashboard");
}

export function getSellerProducts(request?: PagedRequest) {
  return apiFetch<PagedResult<ProductDto>>("/api/seller/products", { query: toPagedQuery(request) });
}

export function getSellerOrders(request?: PagedRequest) {
  return apiFetch<PagedResult<SellerOrderDto>>("/api/seller/orders", { query: toPagedQuery(request) });
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

// `attachment` is speculative — see repo memory notes for the multipart contract the backend
// needs to support; falls back to a plain JSON body when no file is attached.
export function sendSellerSupportMessage(conversationId: string, message: string, attachment?: File | null) {
  if (attachment) {
    const formData = new FormData();
    formData.append("message", message);
    formData.append("attachment", attachment);
    return apiFetch<SupportMessageDto>(`/api/seller/support/${conversationId}/messages`, { method: "POST", body: formData });
  }
  return apiFetch<SupportMessageDto>(`/api/seller/support/${conversationId}/messages`, {
    method: "POST",
    body: { message },
  });
}

export function getSellerSupportMessages(conversationId: string, request?: PagedRequest) {
  return apiFetch<PagedResult<SupportMessageDto>>(`/api/seller/support/${conversationId}/messages`, {
    query: toPagedQuery(request),
  });
}

// Speculative — not in the original spec. Backend needs to add this route (see repo memory notes)
// for real cross-device read receipts; harmless no-op if it 404s (caller swallows the error).
export function markSellerSupportMessagesRead(conversationId: string) {
  return apiFetch<{ success: boolean }>(`/api/seller/support/${conversationId}/messages/read`, { method: "POST" });
}

export function getSellerNotifications(request?: PagedRequest) {
  return apiFetch<PagedResult<NotificationDto>>("/api/seller/notifications", { query: toPagedQuery(request) });
}

export function markSellerNotificationRead(id: string) {
  return apiFetch<{ success: boolean }>(`/api/seller/notifications/${id}/read`, { method: "POST" });
}
