import { apiFetch } from "./client";
import type { AddSellerProductRequest, AddSellerProductsBulkRequest, AddSellerProductsBulkResult, ProductDto, SellerProductDto } from "./types";

export function getSellerProductById(id: string) {
  return apiFetch<ProductDto>(`/api/seller/products/${id}`);
}

// Listings have no quantity any more. The updated backend ignores this number; a backend that hasn't been
// updated yet still insists on one (and would refuse with "Quantity must be greater than zero"), so a large
// value is sent to keep it working there too. Remove it once every environment runs the new backend.
const LEGACY_LISTING_QUANTITY = 1_000_000;

export function addSellerProduct(request: AddSellerProductRequest) {
  return apiFetch<SellerProductDto>("/api/seller/products", { method: "POST", body: { ...request, quantity: LEGACY_LISTING_QUANTITY } });
}

// Adds many products to the seller's listings in a single request instead of one call per product.
export function addSellerProductsBulk(request: AddSellerProductsBulkRequest) {
  return apiFetch<AddSellerProductsBulkResult>("/api/seller/products/bulk", { method: "POST", body: request });
}
