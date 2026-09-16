"use client";

import { useEffect, useState } from "react";
import { Plus, Search, X } from "lucide-react";
import { createAdminProduct, deleteAdminProduct, getAdminCategories, getAdminProducts, updateAdminProduct } from "@/lib/api/admin";
import { ApiError } from "@/lib/api/client";
import type { CategoryDto, ProductDto } from "@/lib/api/types";
import { useResponsiveView, ViewToggle } from "@/app/components/ViewToggle";
import { useAuthGuard } from "@/lib/api/useAuthGuard";

type ProductFormState = {
  name: string;
  description: string;
  categoryId: string;
  supplierCost: string;
  sellingPrice: string;
  stockQuantity: string;
  isAvailable: boolean;
};

const emptyForm: ProductFormState = {
  name: "",
  description: "",
  categoryId: "",
  supplierCost: "",
  sellingPrice: "",
  stockQuantity: "",
  isAvailable: true,
};

export default function AdminProductsPage() {
  const ready = useAuthGuard("Admin");
  const [view, setView] = useResponsiveView();
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductDto | null>(null);
  const [form, setForm] = useState<ProductFormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [productsResult, categoriesResult] = await Promise.all([
        getAdminProducts({ pageSize: 200 }),
        getAdminCategories(),
      ]);
      setProducts(productsResult.items);
      setCategories(categoriesResult);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load products.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ready) load();
  }, [ready]);

  if (!ready) return null;

  const filtered = products.filter((product) => product.name.toLowerCase().includes(search.toLowerCase()));

  const openCreateForm = () => {
    setEditingProduct(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEditForm = (product: ProductDto) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      description: product.description,
      categoryId: product.categoryId,
      supplierCost: "",
      sellingPrice: String(product.sellingPrice),
      stockQuantity: String(product.stockQuantity),
      isAvailable: product.isAvailable,
    });
    setShowForm(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (editingProduct) {
        await updateAdminProduct(editingProduct.id, {
          name: form.name,
          description: form.description,
          categoryId: form.categoryId,
          supplierCost: Number(form.supplierCost),
          sellingPrice: Number(form.sellingPrice),
          stockQuantity: Number(form.stockQuantity),
          isAvailable: form.isAvailable,
        });
      } else {
        await createAdminProduct({
          name: form.name,
          description: form.description,
          categoryId: form.categoryId,
          supplierCost: Number(form.supplierCost),
          sellingPrice: Number(form.sellingPrice),
          stockQuantity: Number(form.stockQuantity),
        });
      }
      setShowForm(false);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save product.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAdminProduct(id);
      setProducts((current) => current.filter((product) => product.id !== id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete product.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">Catalog overview</p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Products</h1>
        </div>
        <button onClick={openCreateForm} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#f0563f] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#dc4b34]">
          <Plus className="h-4 w-4" />
          Add Product
        </button>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {showForm && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">{editingProduct ? "Edit product" : "Add product"}</h2>
            <button onClick={() => setShowForm(false)} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"><X className="h-4 w-4" /></button>
          </div>
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Name</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-[#f0563f] focus:bg-white" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Category</label>
              <select required value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-[#f0563f] focus:bg-white">
                <option value="" disabled>Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Description</label>
              <textarea required rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-[#f0563f] focus:bg-white" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Supplier cost</label>
              <input required type="number" min="0" step="0.01" value={form.supplierCost} onChange={(e) => setForm({ ...form, supplierCost: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-[#f0563f] focus:bg-white" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Selling price</label>
              <input required type="number" min="0" step="0.01" value={form.sellingPrice} onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-[#f0563f] focus:bg-white" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Stock quantity</label>
              <input required type="number" min="0" value={form.stockQuantity} onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-[#f0563f] focus:bg-white" />
            </div>
            {editingProduct && (
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={form.isAvailable} onChange={(e) => setForm({ ...form, isAvailable: e.target.checked })} className="h-4 w-4 rounded border-slate-300 text-[#f0563f]" />
                Available
              </label>
            )}
            <div className="md:col-span-2 flex justify-end gap-2">
              <button type="button" onClick={() => setShowForm(false)} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
              <button type="submit" disabled={saving} className="rounded-xl bg-[#f0563f] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#dc4b34] disabled:opacity-60">
                {saving ? "Saving..." : editingProduct ? "Save changes" : "Create product"}
              </button>
            </div>
          </form>
        </div>
      )}

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
          <ViewToggle value={view} onChange={setView} />
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500">Loading products…</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500">No products found.</div>
      ) : view === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((product) => (
            <article key={product.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-4 flex h-36 items-center justify-center rounded-xl bg-gradient-to-br from-slate-200 to-slate-100 text-sm text-slate-400">Product image</div>
              <div className="flex items-start justify-between gap-3">
                <div><h2 className="font-semibold text-slate-900">{product.name}</h2><p className="mt-1 text-sm text-slate-500">{product.categoryName}</p></div>
                <span className="text-lg font-semibold text-slate-900">${product.sellingPrice.toFixed(2)}</span>
              </div>
              <div className="mt-4 flex items-center justify-between text-sm text-slate-500"><span>{product.stockQuantity} in stock</span><span>{product.isAvailable ? "Available" : "Unavailable"}</span></div>
              <div className="mt-4 flex justify-end gap-2 border-t border-slate-100 pt-3">
                <button onClick={() => openEditForm(product)} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700">Edit</button>
                <button onClick={() => handleDelete(product.id)} className="rounded-lg bg-[#f0563f] px-2.5 py-1.5 text-xs font-medium text-white">Delete</button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium text-right">Price</th>
                <th className="px-4 py-3 font-medium text-right">Stock</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((product) => (
                <tr key={product.id} className="border-b border-slate-200 last:border-b-0">
                  <td className="px-4 py-3 font-medium text-slate-800">{product.name}</td>
                  <td className="px-4 py-3 text-slate-600">{product.categoryName}</td>
                  <td className="px-4 py-3 text-right font-medium text-slate-800">${product.sellingPrice.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right text-slate-600">{product.stockQuantity}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${product.isAvailable ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${product.isAvailable ? "bg-emerald-500" : "bg-slate-400"}`} />
                      {product.isAvailable ? "Available" : "Unavailable"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEditForm(product)} className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">Edit</button>
                      <button onClick={() => handleDelete(product.id)} className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      )}
    </div>
  );
}
