"use client";

import { Plus, Search, SlidersHorizontal } from "lucide-react";
import { products } from "@/lib/mock-data";
import { useResponsiveView, ViewToggle } from "@/app/components/ViewToggle";

export default function AdminProductsPage() {
  const [view, setView] = useResponsiveView();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">Catalog overview</p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Products</h1>
        </div>
        <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#f0563f] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#dc4b34]">
          <Plus className="h-4 w-4" />
          Add Product
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-[#f0563f] focus:bg-white"
              placeholder="Search products"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none">
              <option>Category</option>
              <option>Home & Living</option>
              <option>Electronics</option>
              <option>Fashion</option>
            </select>
            <select className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none">
              <option>Seller</option>
              <option>Veloura Home</option>
              <option>Luma Elec</option>
              <option>Meridian Wear</option>
            </select>
            <select className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none">
              <option>Status</option>
              <option>Active</option>
              <option>Inactive</option>
            </select>
            <button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
              <SlidersHorizontal className="h-4 w-4" />
              Filters
            </button>
            <ViewToggle value={view} onChange={setView} />
          </div>
        </div>
      </div>

      {view === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => (
            <article key={product.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-4 flex h-36 items-center justify-center rounded-xl bg-gradient-to-br from-slate-200 to-slate-100 text-sm text-slate-400">Product image</div>
              <div className="flex items-start justify-between gap-3">
                <div><h2 className="font-semibold text-slate-900">{product.name}</h2><p className="mt-1 text-sm text-slate-500">{product.category}</p></div>
                <span className="text-lg font-semibold text-slate-900">${product.price}</span>
              </div>
              <div className="mt-4 flex items-center justify-between text-sm text-slate-500"><span>{product.stock} in stock</span><span>{product.shopName}</span></div>
              <div className="mt-4 flex justify-end gap-2 border-t border-slate-100 pt-3"><button className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700">Edit</button><button className="rounded-lg bg-[#f0563f] px-2.5 py-1.5 text-xs font-medium text-white">Feature</button></div>
            </article>
          ))}
        </div>
      ) : <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <th className="px-4 py-3 font-medium">Image</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium text-right">Price</th>
                <th className="px-4 py-3 font-medium text-right">Stock</th>
                <th className="px-4 py-3 font-medium">Seller</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-b border-slate-200 last:border-b-0">
                  <td className="px-4 py-3">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-slate-200 to-slate-100" />
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-800">{product.name}</td>
                  <td className="px-4 py-3 text-slate-600">{product.category}</td>
                  <td className="px-4 py-3 text-right font-medium text-slate-800">${product.price}</td>
                  <td className="px-4 py-3 text-right text-slate-600">{product.stock}</td>
                  <td className="px-4 py-3 text-slate-600">{product.shopName}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${product.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${product.status === "active" ? "bg-emerald-500" : "bg-slate-400"}`} />
                      {product.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">Edit</button>
                      <button className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">Delete</button>
                      <button className="rounded-lg bg-[#f0563f] px-2.5 py-1.5 text-xs font-medium text-white hover:bg-[#dc4b34]">Feature</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>}
    </div>
  );
}
