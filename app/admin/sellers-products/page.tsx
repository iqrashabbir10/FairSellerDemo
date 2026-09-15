import { Check, X } from "lucide-react";
import { products } from "@/lib/mock-data";

export default function SellersProductsPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-slate-500">Seller listings</p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Sellers Products</h1>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">Seller</th>
                <th className="px-4 py-3 font-medium">Shop Name</th>
                <th className="px-4 py-3 font-medium text-right">Price</th>
                <th className="px-4 py-3 font-medium text-right">Stock</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Approval</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.slice(0, 8).map((product) => (
                <tr key={product.id} className="border-b border-slate-200 last:border-b-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-slate-200 to-slate-100" />
                      <span className="font-medium text-slate-800">{product.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{product.sellerName}</td>
                  <td className="px-4 py-3 text-slate-600">{product.shopName}</td>
                  <td className="px-4 py-3 text-right font-medium text-slate-800">${product.price}</td>
                  <td className="px-4 py-3 text-right text-slate-600">{product.stock}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${product.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${product.status === "active" ? "bg-emerald-500" : "bg-slate-400"}`} />
                      {product.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${product.approved ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700"}`}>
                      {product.approved ? "Approved" : "Pending"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button className="inline-flex items-center gap-1 rounded-lg bg-[#f0563f] px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-[#dc4b34]">
                        <Check className="h-3.5 w-3.5" />
                        Approve
                      </button>
                      <button className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                        <X className="h-3.5 w-3.5" />
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
