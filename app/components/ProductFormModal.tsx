"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { createAdminProduct, updateAdminProduct } from "@/lib/api/admin";
import { ApiError } from "@/lib/api/client";
import type { CategoryDto, ProductDto } from "@/lib/api/types";
import { ProductThumbnail } from "./ProductThumbnail";

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-[var(--brand)] focus:bg-white";

/** Seller price is always the base price plus this markup. */
export const SELLER_MARKUP = 0.23;
export const sellerPriceFor = (basePrice: number) => Math.round(basePrice * (1 + SELLER_MARKUP) * 100) / 100;

function ImageUploader({ files, onChange }: { files: File[]; onChange: (files: File[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const previews = useMemo(() => files.map((file) => URL.createObjectURL(file)), [files]);

  useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews]);

  const addFiles = (incoming: FileList | File[]) => {
    const images = Array.from(incoming).filter((file) => file.type.startsWith("image/"));
    if (images.length) onChange([...files, ...images]);
  };

  return (
    <div className="space-y-3">
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          addFiles(event.dataTransfer.files);
        }}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-6 text-center transition ${
          dragging ? "border-[var(--brand)] bg-[var(--brand)]/5" : "border-slate-200 bg-slate-50 hover:border-[var(--brand)]/60 hover:bg-white"
        }`}
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--brand)]/10 text-[var(--brand)]">
          <ImagePlus className="h-5 w-5" />
        </div>
        <div className="text-sm font-medium text-slate-700">
          Drag &amp; drop images here, or <span className="text-[var(--brand)]">browse</span>
        </div>
        <div className="text-xs text-slate-400">PNG, JPG or WEBP</div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(event) => {
            if (event.target.files) addFiles(event.target.files);
            event.target.value = "";
          }}
        />
      </div>

      {files.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {files.map((file, index) => (
            <div key={`${file.name}-${index}`} className="group relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previews[index]} alt={file.name} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => onChange(files.filter((_, i) => i !== index))}
                aria-label={`Remove ${file.name}`}
                className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900/70 text-white shadow transition hover:bg-red-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Create (no `product`) or edit (with `product`). Create posts multipart with images; the API's
// update endpoint is JSON-only, so existing images are shown read-only when editing.
export function ProductFormModal({
  product,
  categories,
  onClose,
  onSaved,
}: {
  product?: ProductDto;
  categories: CategoryDto[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? categories[0]?.id ?? "");
  const [basePrice, setBasePrice] = useState(product ? String(product.supplierCost) : "");
  const [isAvailable, setIsAvailable] = useState(product?.isAvailable ?? true);
  const [images, setImages] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const baseValue = basePrice.trim() === "" ? NaN : Number(basePrice);
  const sellerPrice = Number.isFinite(baseValue) && baseValue > 0 ? sellerPriceFor(baseValue) : null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !categoryId) {
      setError("Name and category are required.");
      return;
    }
    if (sellerPrice === null) {
      setError("Base price is required and must be greater than zero.");
      return;
    }
    setSubmitting(true);
    setError("");
    const base = { name: name.trim(), description, categoryId, supplierCost: baseValue, sellingPrice: sellerPrice };
    try {
      if (product) {
        await updateAdminProduct(product.id, { ...base, stockQuantity: product.stockQuantity, isAvailable });
      } else {
        await createAdminProduct({ ...base, images });
      }
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.errors[0] ?? err.message : "Failed to save product.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        onClick={(event) => event.stopPropagation()}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">{product ? "Edit product" : "Add product"}</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 text-sm">
          <label className="block">
            <span className="mb-1 block font-medium text-slate-700">Name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          </label>
          <label className="block">
            <span className="mb-1 block font-medium text-slate-700">Description</span>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={inputClass} />
          </label>
          <label className="block">
            <span className="mb-1 block font-medium text-slate-700">Category</span>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={inputClass}>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block font-medium text-slate-700">Base price</span>
              <input type="number" min={0} step="0.01" value={basePrice} onChange={(e) => setBasePrice(e.target.value)} placeholder="0.00" className={inputClass} />
            </label>
            <label className="block">
              <span className="mb-1 block font-medium text-slate-700">
                Seller price <span className="font-normal text-slate-400">(+{SELLER_MARKUP * 100}%)</span>
              </span>
              <input readOnly tabIndex={-1} value={sellerPrice === null ? "" : sellerPrice.toFixed(2)} placeholder="Auto-calculated" className={`${inputClass} cursor-not-allowed bg-slate-100`} />
            </label>
          </div>
          {product && (
            <label className="flex items-center gap-2 text-slate-700">
              <input type="checkbox" checked={isAvailable} onChange={(e) => setIsAvailable(e.target.checked)} />
              Available
            </label>
          )}
          <div>
            <span className="mb-1 block font-medium text-slate-700">Images</span>
            {product ? (
              product.imageUrls && product.imageUrls.length > 0 ? (
                <ProductThumbnail name={product.name} imageUrls={product.imageUrls} className="h-32 w-full" bare />
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-center text-slate-400">No images</div>
              )
            ) : (
              <ImageUploader files={images} onChange={setImages} />
            )}
          </div>

          {error && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-red-700">{error}</div>}

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex w-full items-center justify-center rounded-xl bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[var(--brand-hover)] disabled:opacity-60"
          >
            {submitting ? "Saving…" : product ? "Save changes" : "Create product"}
          </button>
        </div>
      </form>
    </div>
  );
}
