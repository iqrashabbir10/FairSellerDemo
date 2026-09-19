// Shared API envelope types and DTOs matching the WAYFEIR backend contract.

export interface ApiResponse<T> {
  success: boolean;
  message: string | null;
  errors: string[];
  data: T;
}

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface PagedRequest {
  page?: number;
  pageSize?: number;
}

// ---- Enums ----

export type UserRole = "Seller" | "Admin";

export type SellerStatus = "Pending" | "Approved" | "Rejected" | "Frozen";

export type IdentityDocumentType = "CNIC" | "Passport" | "Driving License" | "Other Government ID";

export type OrderStatus =
  | "Pending"
  | "PaymentRequired"
  | "PaymentVerification"
  | "ReadyToPick"
  | "Picked"
  | "OnTheWay"
  | "Delivered"
  | "Completed"
  | "Processing"
  | "Cancelled"
  | "Returned";

export type PaymentStatus = "PendingVerification" | "Verified" | "Rejected";

export type WithdrawalStatus = "Pending" | "Approved" | "Rejected" | "Paid";

export type WithdrawalMethod = "BankTransfer" | "CashOnHand" | "MobileWallet";

export type SupportStatus = "Open" | "Pending" | "Resolved" | "Closed";

export type WalletTransactionType =
  | "Credit"
  | "Debit"
  | "Adjustment"
  | "ProfitCredit"
  | "Withdrawal"
  | "Refund";

// ---- Auth ----

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresAtUtc: string;
  userId: string;
  role: UserRole;
}

export interface SellerRegisterPayload {
  fullName: string;
  phoneNumber: string;
  email: string;
  password: string;
  confirmPassword: string;
  inviteCode: string;
  termsAccepted: boolean;
  shopName: string;
  shopCategory: string;
  shopDescription: string;
  address: string;
  city: string;
  country: string;
  postalCode: string;
  idType: IdentityDocumentType;
  idNumber: string;
  identityDocument: File;
}

export interface LoginPayload {
  email: string;
  password: string;
}

// ---- Seller ----

export interface SellerProfileDto {
  id: string;
  fullName: string;
  phoneNumber: string;
  status: SellerStatus;
  createdAtUtc: string;
  shopName: string;
  shopCategory: string;
  shopDescription: string;
  address: string;
  city: string;
  country: string;
  postalCode: string;
  idType: IdentityDocumentType;
  idNumber: string;
  documentUrl: string | null;
}

export interface SellerDashboardDto {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  walletBalance: number;
  expectedProfitTotal: number;
  pendingWithdrawals: number;
}

export interface ProductDto {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  categoryName: string;
  supplierCost: number;
  sellingPrice: number;
  stockQuantity: number;
  isAvailable: boolean;
  imageUrls?: string[];
}

export interface CategoryDto {
  id: string;
  name: string;
}

export interface SellerOrderDto {
  id: string;
  orderNumber: string;
  productId: string;
  quantity: number;
  sellingPrice: number;
  expectedProfit: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  createdAtUtc: string;
}

export interface WalletDto {
  id: string;
  sellerId: string;
  balance: number;
  currency: string;
}

export interface WalletTransactionDto {
  id: string;
  type: WalletTransactionType;
  amount: number;
  previousBalance: number;
  newBalance: number;
  createdAtUtc: string;
}

export interface WithdrawalDto {
  id: string;
  sellerId: string;
  amount: number;
  status: WithdrawalStatus;
  requestedAtUtc: string;
}

export interface CreateWithdrawalPayload {
  amount: number;
  withdrawalMethod: WithdrawalMethod;
  paymentDetails: string;
}

export interface SupportConversationDto {
  id: string;
  sellerId: string;
  status: SupportStatus;
  createdAtUtc: string;
}

// Admin's GET /api/admin/support list only — already includes seller/shop names + last message
// preview so the inbox doesn't need a separate per-seller lookup.
export interface SupportConversationSummaryDto {
  id: string;
  sellerId: string;
  sellerName: string;
  shopName: string;
  status: SupportStatus;
  createdAtUtc: string;
  lastMessageAtUtc: string | null;
  lastMessage: string | null;
}

