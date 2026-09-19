"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Search } from "lucide-react";
import { useResponsiveView, ViewToggle } from "@/app/components/ViewToggle";
import { Pagination } from "@/app/components/Pagination";
import { ProductCard } from "@/app/components/ProductCard";
import { ProductThumbnail } from "@/app/components/ProductThumbnail";
import { ProductFormModal } from "@/app/components/ProductFormModal";
import { deleteAdminProduct, getAdminCategories, getAdminProducts } from "@/lib/api/admin";
import { ApiError } from "@/lib/api/client";
import type { CategoryDto, PagedResult, ProductDto } from "@/lib/api/types";
import { useAuthGuard } from "@/lib/api/useAuthGuard";

const DEFAULT_PAGE_SIZE = 10;

export default function AdminProductsPage() {
  const ready = useAuthGuard("Admin");
  const [view, setView] = useResponsiveView();
  const [result, setResult] = useState<PagedResult<ProductDto> | null>(null);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ProductDto | undefined>();

  useEffect(() => {
    if (!ready) return;
    getAdminCategories().then(setCategories).catch(() => {});
  }, [ready]);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    setLoading(true);
    setError("");
    getAdminProducts({ page, pageSize })
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
  }, [ready, page, pageSize, reloadKey]);

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  const handleDelete = async (product: ProductDto) => {
    if (!window.confirm(`Delete "${product.name}"?`)) return;
    try {
      await deleteAdminProduct(product.id);
      // Step back a page if that was the last item on this one.
      if (result && result.items.length === 1 && page > 1) setPage(page - 1);
      else reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete product.");
    }
  };

  const openForm = (product?: ProductDto) => {
    setEditing(product);
    setFormOpen(true);
  };

  if (!ready) return null;

  // The API has no search/filter parameters, so these narrow the current page only.
  const items = (result?.items ?? []).filter(
    (product) =>
      product.name.toLowerCase().includes(search.toLowerCase()) && (!categoryId || product.categoryId === categoryId),
  );

  const actions = (product: ProductDto) => (
    <div className="flex justify-end gap-2">
      <button onClick={() => openForm(product)} className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">Edit</button>
      <button onClick={() => handleDelete(product)} className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">Delete</button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">Catalog overview</p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Products</h1>
        </div>
        <button onClick={() => openForm()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#f0563f] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#dc4b34]">
          <Plus className="h-4 w-4" />
          Add Product
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-[#f0563f] focus:bg-white"
              placeholder="Search products"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none">
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
            <ViewToggle value={view} onChange={setView} />
          </div>
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {loading ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500">Loading products…</div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500">No products found.</div>
      ) : view === "grid" ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((product) => (
            <ProductCard key={product.id} product={product} footer={actions(product)} />
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                  <th className="px-4 py-3 font-medium">Image</th>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium text-right">Base Price</th>
                  <th className="px-4 py-3 font-medium text-right">Seller Price</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((product) => (
                  <tr key={product.id} className="border-b border-slate-200 last:border-b-0">
                    <td className="px-4 py-3"><ProductThumbnail name={product.name} imageUrls={product.imageUrls} className="h-12 w-12" bare /></td>
                    <td className="px-4 py-3 font-medium text-slate-800">{product.name}</td>
                    <td className="px-4 py-3 text-slate-600">{product.categoryName}</td>
                    <td className="px-4 py-3 text-right text-slate-600">${product.supplierCost.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-medium text-slate-800">${product.sellingPrice.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${product.isAvailable ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${product.isAvailable ? "bg-emerald-500" : "bg-slate-400"}`} />
                        {product.isAvailable ? "Available" : "Unavailable"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">{actions(product)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {result && result.totalCount > 0 && (
        <Pagination page={result.page} totalPages={result.totalPages} totalCount={result.totalCount} pageSize={pageSize} onChange={setPage} onPageSizeChange={(size) => { setPageSize(size); setPage(1); }} />
      )}

      {formOpen && (
        <ProductFormModal
          product={editing}
          categories={categories}
          onClose={() => setFormOpen(false)}
          onSaved={() => {
            setFormOpen(false);
            reload();
          }}
        />
      )}
    </div>
  );
}
