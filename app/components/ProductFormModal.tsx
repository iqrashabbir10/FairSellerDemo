"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, ImagePlus, Info, Package, Pencil, Sparkles, Undo2, X } from "lucide-react";
import { addProductImages, createAdminProduct, deleteProductImage, getAdminProduct, updateAdminProduct } from "@/lib/api/admin";
import { ApiError, resolveApiUrl } from "@/lib/api/client";
import type { CategoryDto, ProductDto } from "@/lib/api/types";

const inputBase =
  "w-full rounded-xl border bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:bg-white";
const inputOk = "border-slate-200 focus:border-[var(--brand)] focus:ring-4 focus:ring-[var(--brand)]/10";
const inputBad = "border-red-300 focus:border-red-400 focus:ring-4 focus:ring-red-100";

// Same rule as the API: 2-64 chars, letters / numbers / . _ - /
const SKU_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._\-/]{1,63}$/;
const generateSku = () => `SKU-${crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase()}`;

/** Seller price is always the base price plus this markup. */
export const SELLER_MARKUP = 0.23;
export const sellerPriceFor = (basePrice: number) => Math.round(basePrice * (1 + SELLER_MARKUP) * 100) / 100;

const MAX_IMAGES = 8;

const money = (value: number) => `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

type FieldErrors = Partial<Record<"name" | "category" | "basePrice" | "sku", string>>;

function FieldLabel({ htmlFor, required, hint, children }: { htmlFor: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 flex items-baseline justify-between gap-2 text-sm font-medium text-slate-700">
      <span>
        {children}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </span>
      {hint && <span className="text-xs font-normal text-slate-400">{hint}</span>}
    </label>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1.5 flex items-center gap-1 text-xs text-red-600" role="alert">
      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
      {message}
    </p>
  );
}

function SectionTitle({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
      {icon}
      {children}
    </div>
  );
}

function ImageUploader({ files, onChange, limit = MAX_IMAGES }: { files: File[]; onChange: (files: File[]) => void; limit?: number }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const previews = useMemo(() => files.map((file) => URL.createObjectURL(file)), [files]);

  useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews]);

  const addFiles = (incoming: FileList | File[]) => {
    const images = Array.from(incoming).filter((file) => file.type.startsWith("image/")).slice(0, Math.max(0, limit - files.length));
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
        role="button"
        tabIndex={0}
        onKeyDown={(event) => (event.key === "Enter" || event.key === " ") && inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-8 text-center transition ${
          dragging ? "border-[var(--brand)] bg-[var(--brand)]/5" : "border-slate-200 bg-slate-50 hover:border-[var(--brand)]/60 hover:bg-white"
        }`}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--brand)]/10 text-[var(--brand)]">
          <ImagePlus className="h-6 w-6" />
        </div>
        <div className="text-sm font-medium text-slate-700">
          Drop photos here, or <span className="text-[var(--brand)]">browse</span>
        </div>
        <div className="text-xs text-slate-400">PNG, JPG or WEBP · up to 5 MB each · {Math.max(0, limit - files.length)} more allowed</div>
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
        <div className="grid grid-cols-3 gap-2.5">
          {files.map((file, index) => (
            <div key={`${file.name}-${index}`} className="group relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previews[index]} alt={file.name} className="h-full w-full object-cover" />
              {index === 0 && <span className="absolute left-1.5 top-1.5 rounded-full bg-[var(--brand)] px-2 py-0.5 text-[10px] font-semibold text-white shadow">Main</span>}
              <button
                type="button"
                onClick={() => onChange(files.filter((_, i) => i !== index))}
                aria-label={`Remove ${file.name}`}
                className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900/70 text-white opacity-90 shadow transition hover:bg-red-600"
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

// Add (no `product`) or edit (with `product`) dialog. Create posts multipart with images; the API's update endpoint
// is JSON-only, so existing images are shown read-only when editing.
export function ProductFormModal({
  product,
  categories,
  onClose,
  onSaved,
}: {
  product?: ProductDto;
  categories: CategoryDto[];
  onClose: () => void;
  onSaved: (saved: ProductDto, mode: "created" | "updated") => void;
}) {
  const isEdit = !!product;
  const initial = useMemo(
    () => ({
      name: product?.name ?? "",
      sku: product?.sku ?? "",
      description: product?.description ?? "",
      categoryId: product?.categoryId ?? categories[0]?.id ?? "",
      basePrice: product ? String(product.supplierCost) : "",
    }),
    [product, categories],
  );

  const [name, setName] = useState(initial.name);
  const [sku, setSku] = useState(initial.sku);
  const [description, setDescription] = useState(initial.description);
  const [categoryId, setCategoryId] = useState(initial.categoryId);
  const [basePrice, setBasePrice] = useState(initial.basePrice);
  const [images, setImages] = useState<File[]>([]);
  // Existing photos marked for removal; applied when the form is saved.
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const baseValue = basePrice.trim() === "" ? NaN : Number(basePrice);
  const validBase = Number.isFinite(baseValue) && baseValue > 0;
  const sellerPrice = validBase ? sellerPriceFor(baseValue) : null;

  const dirty =
    name !== initial.name || sku !== initial.sku || description !== initial.description || categoryId !== initial.categoryId || basePrice !== initial.basePrice || images.length > 0 || removedIds.size > 0;

  const clear = (key: keyof FieldErrors) => errors[key] && setErrors((current) => ({ ...current, [key]: undefined }));

  // Escape closes (unless mid-save); the page behind stays put while the dialog is open.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && !submitting && onClose();
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose, submitting]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const found: FieldErrors = {};
    if (!name.trim()) found.name = "Give the product a name.";
    if (!categoryId) found.category = "Choose a category.";
    if (!validBase) found.basePrice = "Enter a base price greater than zero.";
    if (sku.trim() && !SKU_PATTERN.test(sku.trim())) found.sku = "Use 2–64 characters: letters, numbers, dots, dashes, underscores or slashes.";
    setErrors(found);
    setFormError("");
    if (Object.keys(found).length > 0 || sellerPrice === null) return;

    setSubmitting(true);
    const base = { name: name.trim(), sku: sku.trim(), description, categoryId, supplierCost: baseValue, sellingPrice: sellerPrice };
    try {
      if (product) {
        const saved = await updateAdminProduct(product.id, { ...base, stockQuantity: product.stockQuantity, isAvailable: true });
        if (removedIds.size === 0 && images.length === 0) {
          onSaved(saved, "updated");
        } else {
          try {
            for (const imageId of removedIds) {
              try {
                await deleteProductImage(product.id, imageId);
              } catch (err) {
                if (!(err instanceof ApiError && err.status === 404)) throw err; // already gone is fine
              }
            }
            if (images.length > 0) await addProductImages(product.id, images);
          } catch (err) {
            const reason = err instanceof ApiError ? err.errors[0] ?? err.message : "please try again";
            setFormError(`The product details were saved, but the photos couldn't be updated: ${reason}`);
            return;
          }
          onSaved(await getAdminProduct(product.id).catch(() => saved), "updated");
        }
      } else {
        const saved = await createAdminProduct({ ...base, images });
        onSaved(saved, "created");
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.errors[0] ?? err.message : "We couldn't save this product. Please try again.";
      // Duplicate / invalid product codes belong next to the code field.
      if (/product code/i.test(message)) setErrors({ sku: message });
      else setFormError(message);
    } finally {
      setSubmitting(false);
    }
  };

  // Existing photos with ids (needs the updated API); older responses only have URLs.
  const existing = (product?.images ?? []).map((image) => ({ id: image.id, url: resolveApiUrl(image.fileUrl) ?? "" })).filter((image) => image.url);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
      onClick={() => !dirty && !submitting && onClose()}
    >
      <form
        onSubmit={handleSubmit}
        noValidate
        role="dialog"
        aria-modal="true"
        aria-label={isEdit ? "Edit product" : "Add product"}
        onClick={(event) => event.stopPropagation()}
        className="flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-3xl border border-slate-200 bg-white shadow-2xl sm:rounded-3xl"
      >
        {/* header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--brand)]/10 text-[var(--brand)]">
              {isEdit ? <Pencil className="h-5 w-5" /> : <Package className="h-5 w-5" />}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">{isEdit ? "Edit product" : "Add a new product"}</h2>
              <p className="text-sm text-slate-500">{isEdit ? "Update the details and save when you're done." : "Fill in the details below. Fields marked * are required."}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} disabled={submitting} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* body: fields on top (two per row), description + photos side by side underneath */}
        <div className="flex-1 space-y-7 overflow-y-auto px-6 py-6">
          <section>
            <SectionTitle icon={<Package className="h-3.5 w-3.5" />}>Product details</SectionTitle>
            <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
              <div>
                <FieldLabel htmlFor="product-name" required>Product name</FieldLabel>
                <input
                  id="product-name"
                  autoFocus
                  value={name}
                  maxLength={200}
                  onChange={(e) => {
                    setName(e.target.value);
                    clear("name");
                  }}
                  placeholder="e.g. Wireless Headphones"
                  aria-invalid={!!errors.name}
                  className={`${inputBase} ${errors.name ? inputBad : inputOk}`}
                />
                <FieldError message={errors.name} />
              </div>

              <div>
                <FieldLabel htmlFor="product-sku" hint="SKU / barcode">Product code</FieldLabel>
                <div className="flex gap-2">
                  <input
                    id="product-sku"
                    value={sku}
                    onChange={(e) => {
                      setSku(e.target.value);
                      clear("sku");
                    }}
                    placeholder="Scan, type, or generate"
                    autoComplete="off"
                    spellCheck={false}
                    aria-invalid={!!errors.sku}
                    className={`${inputBase} font-mono ${errors.sku ? inputBad : inputOk}`}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setSku(generateSku());
                      clear("sku");
                    }}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    title="Generate a unique code"
                  >
                    <Sparkles className="h-4 w-4 text-[var(--brand)]" />
                    <span className="hidden lg:inline">Generate</span>
                  </button>
                </div>
                {errors.sku ? <FieldError message={errors.sku} /> : <p className="mt-1.5 text-xs text-slate-400">Must be unique. Leave empty to auto-generate.</p>}
              </div>

              <div>
                <FieldLabel htmlFor="product-category" required>Category</FieldLabel>
                <select
                  id="product-category"
                  value={categoryId}
                  onChange={(e) => {
                    setCategoryId(e.target.value);
                    clear("category");
                  }}
                  aria-invalid={!!errors.category}
                  className={`${inputBase} ${errors.category ? inputBad : inputOk}`}
                >
                  {categories.length === 0 && <option value="">No categories yet</option>}
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
                <FieldError message={errors.category} />
              </div>

              <div>
                <FieldLabel htmlFor="product-base" required>Base price</FieldLabel>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span>
                  <input
                    id="product-base"
                    inputMode="decimal"
                    value={basePrice}
                    onChange={(e) => {
                      setBasePrice(e.target.value);
                      clear("basePrice");
                    }}
                    placeholder="0.00"
                    aria-invalid={!!errors.basePrice}
                    className={`${inputBase} pl-7 ${errors.basePrice ? inputBad : inputOk}`}
                  />
                </div>
                <FieldError message={errors.basePrice} />
              </div>

              <div>
                <FieldLabel htmlFor="product-seller" hint={`Base +${Math.round(SELLER_MARKUP * 100)}%`}>Seller price</FieldLabel>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span>
                  <input id="product-seller" readOnly tabIndex={-1} value={sellerPrice === null ? "" : sellerPrice.toFixed(2)} placeholder="Auto-calculated" className={`${inputBase} cursor-not-allowed border-slate-200 bg-slate-100 pl-7 text-slate-500`} />
                </div>
              </div>

              <div>
                <span className="mb-1.5 block text-sm font-medium text-slate-700">Seller earns per unit</span>
                <div className={`flex h-[42px] items-center justify-between rounded-xl px-4 text-sm ${sellerPrice !== null && validBase ? "bg-emerald-50 text-emerald-700" : "bg-slate-50 text-slate-400"}`}>
                  <span>Profit per unit sold</span>
                  <span className="font-semibold tabular-nums">{sellerPrice !== null && validBase ? money(sellerPrice - baseValue) : "—"}</span>
                </div>
              </div>
            </div>
          </section>

          <div className="grid gap-x-5 gap-y-7 md:grid-cols-2">
            <section>
              <SectionTitle icon={<Info className="h-3.5 w-3.5" />}>Description</SectionTitle>
              <FieldLabel htmlFor="product-description" hint="Optional">What makes this product special?</FieldLabel>
              <textarea
                id="product-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={9}
                placeholder="Materials, features, what's in the box…"
                className={`${inputBase} ${inputOk} h-[calc(100%-2.25rem)] min-h-[13rem] resize-none`}
              />
            </section>

            <section>
              <SectionTitle icon={<ImagePlus className="h-3.5 w-3.5" />}>Photos</SectionTitle>
              {isEdit && existing.length > 0 && (
                <div className="mb-3 grid grid-cols-3 gap-2.5">
                  {existing.map((image, index) => {
                    const removed = removedIds.has(image.id);
                    return (
                      <div key={image.id} className={`group relative aspect-square overflow-hidden rounded-xl border bg-slate-100 shadow-sm ${removed ? "border-red-200" : "border-slate-200"}`}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={image.url} alt="" className={`h-full w-full object-cover transition ${removed ? "opacity-30 grayscale" : ""}`} />
                        {index === 0 && !removed && <span className="absolute left-1.5 top-1.5 rounded-full bg-[var(--brand)] px-2 py-0.5 text-[10px] font-semibold text-white shadow">Main</span>}
                        {removed && <span className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-[11px] font-semibold text-red-600">Will be removed</span>}
                        <button
                          type="button"
                          onClick={() =>
                            setRemovedIds((current) => {
                              const next = new Set(current);
                              if (next.has(image.id)) next.delete(image.id);
                              else next.add(image.id);
                              return next;
                            })
                          }
                          aria-label={removed ? "Keep this photo" : "Remove this photo"}
                          className={`absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full text-white shadow transition ${removed ? "bg-slate-700 hover:bg-slate-900" : "bg-slate-900/70 hover:bg-red-600"}`}
                        >
                          {removed ? <Undo2 className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
              {isEdit && existing.length === 0 && (product.imageUrls?.length ?? 0) > 0 && (
                <p className="mb-3 flex items-start gap-1.5 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  Existing photos can only be removed after the API restart that adds photo ids.
                </p>
              )}
              <ImageUploader files={images} onChange={setImages} limit={Math.max(0, MAX_IMAGES - (isEdit ? existing.length - removedIds.size : 0))} />
            </section>
          </div>
        </div>

        {/* footer */}
        <div className="border-t border-slate-100 bg-slate-50/70 px-6 py-4">
          {formError && (
            <div className="mb-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {formError}
            </div>
          )}
          <div className="flex items-center justify-between gap-3">
            <span className="hidden text-xs text-slate-400 sm:block">{dirty ? "You have unsaved changes" : ""}</span>
            <div className="ml-auto flex gap-2">
              <button type="button" onClick={onClose} disabled={submitting} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--brand)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[var(--brand-hover)] disabled:opacity-60"
              >
                {submitting && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
                {submitting ? "Saving…" : isEdit ? "Save changes" : "Create product"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
