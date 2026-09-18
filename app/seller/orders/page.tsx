"use client";

import { Search } from "lucide-react";
import { useResponsiveView, ViewToggle } from "@/app/components/ViewToggle";

const items = [
  { id: "ORD-4201", customer: "Layla Ahmed", total: "$178", status: "Delivered" },
  { id: "ORD-4208", customer: "Nora Bell", total: "$430", status: "Processing" },
  { id: "ORD-4212", customer: "Lina Moreno", total: "$90", status: "Pending" },
];

export default function SellerOrdersPage() {
  const [view, setView] = useResponsiveView();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-slate-500">Fulfillment</p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Orders</h1>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3"><div className="relative max-w-md flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-700 outline-none focus:border-[#f0563f] focus:bg-white" placeholder="Search orders" />
        </div>
        <ViewToggle value={view} onChange={setView} /></div>
      </div>

      {view === "grid" ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{items.map((item) => <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-center justify-between"><h2 className="font-semibold text-slate-900">{item.id}</h2><span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700">{item.status}</span></div><p className="mt-4 text-sm text-slate-600">{item.customer}</p><div className="mt-5 flex justify-between border-t border-slate-100 pt-3"><span className="text-sm text-slate-500">Order total</span><strong>{item.total}</strong></div></article>)}</div> : <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
              <th className="px-4 py-3 font-medium">Order ID</th>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium text-right">Total</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-slate-200 last:border-b-0">
                <td className="px-4 py-3 font-medium text-slate-800">{item.id}</td>
                <td className="px-4 py-3 text-slate-600">{item.customer}</td>
                <td className="px-4 py-3 text-right font-medium text-slate-800">{item.total}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${item.status === "Delivered" ? "bg-emerald-50 text-emerald-700" : item.status === "Processing" ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700"}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${item.status === "Delivered" ? "bg-emerald-500" : item.status === "Processing" ? "bg-blue-500" : "bg-amber-500"}`} />
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>}
    </div>
  );
}
