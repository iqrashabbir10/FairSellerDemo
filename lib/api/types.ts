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

// A super user is an admin who can also manage the other users.
export type UserRole = "Seller" | "Admin" | "SuperUser";

export type SellerStatus = "Pending" | "Approved" | "Rejected" | "Frozen";

export type IdentityDocumentType = "ID Card" | "Passport" | "Driving License" | "Other Government ID";

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

// ---- Super user: user management ----

export interface ManagedUserDto {
  id: string;
  name: string;
  email: string;
  // Highest role the account holds.
  role: UserRole;
  isBlocked: boolean;
  blockedAtUtc: string | null;
}

export interface CreateManagedUserPayload {
  fullName: string;
  email: string;
  password: string;
  role: "Admin" | "SuperUser";
  mustChangePassword: boolean;
}

// ---- Auth ----

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresAtUtc: string;
  userId: string;
  role: UserRole;
  // True after an admin reset: the user must set a new password before using the app.
  mustChangePassword?: boolean;
}

export interface SetNewPasswordPayload {
  newPassword: string;
  confirmPassword: string;
}

export interface ResetPasswordResult {
  temporaryPassword: string;
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
  // Admin-assigned; null until rated.
  rating?: number | null;
  creditScore?: number | null;
}

// Only the phone number is seller-editable; name, shop name/category and ID are verified by admins.
export interface UpdateSellerProfilePayload {
  phoneNumber: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
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
  // Unique product code (SKU / barcode) for auditing.
  sku: string;
  description: string;
  categoryId: string;
  categoryName: string;
  supplierCost: number;
  sellingPrice: number;
  stockQuantity: number;
  isAvailable: boolean;
  imageUrls?: string[];
  // Same photos with ids, so single photos can be removed.
  images?: { id: string; fileUrl: string }[];
}

export interface CategoryDto {
  id: string;
  name: string;
}

// One product line of an order. An order with several products has several items.
export interface OrderItemDto {
  productId: string;
  productName: string;
  sku?: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  imageUrl?: string | null;
}

export interface SellerOrderDto {
  id: string;
  orderNumber: string;
  totalAmount: number;
  expectedProfit: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  createdAtUtc: string;
  // What the seller pays from their wallet to pick this order (supplier cost x quantity, for every item).
  pickCost: number;
  items: OrderItemDto[];
}

export interface PickOrderResultDto {
  order: SellerOrderDto;
  balance: number;
  currency: string;
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
  reason?: string | null;
}

// ---- Admin manual wallet credit ----

export interface WalletSellerOptionDto {
  sellerId: string;
  sellerName: string;
  shopName: string;
  balance: number;
  currency: string;
}

export interface AdminCreditWalletPayload {
  amount: number;
  note: string;
  // Same id on a retry means the credit is applied at most once.
  requestId: string;
}

export interface WalletCreditResultDto {
  transactionId: string;
  sellerId: string;
  amount: number;
  balance: number;
  currency: string;
  createdAtUtc: string;
  alreadyApplied: boolean;
}

export interface AdminWalletCreditDto {
  id: string;
  sellerId: string;
  sellerName: string;
  shopName: string;
  amount: number;
  newBalance: number;
  reason: string | null;
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

// Admin's GET /api/admin/support list (paged, searchable) — already includes seller/shop names, a
// last-message preview and the unread count, so the inbox needs no per-seller lookups.
export interface SupportConversationSummaryDto {
  id: string;
  sellerId: string;
  sellerUserId: string;
  sellerName: string;
  shopName: string;
  status: SupportStatus;
  createdAtUtc: string;
  lastMessageAtUtc: string | null;
  lastMessage: string | null;
  unreadCount: number;
}

export interface SupportAttachmentDto {
  id: string;
  fileUrl: string;
}

export interface ReplyPreviewDto {
  id: string;
  senderUserId: string;
  message: string;
  hasAttachment: boolean;
  isDeleted: boolean;
}

export interface SupportMessageDto {
  replyTo?: ReplyPreviewDto | null;
  isDeleted?: boolean;
  id: string;
  conversationId: string;
  senderUserId: string;
  message: string;
  createdAtUtc: string;
  // Set when the recipient was online at send time (or came online later). Read implies delivered.
  deliveredAtUtc?: string | null;
  readAtUtc?: string | null;
  attachments?: SupportAttachmentDto[] | null;
}

export interface NotificationDto {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAtUtc: string;
  // e.g. OrderAssigned, OrderStatusChanged, OrderPicked, WalletCredited — drives the icon and link.
  type?: string | null;
  entityType?: string | null;
  entityId?: string | null;
}

// Pushed live over the hub when a notification is created for the signed-in user.
export interface NotificationPushDto {
  notification: NotificationDto;
  unreadCount: number;
}

// Listing a product is all a seller does — there is no stock quantity.
export interface AddSellerProductRequest {
  productId: string;
}

export interface SellerProductDto {
  id: string;
  sellerId: string;
  productId: string;
  productName: string;
  sku: string;
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

// POST /api/orders creates ONE order containing every product, and returns it in a one-element array.
export interface CreatedOrderDto {
  id: string;
  orderNumber: string;
  sellerId: string;
  itemCount: number;
  totalQuantity: number;
  totalAmount: number;
  profitAmount: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
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
  rating?: number | null;
  creditScore?: number | null;
}

export interface UpdateSellerRatingPayload {
  rating: number;
  creditScore: number;
}

export interface UpdateSellerStatusPayload {
  status: SellerStatus;
  reason: string;
}

export interface AdminOrderDto {
  id: string;
  orderNumber: string;
  sellerId: string;
  totalAmount: number;
  profitAmount: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;
  createdAtUtc: string;
  items: OrderItemDto[];
}

export interface UpdateOrderStatusPayload {
  status: OrderStatus;
  note: string;
}

export interface CreateProductPayload {
  name: string;
  // Leave empty to have one generated.
  sku?: string;
  description: string;
  categoryId: string;
  supplierCost: number;
  sellingPrice: number;
  stockQuantity?: number;
  images?: File[];
}

export interface UpdateProductPayload {
  name: string;
  sku?: string;
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
