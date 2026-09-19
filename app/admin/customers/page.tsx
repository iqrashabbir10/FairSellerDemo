"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { useResponsiveView, ViewToggle } from "@/app/components/ViewToggle";
import { Pagination } from "@/app/components/Pagination";
import { getAdminOrders } from "@/lib/api/admin";
import { ApiError } from "@/lib/api/client";
import type { AdminOrderDto } from "@/lib/api/types";
import { useAuthGuard } from "@/lib/api/useAuthGuard";

// There is no customers endpoint, so customers are derived from order history: orders sharing an
// email (or, failing that, a phone number or name) belong to the same customer.
interface Customer {
  key: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  ordersCount: number;
  totalSpent: number;
  firstOrderAt: string;
  lastOrderAt: string;
  orders: AdminOrderDto[];
}

const money = (value: number) => `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function buildCustomers(orders: AdminOrderDto[]): Customer[] {
  const map = new Map<string, Customer>();
  for (const order of orders) {
    const key = (order.customerEmail || order.customerPhone || order.customerName || "unknown").trim().toLowerCase();
    let customer = map.get(key);
    if (!customer) {
      customer = {
        key,
        name: order.customerName || "Unknown customer",
        email: order.customerEmail,
        phone: order.customerPhone,
        address: order.customerAddress,
        ordersCount: 0,
        totalSpent: 0,
        firstOrderAt: order.createdAtUtc,
        lastOrderAt: order.createdAtUtc,
        orders: [],
      };
      map.set(key, customer);
    }
    customer.orders.push(order);
    customer.ordersCount += 1;
    customer.totalSpent += order.totalAmount;
    if (order.createdAtUtc < customer.firstOrderAt) customer.firstOrderAt = order.createdAtUtc;
    if (order.createdAtUtc > customer.lastOrderAt) {
      customer.lastOrderAt = order.createdAtUtc;
      // Keep the most recent contact details.
      customer.name = order.customerName || customer.name;
      customer.phone = order.customerPhone || customer.phone;
      customer.address = order.customerAddress || customer.address;
    }
  }
  return Array.from(map.values()).sort((a, b) => b.lastOrderAt.localeCompare(a.lastOrderAt));
}

function CustomerModal({ customer, onClose }: { customer: Customer; onClose: () => void }) {
  const orders = [...customer.orders].sort((a, b) => b.createdAtUtc.localeCompare(a.createdAtUtc));
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl" onClick={(event) => event.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{customer.name}</h2>
            <p className="text-sm text-slate-500">{customer.email || "No email"}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
        <dl className="mb-5 space-y-2 text-sm">
          <div className="flex justify-between gap-4"><dt className="text-slate-500">Phone</dt><dd className="font-medium text-slate-800">{customer.phone || "—"}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-slate-500">Address</dt><dd className="text-right font-medium text-slate-800">{customer.address || "—"}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-slate-500">Total spent</dt><dd className="font-semibold text-slate-900">{money(customer.totalSpent)}</dd></div>
        </dl>
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Orders ({orders.length})</div>
        <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
          {orders.map((order) => (
            <li key={order.id} className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm">
              <div>
                <div className="font-medium text-slate-800">{order.orderNumber}</div>
                <div className="text-xs text-slate-500">{new Date(order.createdAtUtc).toLocaleString()}</div>
              </div>
              <div className="text-right">
                <div className="font-medium text-slate-800">{money(order.totalAmount)}</div>
                <div className="text-xs text-slate-500">{order.status.replace(/([a-z])([A-Z])/g, "$1 $2")}</div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function CustomersPage() {
  const ready = useAuthGuard("Admin");
  const [view, setView] = useResponsiveView();
  const [orders, setOrders] = useState<AdminOrderDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [detailKey, setDetailKey] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    (async () => {
      try {
        const first = await getAdminOrders({ page: 1, pageSize: 100 });
        const all = [...first.items];
        for (let p = 2; p <= first.totalPages; p++) {
          all.push(...(await getAdminOrders({ page: p, pageSize: 100 })).items);
        }
        if (!cancelled) setOrders(all);
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Failed to load customers.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ready]);

  const customers = useMemo(() => buildCustomers(orders), [orders]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return customers.filter((c) => !term || [c.name, c.email, c.phone].some((v) => v?.toLowerCase().includes(term)));
  }, [customers, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const detail = detailKey ? customers.find((c) => c.key === detailKey) ?? null : null;

  if (!ready) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">Customer base</p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Customer Profiles</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-[#f0563f]"
              placeholder="Search customers"
            />
          </div>
          <ViewToggle value={view} onChange={setView} />
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {loading ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500">Loading customers…</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500">No customers found.</div>
      ) : view === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {paged.map((customer) => (
            <article key={customer.key} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div>
                <h2 className="font-semibold text-slate-900">{customer.name}</h2>
                <p className="mt-1 text-sm text-slate-500">{customer.email || customer.phone || "—"}</p>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-slate-500">Orders</p><p className="font-semibold text-slate-800">{customer.ordersCount}</p></div>
                <div><p className="text-slate-500">Total spent</p><p className="font-semibold text-slate-800">{money(customer.totalSpent)}</p></div>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                <span className="text-xs text-slate-500">Since {new Date(customer.firstOrderAt).toLocaleDateString()}</span>
                <button onClick={() => setDetailKey(customer.key)} className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">View</button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Phone</th>
                  <th className="px-4 py-3 font-medium text-right">Orders Count</th>
                  <th className="px-4 py-3 font-medium text-right">Total Spent</th>
                  <th className="px-4 py-3 font-medium">First Order</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((customer) => (
                  <tr key={customer.key} className="border-b border-slate-200 last:border-b-0">
                    <td className="px-4 py-3 font-medium text-slate-800">{customer.name}</td>
                    <td className="px-4 py-3 text-slate-600">{customer.email || "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{customer.phone || "—"}</td>
                    <td className="px-4 py-3 text-right text-slate-700">{customer.ordersCount}</td>
                    <td className="px-4 py-3 text-right font-medium text-slate-800">{money(customer.totalSpent)}</td>
                    <td className="px-4 py-3 text-slate-600">{new Date(customer.firstOrderAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => setDetailKey(customer.key)} className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <Pagination
          page={currentPage}
          totalPages={totalPages}
          totalCount={filtered.length}
          pageSize={pageSize}
          onChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
        />
      )}

      {detail && <CustomerModal customer={detail} onClose={() => setDetailKey(null)} />}
    </div>
  );
}