export interface SupportMessageDto {
  id: string;
  conversationId: string;
  senderUserId: string;
  message: string;
  createdAtUtc: string;
  // Optional — only present if the backend implements read receipts (see MarkAsRead endpoints).
  readAtUtc?: string | null;
  // Optional — only present if the backend implements chat attachments (see repo memory notes).
  attachmentUrl?: string | null;
  attachmentType?: "Image" | "File" | null;
  attachmentName?: string | null;
}

export interface NotificationDto {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAtUtc: string;
}

export interface AddSellerProductRequest {
  productId: string;
  quantity: number;
}

export interface SellerProductDto {
  id: string;
  sellerId: string;
  productId: string;
  productName: string;
  quantity: number;
  supplierCost: number;
  sellingPrice: number;
  imageUrls?: string[];
}

// ---- Public checkout / order creation ----

export interface CreateOrderCustomerPayload {
  name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  location: string | null;
}

export interface CreateOrderItemPayload {
  sellerProductId: string;
  productId: string;
  quantity: number;
}

export interface CreateOrderPayload {
  sellerId: string;
  customer: CreateOrderCustomerPayload;
  items: CreateOrderItemPayload[];
}

// Backend creates one order record per item, so POST /api/orders returns an array.
export interface CreatedOrderDto {
  id: string;
  orderNumber: string;
  sellerId: string;
  productId: string;
  quantity: number;
  sellingPrice: number;
  expectedProfit: number;
  status: OrderStatus;
  createdAtUtc: string;
}

// ---- Admin ----

export interface AdminDashboardDto {
  totalSellers: number;
  pendingSellers: number;
  approvedSellers: number;
  totalOrders: number;
  pendingPaymentVerifications: number;
  pendingWithdrawals: number;
  totalPlatformProfit: number;
}

export interface AdminSellerDto {
  id: string;
  userId: string;
  fullName: string;
  phoneNumber: string;
  email: string;
  status: SellerStatus;
  createdAtUtc: string;
  approvedAtUtc: string | null;
  frozenAtUtc: string | null;
  shopName: string;
  shopCategory: string;
  shopDescription: string;
  address: string;
  city: string;
  country: string;
  postalCode: string;
  idType: IdentityDocumentType;
  idNumber: string;
  documentType: IdentityDocumentType;
  documentUrl: string | null;
}

export interface UpdateSellerStatusPayload {
  status: SellerStatus;
  reason: string;
}

export interface AdminOrderDto {
  id: string;
  orderNumber: string;
  sellerId: string;
  productId: string;
  quantity: number;
  totalAmount: number;
  profitAmount: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;
  createdAtUtc: string;
}

export interface UpdateOrderStatusPayload {
  status: OrderStatus;
  note: string;
}

export interface CreateProductPayload {
  name: string;
  description: string;
  categoryId: string;
  supplierCost: number;
  sellingPrice: number;
  stockQuantity?: number;
  images?: File[];
}

export interface UpdateProductPayload {
  name: string;
  description: string;
  categoryId: string;
  supplierCost: number;
  sellingPrice: number;
  stockQuantity?: number;
  isAvailable: boolean;
  images?: File[];
}

export interface PendingPaymentDto {
  id: string;
  orderId: string;
  amount: number;
  fileUrl: string;
  status: PaymentStatus;
  submittedAtUtc: string;
}

export interface VerifyPaymentPayload {
  approve: boolean;
  rejectionReason: string | null;
}

export interface UpdateWithdrawalStatusPayload {
  status: WithdrawalStatus;
  note: string;
  paymentReference: string;
}

export interface InviteCodeDto {
  id: string;
  code: string;
  isActive: boolean;
  maxUses: number;
  usedCount: number;
  expiresAtUtc: string | null;
}

export interface CreateInviteCodePayload {
  maxUses: number;
  expiresAtUtc: string | null;
}

export interface AuditLogDto {
  id: string;
  actorUserId: string;
  action: string;
  entityName: string;
  entityId: string;
  createdAtUtc: string;
}
