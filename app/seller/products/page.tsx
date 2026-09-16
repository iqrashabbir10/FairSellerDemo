"use client";

import { useEffect, useState } from "react";
import { Plus, Search } from "lucide-react";
import { useResponsiveView, ViewToggle } from "@/app/components/ViewToggle";
import { getSellerProducts } from "@/lib/api/seller";
import { ApiError } from "@/lib/api/client";
import type { ProductDto } from "@/lib/api/types";
import { useAuthGuard } from "@/lib/api/useAuthGuard";

export default function SellerProductsPage() {
  const ready = useAuthGuard("Seller");
  const [view, setView] = useResponsiveView();
  const [items, setItems] = useState<ProductDto[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  if (!ready) return null;

  const filtered = items.filter((item) => item.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">My catalog</p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Products</h1>
        </div>
        <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#f0563f] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#dc4b34]">
          <Plus className="h-4 w-4" />
          Add Product
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative max-w-md flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-700 outline-none focus:border-[#f0563f] focus:bg-white" placeholder="Search products" />
        </div>
        <ViewToggle value={view} onChange={setView} />
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {loading ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500">Loading products…</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500">No products found.</div>
      ) : view === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item) => (
            <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-4 h-28 rounded-xl bg-gradient-to-br from-slate-200 to-slate-100" />
              <h2 className="font-semibold text-slate-900">{item.name}</h2>
              <p className="mt-1 text-sm text-slate-500">{item.categoryName}</p>
              <div className="mt-4 flex justify-between text-sm">
                <span className="font-medium text-slate-900">${item.sellingPrice.toFixed(2)}</span>
                <span className="text-slate-500">{item.stockQuantity} in stock</span>
              </div>
              <div className="mt-4">
                <span className={`rounded-full px-2 py-1 text-xs font-medium ${item.isAvailable ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                  {item.isAvailable ? "Available" : "Unavailable"}
                </span>
              </div>
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
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}
    </div>
  );
}
