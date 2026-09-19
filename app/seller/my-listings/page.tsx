"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Plus, Search, X } from "lucide-react";
import { useResponsiveView, ViewToggle } from "@/app/components/ViewToggle";
import { Pagination } from "@/app/components/Pagination";
import { ProductThumbnail } from "@/app/components/ProductThumbnail";
import { addSellerListingQuantity, getSellerListings } from "@/lib/api/seller";
import { ApiError } from "@/lib/api/client";
import type { PagedResult, SellerProductDto } from "@/lib/api/types";
import { useAuthGuard } from "@/lib/api/useAuthGuard";

const MAX_ADD = 100000;

function AddQuantityModal({
  item,
  onClose,
  onAdded,
}: {
  item: SellerProductDto;
  onClose: () => void;
  onAdded: (updated: SellerProductDto, added: number) => void;
}) {
  const [amount, setAmount] = useState("1");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const value = Number(amount);
  const invalid = !Number.isInteger(value) || value <= 0 ? "Enter a whole number greater than zero." : value > MAX_ADD ? `You can add at most ${MAX_ADD.toLocaleString()} units at a time.` : "";

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (invalid) return;
    setSubmitting(true);
    setError("");
    try {
      const updated = await addSellerListingQuantity(item.id, value);
      onAdded(updated, value);
    } catch (err) {
      setError(err instanceof ApiError ? err.errors[0] ?? err.message : "Couldn't add quantity. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" onClick={submitting ? undefined : onClose}>
      <form onSubmit={submit} onClick={(event) => event.stopPropagation()} className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Add quantity</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-4 flex items-center gap-3">
          <ProductThumbnail name={item.productName} imageUrls={item.imageUrls} className="h-12 w-12 shrink-0" bare />
          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-slate-900">{item.productName}</div>
            <div className="text-xs text-slate-500">Currently {item.quantity.toLocaleString()} listed</div>
            {item.sku && <div className="font-mono text-xs text-slate-400">{item.sku}</div>}
          </div>
        </div>

        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">Units to add</span>
          <input
            type="number"
            min={1}
            step={1}
            autoFocus
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            aria-invalid={!!invalid}
            className={`w-full rounded-xl border bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:bg-white ${invalid ? "border-red-300" : "border-slate-200 focus:border-[var(--brand)]"}`}
          />
        </label>
        {invalid ? (
          <p className="mt-1 text-xs text-red-600">{invalid}</p>
        ) : (
          <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm">
            <span className="text-slate-500">New total</span>
            <span className="font-semibold text-slate-900">{(item.quantity + value).toLocaleString()}</span>
          </div>
        )}

        {error && <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</div>}

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={submitting} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">
            Cancel
          </button>
          <button type="submit" disabled={submitting || !!invalid} className="rounded-xl bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--brand-hover)] disabled:opacity-60">
            {submitting ? "Adding…" : "Add quantity"}
          </button>
        </div>
      </form>
    </div>
  );
}

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
  const [notice, setNotice] = useState("");
  const [target, setTarget] = useState<SellerProductDto | null>(null);

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

  const addButton = (item: SellerProductDto, full = false) => (
    <button
      onClick={() => setTarget(item)}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-[var(--brand)] hover:bg-[var(--brand)]/5 ${full ? "w-full" : ""}`}
    >
      <Plus className="h-3.5 w-3.5" />
      Add quantity
    </button>
  );

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

      {notice && (
        <div className="flex items-start justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700" role="status">
          <span className="inline-flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />{notice}</span>
          <button onClick={() => setNotice("")} className="text-emerald-700/70 hover:text-emerald-800" aria-label="Dismiss">×</button>
        </div>
      )}
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
              <div className="mt-3 flex items-center justify-between gap-2">
                <span className="text-sm text-slate-500">{item.quantity.toLocaleString()} listed</span>
                {addButton(item)}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                  <th className="px-4 py-3 font-medium">Image</th>
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">Code</th>
                  <th className="px-4 py-3 font-medium text-right">Base Price</th>
                  <th className="px-4 py-3 font-medium text-right">Seller Price</th>
                  <th className="px-4 py-3 font-medium text-right">Quantity listed</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
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
                    <td className="px-4 py-3 text-right text-slate-600">{item.quantity.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">{addButton(item)}</td>
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

      {target && (
        <AddQuantityModal
          item={target}
          onClose={() => setTarget(null)}
          onAdded={(updated, added) => {
            setResult((current) => (current ? { ...current, items: current.items.map((i) => (i.id === updated.id ? updated : i)) } : current));
            setNotice(`Added ${added.toLocaleString()} unit${added === 1 ? "" : "s"} to "${updated.productName}". It now has ${updated.quantity.toLocaleString()} listed.`);
            setTarget(null);
          }}
        />
      )}
    </div>
  );
}
