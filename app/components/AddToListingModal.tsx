"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { addSellerProduct } from "@/lib/api/sellerProducts";
import { ApiError } from "@/lib/api/client";
import type { ProductDto, SellerProductDto } from "@/lib/api/types";

export function AddToListingModal({
  product,
  onClose,
  onAdded,
}: {
  product: ProductDto;
  onClose: () => void;
  onAdded: (listing: SellerProductDto) => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");
    try {
      const listing = await addSellerProduct({ productId: product.id });
      onAdded(listing);
    } catch (err) {
      setError(err instanceof ApiError ? err.errors[0] ?? err.message : "Failed to add product to your listing.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" onClick={submitting ? undefined : onClose}>
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-xl" onClick={(event) => event.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Add to my listings</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <div className="text-sm font-medium text-slate-900">{product.name}</div>
            <div className="text-xs text-slate-500">{product.categoryName}</div>
          </div>

          <p className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
            This product will be added to your listings. Orders can be placed for any number of units.
          </p>

          {error && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[var(--brand-hover)] disabled:opacity-60"
          >
            {submitting ? "Adding…" : "Add to My Listings"}
          </button>
        </div>
      </div>
    </div>
  );
}
