"use client";

import { useEffect, useRef, useState } from "react";
import { Layers, Plus, Search } from "lucide-react";
import { useResponsiveView, ViewToggle } from "@/app/components/ViewToggle";
import { Pagination } from "@/app/components/Pagination";
import { ProductCard } from "@/app/components/ProductCard";
import { ProductThumbnail } from "@/app/components/ProductThumbnail";
import { ProductDetailModal } from "@/app/components/ProductDetailModal";
import { AddToListingModal } from "@/app/components/AddToListingModal";
import { getSellerProducts } from "@/lib/api/seller";
import { addSellerProductsBulk } from "@/lib/api/sellerProducts";
import { saveListing } from "@/lib/api/sellerListings";
import { ApiError } from "@/lib/api/client";
import type { PagedResult, ProductDto } from "@/lib/api/types";
import { useAuthGuard } from "@/lib/api/useAuthGuard";

const DEFAULT_PAGE_SIZE = 10;

export default function SellerProductsPage() {
  const ready = useAuthGuard("Seller");
  const [view, setView] = useResponsiveView();
  const [result, setResult] = useState<PagedResult<ProductDto> | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [addTarget, setAddTarget] = useState<ProductDto | null>(null);
  const [notice, setNotice] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkAdding, setBulkAdding] = useState(false);
  const selectAllRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    setLoading(true);
    setError("");
    getSellerProducts({ page, pageSize })
      .then((data) => {
        if (!cancelled) setResult(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Failed to load products.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [ready, page, pageSize]);

  if (!ready) return null;

  // The API has no search parameter, so search filters the current page.
  const items = (result?.items ?? []).filter((item) => item.name.toLowerCase().includes(search.toLowerCase()) || item.sku?.toLowerCase().includes(search.toLowerCase()));
  const selectableItems = items.filter((item) => item.isAvailable);
  const allSelected = selectableItems.length > 0 && selectableItems.every((item) => selected.has(item.id));
  const someSelected = selectableItems.some((item) => selected.has(item.id));

  if (selectAllRef.current) selectAllRef.current.indeterminate = someSelected && !allSelected;

  const toggleSelected = (id: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelected((current) => {
      if (allSelected) {
        const next = new Set(current);
        selectableItems.forEach((item) => next.delete(item.id));
        return next;
      }
      const next = new Set(current);
      selectableItems.forEach((item) => next.add(item.id));
      return next;
    });
  };

  // Selections persist across page navigation, so this adds every product id picked so far —
  // not just the ones on the page currently on screen — in a single request, however many there are.
  const handleBulkAdd = async () => {
    const targetIds = Array.from(selected);
    if (targetIds.length === 0) return;
    setBulkAdding(true);
    setError("");
    try {
      const result = await addSellerProductsBulk({ productIds: targetIds });
      result.added.forEach(saveListing);
      setSelected(new Set());
      setNotice(
        `${result.added.length} product${result.added.length === 1 ? "" : "s"} added to your listings.` +
          (result.notFound.length ? ` ${result.notFound.length} couldn't be found and were skipped.` : ""),
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.errors[0] ?? err.message : "Failed to add the selected products.");
    } finally {
      setBulkAdding(false);
    }
  };

  const addButton = (product: ProductDto) => (
    <button
      onClick={(event) => {
        event.stopPropagation();
        setAddTarget(product);
      }}
      disabled={!product.isAvailable}
      className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[var(--brand)] px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-[var(--brand-hover)] disabled:opacity-50"
    >
      <Plus className="h-3.5 w-3.5" />
      Add to My Listings
    </button>
  );

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-slate-500">Available catalog</p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Products</h1>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-700 outline-none focus:border-[var(--brand)] focus:bg-white" placeholder="Search by name or product code" />
          </div>
          <ViewToggle value={view} onChange={setView} />
        </div>

        {selectableItems.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
            <div className="flex flex-wrap items-center gap-3">
              <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                <input
                  ref={selectAllRef}
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  className="h-4 w-4 rounded border-slate-300 text-[var(--brand)] focus:ring-[var(--brand)]"
                />
                Select all on this page ({selectableItems.length})
              </label>
              {selected.size > 0 && (
                <span className="text-xs font-medium text-slate-500">
                  {selected.size} selected across all pages
                </span>
              )}
            </div>

            {selected.size > 0 && (
              <button
                onClick={handleBulkAdd}
                disabled={bulkAdding}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[var(--brand)] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[var(--brand-hover)] disabled:opacity-60"
              >
                <Layers className="h-3.5 w-3.5" />
                {bulkAdding ? "Adding…" : `Add ${selected.size} selected to My Listings`}
              </button>
            )}
          </div>
        )}
      </div>

      {notice && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</div>}
      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {loading ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500">Loading products…</div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500">No products found.</div>
      ) : view === "grid" ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((product) => (
            <div key={product.id} className="relative">
              {product.isAvailable && (
                <label
                  onClick={(event) => event.stopPropagation()}
                  className="absolute right-3 top-3 z-10 inline-flex h-6 w-6 items-center justify-center rounded-md bg-white/90 shadow-sm backdrop-blur"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(product.id)}
                    onChange={() => toggleSelected(product.id)}
                    aria-label={`Select ${product.name}`}
                    className="h-4 w-4 rounded border-slate-300 text-[var(--brand)] focus:ring-[var(--brand)]"
                  />
                </label>
              )}
              <ProductCard product={product} showStatus={false} onClick={() => setDetailId(product.id)} footer={<div className="flex justify-end">{addButton(product)}</div>} />
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    aria-label="Select all"
                    className="h-4 w-4 rounded border-slate-300 text-[var(--brand)] focus:ring-[var(--brand)]"
                  />
                </th>
                <th className="px-4 py-3 font-medium">Image</th>
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">Code</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium text-right">Base Price</th>
                <th className="px-4 py-3 font-medium text-right">Seller Price</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((product) => (
                <tr key={product.id} onClick={() => setDetailId(product.id)} className="cursor-pointer border-b border-slate-200 last:border-b-0 hover:bg-slate-50">
                  <td className="px-4 py-3" onClick={(event) => event.stopPropagation()}>
                    {product.isAvailable && (
                      <input
                        type="checkbox"
                        checked={selected.has(product.id)}
                        onChange={() => toggleSelected(product.id)}
                        aria-label={`Select ${product.name}`}
                        className="h-4 w-4 rounded border-slate-300 text-[var(--brand)] focus:ring-[var(--brand)]"
                      />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <ProductThumbnail name={product.name} imageUrls={product.imageUrls} className="h-10 w-10" bare />
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-800">{product.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{product.sku || "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{product.categoryName}</td>
                  <td className="px-4 py-3 text-right text-slate-600">${product.supplierCost.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right font-medium text-slate-800">${product.sellingPrice.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right">{addButton(product)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {result && result.totalCount > 0 && (
        <Pagination page={result.page} totalPages={result.totalPages} totalCount={result.totalCount} pageSize={pageSize} onChange={setPage} onPageSizeChange={(size) => { setPageSize(size); setPage(1); }} />
      )}

      {detailId && <ProductDetailModal productId={detailId} onClose={() => setDetailId(null)} />}
      {addTarget && (
        <AddToListingModal
          product={addTarget}
          onClose={() => setAddTarget(null)}
          onAdded={(listing) => {
            saveListing(listing);
            setNotice(`"${addTarget.name}" was added to your listings.`);
            setAddTarget(null);
          }}
        />
      )}
    </div>
  );
}
