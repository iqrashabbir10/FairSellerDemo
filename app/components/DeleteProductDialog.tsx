"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import { deleteAdminProduct } from "@/lib/api/admin";
import { ApiError } from "@/lib/api/client";
import type { ProductDto } from "@/lib/api/types";
import { ProductThumbnail } from "./ProductThumbnail";

// Confirmation before permanently removing a product.
export function DeleteProductDialog({
  product,
  onClose,
  onDeleted,
}: {
  product: ProductDto;
  onClose: () => void;
  onDeleted: (product: ProductDto) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && !busy && onClose();
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [busy, onClose]);

  const confirm = async () => {
    setBusy(true);
    setError("");
    try {
      await deleteAdminProduct(product.id);
      onDeleted(product);
    } catch (err) {
      setError(
        err instanceof ApiError && err.errors[0]
          ? err.errors[0]
          : err instanceof ApiError && err.status !== 404 && err.status !== 405
            ? err.message
            : "We couldn't delete this product. It may still be in use by seller listings or orders.",
      );
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 backdrop-blur-[2px] sm:items-center sm:p-4" onClick={() => !busy && onClose()}>
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={`Delete ${product.name}`}
        className="w-full max-w-md overflow-hidden rounded-t-3xl border border-slate-200 bg-white shadow-2xl sm:rounded-3xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="px-6 pb-2 pt-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600 ring-8 ring-red-50/60">
            <Trash2 className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-slate-900">Delete this product?</h2>
          <p className="mt-1 text-sm text-slate-500">This permanently removes the product and its photos. It can&apos;t be undone.</p>
        </div>

        <div className="mx-6 mt-4 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <ProductThumbnail name={product.name} imageUrls={product.imageUrls} className="h-14 w-14 shrink-0" bare />
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-slate-900">{product.name}</div>
            {product.sku && <div className="font-mono text-xs text-slate-500">{product.sku}</div>}
            <div className="text-xs text-slate-400">{product.categoryName}</div>
          </div>
        </div>

        <p className="mx-6 mt-3 flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Sellers who listed this product will no longer see it.
        </p>

        {error && <div className="mx-6 mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</div>}

        <div className="mt-5 flex gap-2 border-t border-slate-100 bg-slate-50/70 px-6 py-4">
          <button onClick={onClose} disabled={busy} className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">
            Keep product
          </button>
          <button onClick={confirm} disabled={busy} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60">
            {busy && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
            {busy ? "Deleting…" : "Yes, delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
