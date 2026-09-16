"use client";

import { useEffect, useState } from "react";
import { getAdminProducts } from "@/lib/api/admin";
import { ApiError } from "@/lib/api/client";
import type { ProductDto } from "@/lib/api/types";
import { useAuthGuard } from "@/lib/api/useAuthGuard";

export default function SellersProductsPage() {
  const ready = useAuthGuard("Admin");
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ready) return;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const result = await getAdminProducts({ pageSize: 200 });
        setProducts(result.items);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Failed to load products.");
      } finally {
        setLoading(false);
      }
    })();
  }, [ready]);

  if (!ready) return null;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-slate-500">Seller listings</p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Sellers Products</h1>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {loading ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500">Loading products…</div>
      ) : products.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500">No products found.</div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
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
                {products.map((product) => (
                  <tr key={product.id} className="border-b border-slate-200 last:border-b-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-slate-200 to-slate-100" />
                        <span className="font-medium text-slate-800">{product.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{product.categoryName}</td>
                    <td className="px-4 py-3 text-right font-medium text-slate-800">${product.sellingPrice.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{product.stockQuantity}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${product.isAvailable ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${product.isAvailable ? "bg-emerald-500" : "bg-slate-400"}`} />
                        {product.isAvailable ? "Available" : "Unavailable"}
                      </span>
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
