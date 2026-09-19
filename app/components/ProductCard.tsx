"use client";

import type { ReactNode } from "react";
import type { ProductDto } from "@/lib/api/types";
import { ProductThumbnail } from "./ProductThumbnail";

// Shared grid card for the admin and seller product catalogs.
export function ProductCard({
  product,
  onClick,
  footer,
  showStatus = true,
}: {
  product: ProductDto;
  onClick?: () => void;
  footer?: ReactNode;
  showStatus?: boolean;
}) {
  return (
    <article
      onClick={onClick}
      className={`group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg ${onClick ? "cursor-pointer" : ""}`}
    >
      <div className="relative">
        <ProductThumbnail name={product.name} imageUrls={product.imageUrls} className="aspect-[4/3] w-full !rounded-none" bare />
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-slate-700 shadow-sm backdrop-blur">
          {product.categoryName}
        </span>
        {showStatus && (
          <span
            className={`absolute right-3 top-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium shadow-sm backdrop-blur ${
              product.isAvailable ? "bg-emerald-50/95 text-emerald-700" : "bg-slate-100/95 text-slate-600"
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${product.isAvailable ? "bg-emerald-500" : "bg-slate-400"}`} />
            {product.isAvailable ? "Available" : "Unavailable"}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <h2 className="line-clamp-1 text-base font-semibold text-slate-900">{product.name}</h2>
        {product.description && <p className="line-clamp-2 text-sm text-slate-500">{product.description}</p>}

        <div className="mt-auto grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-slate-50 px-3 py-2">
            <div className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Base Price</div>
            <div className="text-sm font-semibold text-slate-800">${product.supplierCost.toFixed(2)}</div>
          </div>
          <div className="rounded-xl bg-[var(--brand)]/10 px-3 py-2">
            <div className="text-[11px] font-medium uppercase tracking-wide text-[var(--brand)]/80">Seller Price</div>
            <div className="text-sm font-semibold text-[var(--brand)]">${product.sellingPrice.toFixed(2)}</div>
          </div>
        </div>

        {footer && <div className="border-t border-slate-100 pt-3">{footer}</div>}
      </div>
    </article>
  );
}
