import { apiFetch, toPagedQuery } from "./client";
import type {
  AdminCreditWalletPayload,
  AdminDashboardDto,
  AdminOrderDto,
  AdminSellerDto,
  AdminWalletCreditDto,
  AuditLogDto,
  CategoryDto,
  CreateInviteCodePayload,
  CreateProductPayload,
  InviteCodeDto,
  PagedRequest,
  PagedResult,
  PendingPaymentDto,
  ProductDto,
  ResetPasswordResult,
  SellerProductDto,
  SellerStatus,
  SupportConversationSummaryDto,
  SupportMessageDto,
  UpdateOrderStatusPayload,
  UpdateProductPayload,
  UpdateSellerStatusPayload,
  UpdateWithdrawalStatusPayload,
  VerifyPaymentPayload,
  WalletCreditResultDto,
  WalletDto,
  WalletSellerOptionDto,
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

// Generates a one-time temporary password for the seller (shown once); they must pick a new one at next sign-in.
export function resetSellerPassword(id: string) {
  return apiFetch<ResetPasswordResult>(`/api/admin/sellers/${id}/reset-password`, { method: "POST" });
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

export function createAdminCategory(payload: { name: string }) {
  return apiFetch<CategoryDto>("/api/admin/categories", { method: "POST", body: payload });
}

export function updateAdminCategory(id: string, payload: { name: string }) {
  return apiFetch<CategoryDto>(`/api/admin/categories/${id}`, { method: "PUT", body: payload });
}

export function deleteAdminCategory(id: string) {
  return apiFetch<{ success: boolean; message: string }>(`/api/admin/categories/${id}`, { method: "DELETE" });
}

export function getAdminProduct(id: string) {
  return apiFetch<ProductDto>(`/api/admin/products/${id}`);
}

// supplierCost is the admin's base price; sellingPrice is the seller price (base + 23%).
// Create is multipart (images upload with the product); update is a plain JSON body per swagger.
// Stock is no longer managed in the UI, so create sends 0 and update passes the existing value through.
export function createAdminProduct(payload: CreateProductPayload) {
  const formData = new FormData();
  formData.append("name", payload.name);
  if (payload.sku) formData.append("sku", payload.sku);
  formData.append("description", payload.description);
  formData.append("categoryId", payload.categoryId);
  formData.append("supplierCost", String(payload.supplierCost));
  formData.append("sellingPrice", String(payload.sellingPrice));
  formData.append("stockQuantity", String(payload.stockQuantity ?? 0));
  // Availability is no longer editable in the UI; products are always created as available.
  formData.append("isAvailable", "true");
  payload.images?.forEach((image) => formData.append("images", image));
  return apiFetch<ProductDto>("/api/admin/products", { method: "POST", body: formData });
}

export function updateAdminProduct(id: string, payload: UpdateProductPayload) {
  const { images: _images, ...body } = payload;
  return apiFetch<ProductDto>(`/api/admin/products/${id}`, {
    method: "PUT",
    body: { ...body, stockQuantity: body.stockQuantity ?? 0 },
  });
}

// Photos of an existing product: add new ones, or remove one by id.
export function addProductImages(productId: string, files: File[]) {
  const formData = new FormData();
  files.forEach((file) => formData.append("images", file));
  return apiFetch<ProductDto>(`/api/admin/products/${productId}/images`, { method: "POST", body: formData });
}

export function deleteProductImage(productId: string, imageId: string) {
  return apiFetch<null>(`/api/admin/products/${productId}/images/${imageId}`, { method: "DELETE" });
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

// Approved sellers with their wallet balance; `search` matches seller or shop name.
export function searchWalletSellers(request?: PagedRequest & { search?: string }) {
  return apiFetch<PagedResult<WalletSellerOptionDto>>("/api/admin/wallet/sellers", {
    query: { ...toPagedQuery(request), search: request?.search },
  });
}

export function creditSellerWallet(sellerId: string, payload: AdminCreditWalletPayload) {
  return apiFetch<WalletCreditResultDto>(`/api/admin/wallet/${sellerId}/credit`, { method: "POST", body: payload });
}

export function getWalletCredits(request?: PagedRequest) {
  return apiFetch<PagedResult<AdminWalletCreditDto>>("/api/admin/wallet/credits", { query: toPagedQuery(request) });
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

// Paged and sorted by most recent activity by the backend; `search` matches seller/shop name.
export function getAdminSupportConversations(request?: PagedRequest & { search?: string }) {
  return apiFetch<PagedResult<SupportConversationSummaryDto>>("/api/admin/support", {
    query: { ...toPagedQuery(request), search: request?.search },
  });
}

export function getAdminSupportMessages(conversationId: string, request?: PagedRequest) {
  return apiFetch<PagedResult<SupportMessageDto>>(`/api/admin/support/${conversationId}/messages`, {
    query: toPagedQuery(request),
  });
}

export function markAdminSupportMessagesRead(conversationId: string) {
  return apiFetch<{ success: boolean }>(`/api/admin/support/${conversationId}/messages/read`, { method: "POST" });
}

// Attachments go to the dedicated multipart endpoint (`message` + `files`); it may reply with a single
// message or a list, so normalise to one message. Plain text uses the JSON endpoint.
export async function sendAdminSupportMessage(conversationId: string, message: string, attachment?: File | null, replyToMessageId?: string | null) {
  if (attachment) {
    const formData = new FormData();
    formData.append("message", message);
    if (replyToMessageId) formData.append("replyToMessageId", replyToMessageId);
    formData.append("files", attachment);
    const result = await apiFetch<SupportMessageDto | SupportMessageDto[]>(`/api/admin/support/${conversationId}/messages/attachments`, { method: "POST", body: formData });
    return Array.isArray(result) ? result[result.length - 1] : result;
  }
  return apiFetch<SupportMessageDto>(`/api/admin/support/${conversationId}/messages`, {
    method: "POST",
    body: { message, replyToMessageId: replyToMessageId ?? null },
  });
}

export function deleteAdminSupportMessage(conversationId: string, messageId: string) {
  return apiFetch<unknown>(`/api/admin/support/${conversationId}/messages/${messageId}`, { method: "DELETE" });
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
