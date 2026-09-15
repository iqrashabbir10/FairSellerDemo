import { Plus, Search } from "lucide-react";

const items = [
  { name: "Aster Ceramic Lamp", category: "Home & Living", price: "$94", stock: 26, status: "Approved" },
  { name: "Nova Wireless Earbuds", category: "Electronics", price: "$149", stock: 53, status: "Pending" },
  { name: "CoreFlex Resistance Band", category: "Fitness", price: "$39", stock: 75, status: "Rejected" },
];

export default function SellerProductsPage() {
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
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-700 outline-none focus:border-[#f0563f] focus:bg-white" placeholder="Search products" />
        </div>
      </div>

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
            {items.map((item) => (
              <tr key={item.name} className="border-b border-slate-200 last:border-b-0">
                <td className="px-4 py-3 font-medium text-slate-800">{item.name}</td>
                <td className="px-4 py-3 text-slate-600">{item.category}</td>
                <td className="px-4 py-3 text-right font-medium text-slate-800">{item.price}</td>
                <td className="px-4 py-3 text-right text-slate-600">{item.stock}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${item.status === "Approved" ? "bg-emerald-50 text-emerald-700" : item.status === "Pending" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${item.status === "Approved" ? "bg-emerald-500" : item.status === "Pending" ? "bg-amber-500" : "bg-red-500"}`} />
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
