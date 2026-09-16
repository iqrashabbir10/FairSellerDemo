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

export function getSellerSupportConversations(request?: PagedRequest) {
  return apiFetch<PagedResult<SupportConversationDto>>("/api/seller/support", { query: toPagedQuery(request) });
}

export function createSellerSupportConversation() {
  return apiFetch<SupportConversationDto>("/api/seller/support", { method: "POST" });
}

export function sendSellerSupportMessage(conversationId: string, message: string) {
  return apiFetch<SupportMessageDto>(`/api/seller/support/${conversationId}/messages`, {
    method: "POST",
    body: { message },
  });
}

export function getSellerNotifications(request?: PagedRequest) {
  return apiFetch<PagedResult<NotificationDto>>("/api/seller/notifications", { query: toPagedQuery(request) });
}

export function markSellerNotificationRead(id: string) {
  return apiFetch<{ success: boolean }>(`/api/seller/notifications/${id}/read`, { method: "POST" });
}
