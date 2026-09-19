import { apiFetch, toPagedQuery } from "./client";
import type {
  AdminDashboardDto,
  AdminOrderDto,
  AdminSellerDto,
  AuditLogDto,
  CategoryDto,
  CreateInviteCodePayload,
  CreateProductPayload,
  InviteCodeDto,
  PagedRequest,
  PagedResult,
  PendingPaymentDto,
  ProductDto,
  SellerProductDto,
  SellerStatus,
  SupportConversationSummaryDto,
  SupportMessageDto,
  UpdateOrderStatusPayload,
  UpdateProductPayload,
  UpdateSellerStatusPayload,
  UpdateWithdrawalStatusPayload,
  VerifyPaymentPayload,
  WalletDto,
  WalletTransactionDto,
  WithdrawalDto,
} from "./types";

export function getAdminDashboard() {
  return apiFetch<AdminDashboardDto>("/api/admin/dashboard");
}

export function getSellerProducts(sellerId: string, page = 1, pageSize = 20) {
  return apiFetch<PagedResult<SellerProductDto>>(`/api/admin/sellers/${sellerId}/products`, {
    query: { page, pageSize },
  });
}

export function getAdminSellers(request?: PagedRequest & { status?: SellerStatus }) {
  return apiFetch<PagedResult<AdminSellerDto>>("/api/admin/sellers", {
    query: { ...toPagedQuery(request), status: request?.status },
  });
}

export function getAdminSeller(id: string) {
  return apiFetch<AdminSellerDto>(`/api/admin/sellers/${id}`);
}

export function updateSellerStatus(id: string, payload: UpdateSellerStatusPayload) {
  return apiFetch<{ success: boolean; message: string }>(`/api/admin/sellers/${id}/status`, {
    method: "PUT",
    body: payload,
  });
}

export function getAdminOrders(request?: PagedRequest) {
  return apiFetch<PagedResult<AdminOrderDto>>("/api/admin/orders", { query: toPagedQuery(request) });
}

export function getAdminOrder(id: string) {
  return apiFetch<AdminOrderDto>(`/api/admin/orders/${id}`);
}

export function updateOrderStatus(id: string, payload: UpdateOrderStatusPayload) {
  return apiFetch<{ success: boolean; message: string }>(`/api/admin/orders/${id}/status`, {
    method: "PUT",
    body: payload,
  });
}

export function getAdminProducts(request?: PagedRequest) {
  return apiFetch<PagedResult<ProductDto>>("/api/admin/products", { query: toPagedQuery(request) });
}

export function getAdminCategories() {
  return apiFetch<CategoryDto[]>("/api/admin/categories");
}

export function getAdminProduct(id: string) {
  return apiFetch<ProductDto>(`/api/admin/products/${id}`);
}

// Product save + image upload share the same endpoint via multipart/form-data.
function buildProductFormData(payload: CreateProductPayload | UpdateProductPayload) {
  const formData = new FormData();
  formData.append("name", payload.name);
  formData.append("description", payload.description);
  formData.append("categoryId", payload.categoryId);
  formData.append("supplierCost", String(payload.supplierCost));
  formData.append("sellingPrice", String(payload.sellingPrice));
  formData.append("stockQuantity", String(payload.stockQuantity));
  if ("isAvailable" in payload) {
    formData.append("isAvailable", String(payload.isAvailable));
  }
  payload.images?.forEach((image) => formData.append("images", image));
  return formData;
}

export function createAdminProduct(payload: CreateProductPayload) {
  return apiFetch<ProductDto>("/api/admin/products", { method: "POST", body: buildProductFormData(payload) });
}

export function updateAdminProduct(id: string, payload: UpdateProductPayload) {
  return apiFetch<ProductDto>(`/api/admin/products/${id}`, { method: "PUT", body: buildProductFormData(payload) });
}

export function deleteAdminProduct(id: string) {
  return apiFetch<{ success: boolean; message: string }>(`/api/admin/products/${id}`, { method: "DELETE" });
}

export function getPendingPayments() {
  return apiFetch<PendingPaymentDto[]>("/api/admin/payments/pending");
}

export function verifyPayment(id: string, payload: VerifyPaymentPayload) {
  return apiFetch<{ success: boolean; message: string }>(`/api/admin/payments/${id}/verify`, {
    method: "POST",
    body: payload,
  });
}

export function getAdminWallet(sellerId: string) {
  return apiFetch<WalletDto>(`/api/admin/wallet/${sellerId}`);
}

export function getAdminWalletTransactions(sellerId: string, request?: PagedRequest) {
  return apiFetch<PagedResult<WalletTransactionDto>>(`/api/admin/wallet/${sellerId}/transactions`, {
    query: toPagedQuery(request),
  });
}

export function getAdminWithdrawals(request?: PagedRequest) {
  return apiFetch<PagedResult<WithdrawalDto>>("/api/admin/withdrawals", { query: toPagedQuery(request) });
}

export function updateWithdrawalStatus(id: string, payload: UpdateWithdrawalStatusPayload) {
  return apiFetch<{ success: boolean; message: string }>(`/api/admin/withdrawals/${id}/status`, {
    method: "PUT",
    body: payload,
  });
}

// Plain array, not paginated — already sorted by most recent activity by the backend.
export function getAdminSupportConversations() {
  return apiFetch<SupportConversationSummaryDto[]>("/api/admin/support");
}

export function getAdminSupportMessages(conversationId: string, request?: PagedRequest) {
  return apiFetch<PagedResult<SupportMessageDto>>(`/api/admin/support/${conversationId}/messages`, {
    query: toPagedQuery(request),
  });
}

// Speculative — not in the original spec. Backend needs to add this route (see repo memory notes)
// for real cross-device read receipts; harmless no-op if it 404s (caller swallows the error).
export function markAdminSupportMessagesRead(conversationId: string) {
  return apiFetch<{ success: boolean }>(`/api/admin/support/${conversationId}/messages/read`, { method: "POST" });
}

// `attachment` is speculative — see repo memory notes for the multipart contract the backend
// needs to support; falls back to a plain JSON body when no file is attached.
export function sendAdminSupportMessage(conversationId: string, message: string, attachment?: File | null) {
  if (attachment) {
    const formData = new FormData();
    formData.append("message", message);
    formData.append("attachment", attachment);
    return apiFetch<SupportMessageDto>(`/api/admin/support/${conversationId}/messages`, { method: "POST", body: formData });
  }
  return apiFetch<SupportMessageDto>(`/api/admin/support/${conversationId}/messages`, {
    method: "POST",
    body: { message },
  });
}

export function getInviteCodes(request?: PagedRequest) {
  return apiFetch<PagedResult<InviteCodeDto>>("/api/admin/invite-codes", { query: toPagedQuery(request) });
}

export function createInviteCode(payload: CreateInviteCodePayload) {
  return apiFetch<InviteCodeDto>("/api/admin/invite-codes", { method: "POST", body: payload });
}

export function getAuditLogs(request?: PagedRequest) {
  return apiFetch<PagedResult<AuditLogDto>>("/api/admin/audit-logs", { query: toPagedQuery(request) });
}
