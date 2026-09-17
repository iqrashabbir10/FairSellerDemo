import { apiFetch } from "./client";
import type { AddSellerProductRequest, ProductDto, SellerProductDto } from "./types";

export function getSellerProductById(id: string) {
  return apiFetch<ProductDto>(`/api/seller/products/${id}`);
}

export function addSellerProduct(request: AddSellerProductRequest) {
  return apiFetch<SellerProductDto>("/api/seller/products", { method: "POST", body: request });
}
