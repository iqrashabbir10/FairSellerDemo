"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { getAdminOrders, updateOrderStatus } from "@/lib/api/admin";
import { ApiError } from "@/lib/api/client";
import type { AdminOrderDto, OrderStatus } from "@/lib/api/types";
import { useResponsiveView, ViewToggle } from "@/app/components/ViewToggle";
import { useAuthGuard } from "@/lib/api/useAuthGuard";

const statusOptions: OrderStatus[] = [
  "Pending",
  "PaymentRequired",
  "PaymentVerification",
  "ReadyToPick",
  "Picked",
  "OnTheWay",
  "Delivered",
  "Completed",
  "Processing",
  "Cancelled",
  "Returned",
];

const toneFor = (status: OrderStatus) => {
  if (status === "Delivered" || status === "Completed") return { bg: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" };
  if (status === "Cancelled" || status === "Returned") return { bg: "bg-red-50 text-red-700", dot: "bg-red-500" };
  if (status === "Processing" || status === "OnTheWay" || status === "Picked") return { bg: "bg-blue-50 text-blue-700", dot: "bg-blue-500" };
  return { bg: "bg-amber-50 text-amber-700", dot: "bg-amber-500" };
};

export default function AdminOrdersPage() {
  const ready = useAuthGuard("Admin");
  const [view, setView] = useResponsiveView();
  const [orders, setOrders] = useState<AdminOrderDto[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await getAdminOrders({ pageSize: 200 });
      setOrders(result.items);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ready) load();
  }, [ready]);

  if (!ready) return null;

  const filtered = orders.filter(
    (order) => order.orderNumber.toLowerCase().includes(search.toLowerCase()) || order.customerName.toLowerCase().includes(search.toLowerCase())
  );

  const changeStatus = async (id: string, status: OrderStatus) => {
    try {
      await updateOrderStatus(id, { status, note: `Status updated to ${status}.` });
      setOrders((current) => current.map((order) => (order.id === id ? { ...order, status } : order)));
      setEditingId(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update order status.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">Fulfillment queue</p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Orders</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3"><div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-[#f0563f]" placeholder="Search orders" />
        </div>
        <ViewToggle value={view} onChange={setView} /></div>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {loading ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500">Loading orders…</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500">No orders found.</div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1150px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                  <th className="px-4 py-3 font-medium">Order</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium text-right">Qty</th>
                  <th className="px-4 py-3 font-medium text-right">Total</th>
                  <th className="px-4 py-3 font-medium">Payment</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => {
                  const tone = toneFor(order.status);
                  return (
                    <tr key={order.id} className="border-b border-slate-200 last:border-b-0">
                      <td className="px-4 py-3 font-medium text-slate-800">{order.orderNumber}</td>
                      <td className="px-4 py-3 text-slate-700">
                        <div>{order.customerName}</div>
                        <div className="text-xs text-slate-500">{order.customerPhone}</div>
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600">{order.quantity}</td>
                      <td className="px-4 py-3 text-right font-medium text-slate-800">${order.totalAmount.toFixed(2)}</td>
                      <td className="px-4 py-3 text-slate-600">{order.paymentStatus}</td>
                      <td className="px-4 py-3">
                        {editingId === order.id ? (
                          <select
                            autoFocus
                            defaultValue={order.status}
                            onBlur={() => setEditingId(null)}
                            onChange={(e) => changeStatus(order.id, e.target.value as OrderStatus)}
                            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs"
                          >
                            {statusOptions.map((status) => (
                              <option key={status} value={status}>{status}</option>
                            ))}
                          </select>
                        ) : (
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${tone.bg}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
                            {order.status}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{new Date(order.createdAtUtc).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => setEditingId(order.id)} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
                          Update status
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
