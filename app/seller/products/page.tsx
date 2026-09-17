"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Eye, Plus, Search } from "lucide-react";
import { useResponsiveView, ViewToggle } from "@/app/components/ViewToggle";
import { getSellerProducts } from "@/lib/api/seller";
import { ApiError } from "@/lib/api/client";
import type { ProductDto } from "@/lib/api/types";
import { useAuthGuard } from "@/lib/api/useAuthGuard";
import { ProductDetailModal } from "@/app/components/ProductDetailModal";
import { AddToListingModal } from "@/app/components/AddToListingModal";
import { ProductImage } from "@/app/components/ProductImage";

const PAGE_SIZE = 9;

export default function SellerProductsPage() {
  const ready = useAuthGuard("Seller");
  const [view, setView] = useResponsiveView();
  const [items, setItems] = useState<ProductDto[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [detailProductId, setDetailProductId] = useState<string | null>(null);
  const [listingProduct, setListingProduct] = useState<ProductDto | null>(null);
  const [addedMessage, setAddedMessage] = useState("");

  useEffect(() => {
    if (!ready) return;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const result = await getSellerProducts({ pageSize: 100 });
        setItems(result.items);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Failed to load products.");
      } finally {
        setLoading(false);
      }
    })();
  }, [ready]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const filtered = items.filter((item) => item.name.toLowerCase().includes(search.toLowerCase()));
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, currentPage]);

  if (!ready) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">Browse the catalog</p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Available Products</h1>
        </div>
        <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[var(--brand-hover)]">
          <Plus className="h-4 w-4" />
          Add Product
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative max-w-md flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-700 outline-none focus:border-[var(--brand)] focus:bg-white" placeholder="Search products" />
        </div>
        <ViewToggle value={view} onChange={setView} />
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {addedMessage && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{addedMessage}</div>}

      {loading ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500">Loading products…</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500">No products found.</div>
      ) : view === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {paged.map((item) => (
            <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <ProductImage name={item.name} />
              <h2 className="font-semibold text-slate-900">{item.name}</h2>
              <p className="mt-1 text-sm text-slate-500">{item.categoryName}</p>
              <div className="mt-4 flex justify-between text-sm">
                <span className="font-medium text-slate-900">${item.sellingPrice.toFixed(2)}</span>
                <span className="text-slate-500">{item.stockQuantity} in stock</span>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className={`rounded-full px-2 py-1 text-xs font-medium ${item.isAvailable ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                  {item.isAvailable ? "Available" : "Unavailable"}
                </span>
                <button onClick={() => setDetailProductId(item.id)} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100" aria-label="View details">
                  <Eye className="h-4 w-4" />
                </button>
              </div>
              <button
                onClick={() => setListingProduct(item)}
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand)] px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[var(--brand-hover)]"
              >
                Add to My Listings
              </button>
            </article>
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium text-right">Price</th>
              <th className="px-4 py-3 font-medium text-right">Stock</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((item) => (
              <tr key={item.id} className="border-b border-slate-200 last:border-b-0">
                <td className="px-4 py-3 font-medium text-slate-800">{item.name}</td>
                <td className="px-4 py-3 text-slate-600">{item.categoryName}</td>
                <td className="px-4 py-3 text-right font-medium text-slate-800">${item.sellingPrice.toFixed(2)}</td>
                <td className="px-4 py-3 text-right text-slate-600">{item.stockQuantity}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${item.isAvailable ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${item.isAvailable ? "bg-emerald-500" : "bg-slate-400"}`} />
                    {item.isAvailable ? "Available" : "Unavailable"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => setDetailProductId(item.id)} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100" aria-label="View details">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setListingProduct(item)}
                      className="inline-flex items-center gap-1 rounded-lg bg-[var(--brand)] px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[var(--brand-hover)]"
                    >
                      Add to My Listings
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <span className="text-sm text-slate-500">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {detailProductId && <ProductDetailModal productId={detailProductId} onClose={() => setDetailProductId(null)} />}
      {listingProduct && (
        <AddToListingModal
          product={listingProduct}
          onClose={() => setListingProduct(null)}
          onAdded={(listing) => {
            setAddedMessage(`${listing.productName} was added to your listings.`);
            setListingProduct(null);
          }}
        />
      )}
    </div>
  );
}
