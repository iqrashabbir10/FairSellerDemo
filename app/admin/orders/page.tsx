import { Eye, Search, X } from "lucide-react";
import { orders } from "@/lib/mock-data";

const statusTabs = ["All", "Pending", "Processing", "Shipped", "Delivered", "Cancelled"];

export default function AdminOrdersPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">Fulfillment queue</p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Orders</h1>
        </div>
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-[#f0563f]"
            placeholder="Search orders"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {statusTabs.map((tab, index) => (
          <button
            key={tab}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
              index === 0
                ? "bg-[#f0563f] text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <th className="px-4 py-3 font-medium">Order ID</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Seller</th>
                <th className="px-4 py-3 font-medium">Items</th>
                <th className="px-4 py-3 font-medium text-right">Total</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-slate-200 last:border-b-0">
                  <td className="px-4 py-3 font-medium text-slate-800">{order.id}</td>
                  <td className="px-4 py-3 text-slate-700">{order.customerName}</td>
                  <td className="px-4 py-3 text-slate-700">{order.shopName}</td>
                  <td className="px-4 py-3 text-slate-600">{order.items.length} item(s)</td>
                  <td className="px-4 py-3 text-right font-medium text-slate-800">${order.total}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                      order.status === "Delivered" ? "bg-emerald-50 text-emerald-700" :
                      order.status === "Pending" ? "bg-amber-50 text-amber-700" :
                      order.status === "Cancelled" ? "bg-red-50 text-red-700" :
                      order.status === "Processing" ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-700"
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${
                        order.status === "Delivered" ? "bg-emerald-500" :
                        order.status === "Pending" ? "bg-amber-500" :
                        order.status === "Cancelled" ? "bg-red-500" :
                        order.status === "Processing" ? "bg-blue-500" : "bg-slate-500"
                      }`} />
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{order.date}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </button>
                      <button className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
                        <X className="h-3.5 w-3.5" />
                        Update
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
