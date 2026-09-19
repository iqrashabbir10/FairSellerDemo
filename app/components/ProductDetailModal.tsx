"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { getSellerProductById } from "@/lib/api/sellerProducts";
import { ApiError } from "@/lib/api/client";
import type { ProductDto } from "@/lib/api/types";
import { ProductThumbnail } from "@/app/components/ProductThumbnail";

export function ProductDetailModal({ productId, onClose }: { productId: string; onClose: () => void }) {
  const [product, setProduct] = useState<ProductDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    getSellerProductById(productId)
      .then((data) => {
        if (!cancelled) setProduct(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Failed to load product details.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [productId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl" onClick={(event) => event.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Product details</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        {loading ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500">Loading…</div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        ) : product ? (
          <div className="space-y-3 text-sm">
            <ProductThumbnail name={product.name} imageUrls={product.imageUrls} className="h-40 w-full" />
            <div>
              <div className="text-xs font-medium uppercase text-slate-400">Name</div>
              <div className="font-semibold text-slate-900">{product.name}</div>
            </div>
            <div>
              <div className="text-xs font-medium uppercase text-slate-400">Category</div>
              <div className="text-slate-700">{product.categoryName ?? "—"}</div>
            </div>
            <div>
              <div className="text-xs font-medium uppercase text-slate-400">Description</div>
              <p className="text-slate-700">{product.description ?? "No description provided."}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs font-medium uppercase text-slate-400">Base Price</div>
                <div className="font-semibold text-slate-900">${product.supplierCost.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-xs font-medium uppercase text-slate-400">Seller Price</div>
                <div className="font-semibold text-slate-900">${product.sellingPrice.toFixed(2)}</div>
              </div>
            </div>
            <span className={`inline-flex w-fit rounded-full px-2 py-1 text-xs font-medium ${product.isAvailable ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
              {product.isAvailable ? "Available" : "Unavailable"}
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
