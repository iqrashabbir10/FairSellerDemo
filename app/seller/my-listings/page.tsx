"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { useResponsiveView, ViewToggle } from "@/app/components/ViewToggle";
import { Pagination } from "@/app/components/Pagination";
import { ProductThumbnail } from "@/app/components/ProductThumbnail";
import { getSellerListings } from "@/lib/api/seller";
import { ApiError } from "@/lib/api/client";
import type { PagedResult, SellerProductDto } from "@/lib/api/types";
import { useAuthGuard } from "@/lib/api/useAuthGuard";

export default function SellerMyListingsPage() {
  const ready = useAuthGuard("Seller");
  const [view, setView] = useResponsiveView();
  const [result, setResult] = useState<PagedResult<SellerProductDto> | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Debounce so typing doesn't fire a request per keystroke.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    setLoading(true);
    setError("");
    getSellerListings({ page, pageSize, search: search || undefined })
      .then((data) => {
        if (!cancelled) setResult(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Failed to load your listings.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [ready, page, pageSize, search]);

  if (!ready) return null;

  const items = result?.items ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">My catalog</p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">My Listings</h1>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-700 outline-none focus:border-[var(--brand)] focus:bg-white"
              placeholder="Search by name or product code"
            />
          </div>
          <ViewToggle value={view} onChange={setView} />
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {loading ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500">Loading your listings…</div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500">
          {search
            ? "No listings match your search."
            : "You haven't added any products to your listings yet. Go to Products and use \"Add to My Listings\"."}
        </div>
      ) : view === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <ProductThumbnail name={item.productName} imageUrls={item.imageUrls} className="h-28 w-full" />
              <h2 className="font-semibold text-slate-900">{item.productName}</h2>
              {item.sku && <p className="mt-0.5 font-mono text-xs text-slate-400">{item.sku}</p>}
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-lg bg-slate-50 px-2.5 py-2">
                  <div className="text-xs text-slate-500">Base Price</div>
                  <div className="font-semibold text-slate-800">${item.supplierCost.toFixed(2)}</div>
                </div>
                <div className="rounded-lg bg-slate-50 px-2.5 py-2">
                  <div className="text-xs text-slate-500">Seller Price</div>
                  <div className="font-semibold text-slate-800">${item.sellingPrice.toFixed(2)}</div>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                  <th className="px-4 py-3 font-medium">Image</th>
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">Code</th>
                  <th className="px-4 py-3 font-medium text-right">Base Price</th>
                  <th className="px-4 py-3 font-medium text-right">Seller Price</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-slate-200 last:border-b-0">
                    <td className="px-4 py-3">
                      <ProductThumbnail name={item.productName} imageUrls={item.imageUrls} className="h-10 w-10" bare />
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800">{item.productName}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{item.sku || "—"}</td>
                    <td className="px-4 py-3 text-right text-slate-600">${item.supplierCost.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-medium text-slate-800">${item.sellingPrice.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {result && result.totalCount > 0 && (
        <Pagination
          page={result.page}
          totalPages={result.totalPages}
          totalCount={result.totalCount}
          pageSize={pageSize}
          onChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
        />
      )}

    </div>
  );
}
