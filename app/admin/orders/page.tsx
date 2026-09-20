"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye, Printer, Search, X } from "lucide-react";
import { useResponsiveView, ViewToggle } from "@/app/components/ViewToggle";
import { Pagination } from "@/app/components/Pagination";
import { getAdminOrders, getAdminSellers, updateOrderStatus } from "@/lib/api/admin";
import { ApiError } from "@/lib/api/client";
import type { AdminOrderDto, OrderItemDto, OrderStatus } from "@/lib/api/types";
import { useAuthGuard } from "@/lib/api/useAuthGuard";

const STATUSES: OrderStatus[] = [
  "Pending",
  "Picked",
  "OnTheWay",
  "Delivered"
];

// Admins can only move an order to these two statuses; the other statuses stay visible and filterable.
const ADMIN_SETTABLE: OrderStatus[] = ["OnTheWay", "Delivered"];

const statusLabel = (status: string) => status.replace(/([a-z])([A-Z])/g, "$1 $2");

const statusStyles: Record<string, { badge: string; dot: string }> = {
  Delivered: { badge: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
  Pending: { badge: "bg-amber-50 text-amber-700", dot: "bg-amber-500" },
  Picked: { badge: "bg-blue-50 text-blue-700", dot: "bg-blue-500" },
  OnTheWay: { badge: "bg-blue-50 text-blue-700", dot: "bg-blue-500" },
};

function StatusBadge({ status }: { status: OrderStatus | "Mixed" }) {
  const style = statusStyles[status] ?? { badge: "bg-slate-100 text-slate-700", dot: "bg-slate-500" };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${style.badge}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {statusLabel(status)}
    </span>
  );
}

const selectClass = "rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-[var(--brand)]";
const money = (value: number) => `$${value.toFixed(2)}`;

async function fetchAll<T>(load: (page: number) => Promise<{ items: T[]; totalPages: number }>) {
  const first = await load(1);
  const items = [...first.items];
  for (let page = 2; page <= first.totalPages; page++) {
    items.push(...(await load(page)).items);
  }
  return items;
}

// An order can hold several products; the invoice lists them as items.
interface Invoice {
  key: string;
  orderNumber: string;
  sellerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;
  createdAtUtc: string;
  items: OrderItemDto[];
  total: number;
  profit: number;
  status: OrderStatus;
}

function buildInvoices(orders: AdminOrderDto[]): Invoice[] {
  return [...orders]
    .sort((a, b) => new Date(b.createdAtUtc).getTime() - new Date(a.createdAtUtc).getTime())
    .map((order) => ({
      key: order.id,
      orderNumber: order.orderNumber,
      sellerId: order.sellerId,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerEmail: order.customerEmail,
      customerAddress: order.customerAddress,
      createdAtUtc: order.createdAtUtc,
      items: order.items ?? [],
      total: order.totalAmount,
      profit: order.profitAmount,
      status: order.status,
    }));
}

const invoiceNumber = (invoice: Invoice) => invoice.orderNumber;
const totalUnits = (invoice: Invoice) => invoice.items.reduce((sum, item) => sum + item.quantity, 0);

// One product: "Name × 2" with its code underneath; several: "3 products".
function ItemsSummary({ invoice }: { invoice: Invoice }) {
  if (invoice.items.length === 0) return <>—</>;
  if (invoice.items.length === 1) {
    const item = invoice.items[0];
    return (
      <>
        {item.productName} × {item.quantity}
        {item.sku && <span className="block font-mono text-xs text-slate-400">{item.sku}</span>}
      </>
    );
  }
  return <>{invoice.items.length} products · {totalUnits(invoice)} units</>;
}

function ConfirmStatusModal({
  invoice,
  status,
  saving,
  onCancel,
  onConfirm,
}: {
  invoice: Invoice;
  status: OrderStatus;
  saving: boolean;
  onCancel: () => void;
  onConfirm: (note: string) => void;
}) {
  const [note, setNote] = useState("");
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 p-4" onClick={saving ? undefined : onCancel}>
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-xl" onClick={(event) => event.stopPropagation()}>
        <h2 className="text-lg font-semibold text-slate-900">Confirm status change</h2>
        <p className="mt-2 text-sm text-slate-600">
          Change <span className="font-medium text-slate-900">{invoiceNumber(invoice)}</span> from{" "}
          <span className="font-medium text-slate-900">{statusLabel(invoice.status)}</span> to{" "}
          <span className="font-medium text-slate-900">{statusLabel(status)}</span>?
        </p>
        <label className="mt-4 block text-sm">
          <span className="mb-1 block font-medium text-slate-700">Note <span className="font-normal text-slate-400">(optional)</span></span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none focus:border-[var(--brand)] focus:bg-white"
          />
        </label>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onCancel} disabled={saving} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">
            Cancel
          </button>
          <button onClick={() => onConfirm(note.trim())} disabled={saving} className="rounded-xl bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--brand-hover)] disabled:opacity-60">
            {saving ? "Updating…" : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}

function InvoiceModal({
  invoice,
  sellerName,
  sellerEmail,
  statusControl,
  onClose,
}: {
  invoice: Invoice;
  sellerName: string;
  sellerEmail?: string;
  statusControl: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 sm:items-center" onClick={onClose}>
      <style>{`@media print {
        body * { visibility: hidden !important; }
        #invoice-print, #invoice-print * { visibility: visible !important; }
        #invoice-print { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none !important; border: none !important; }
        .no-print { display: none !important; }
      }`}</style>
      <div className="w-full max-w-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="no-print mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm text-white">{statusControl}</div>
          <div className="flex gap-2">
            <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50">
              <Printer className="h-4 w-4" />
              Print
            </button>
            <button onClick={onClose} className="rounded-lg bg-white p-2 text-slate-600 shadow-sm hover:bg-slate-50" aria-label="Close">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div id="invoice-print" className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-700 shadow-xl sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--brand)] text-sm font-bold text-white">W</div>
              <div>
                <div className="text-lg font-semibold text-slate-900">WayFair</div>
                <div className="text-xs text-slate-500">Marketplace</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-semibold uppercase tracking-wide text-slate-900">Invoice</div>
              <div className="mt-1 text-xs text-slate-500">{invoiceNumber(invoice)}</div>
              <div className="text-xs text-slate-500">{new Date(invoice.createdAtUtc).toLocaleString()}</div>
              <div className="mt-2"><StatusBadge status={invoice.status} /></div>
            </div>
          </div>

          <div className="grid gap-6 border-b border-slate-200 py-6 sm:grid-cols-2">
            <div>
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Bill to</div>
              <div className="font-semibold text-slate-900">{invoice.customerName || "—"}</div>
              {invoice.customerAddress && <div>{invoice.customerAddress}</div>}
              {invoice.customerPhone && <div>{invoice.customerPhone}</div>}
              {invoice.customerEmail && <div>{invoice.customerEmail}</div>}
            </div>
            <div className="sm:text-right">
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Sold by</div>
              <div className="font-semibold text-slate-900">{sellerName}</div>
              {sellerEmail && <div className="break-all">{sellerEmail}</div>}
            </div>
          </div>

          <div className="overflow-x-auto py-6">
            <table className="w-full min-w-[420px] text-left">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                  <th className="pb-2 font-semibold">Item</th>
                  <th className="pb-2 text-right font-semibold">Qty</th>
                  <th className="pb-2 text-right font-semibold">Unit price</th>
                  <th className="pb-2 text-right font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item) => (
                  <tr key={item.productId} className="border-b border-slate-100 last:border-b-0">
                    <td className="py-3">
                      <div className="font-medium text-slate-900">{item.productName}</div>
                      {item.sku && <div className="font-mono text-xs text-slate-500">SKU {item.sku}</div>}
                    </td>
                    <td className="py-3 text-right">{item.quantity}</td>
                    <td className="py-3 text-right">{money(item.unitPrice)}</td>
                    <td className="py-3 text-right font-medium text-slate-900">{money(item.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="ml-auto w-full max-w-xs space-y-2 border-t border-slate-200 pt-4">
            <div className="flex justify-between">
              <span className="text-slate-500">Items</span>
              <span>{totalUnits(invoice)}</span>
            </div>
            <div className="flex justify-between text-base font-semibold text-slate-900">
              <span>Total</span>
              <span>{money(invoice.total)}</span>
            </div>
            <div className="no-print flex justify-between text-xs text-slate-400">
              <span>Seller profit</span>
              <span>{money(invoice.profit)}</span>
            </div>
          </div>

          <div className="mt-8 border-t border-slate-200 pt-4 text-center text-xs text-slate-400">Thank you for your business.</div>
        </div>
      </div>
    </div>
  );
}

export default function AdminOrdersPage() {
  const ready = useAuthGuard("Admin");
  const [view, setView] = useResponsiveView();
  const [orders, setOrders] = useState<AdminOrderDto[]>([]);
  const [sellerNames, setSellerNames] = useState<Record<string, string>>({});
  const [sellerEmails, setSellerEmails] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "All">("All");
  const [sellerFilter, setSellerFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [pending, setPending] = useState<{ invoiceKey: string; status: OrderStatus } | null>(null);
  const [saving, setSaving] = useState(false);
  const [detailKey, setDetailKey] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    (async () => {
      try {
        // The orders endpoint only paginates (no filters), so load everything and filter/sort here.
        const [allOrders, sellers] = await Promise.all([
          fetchAll((p) => getAdminOrders({ page: p, pageSize: 100 })),
          fetchAll((p) => getAdminSellers({ page: p, pageSize: 100 })).catch(() => []),
        ]);
        if (cancelled) return;
        setOrders(allOrders);
        setSellerNames(Object.fromEntries(sellers.map((s) => [s.id, s.shopName || s.fullName])));
        setSellerEmails(Object.fromEntries(sellers.map((s) => [s.id, s.email])));
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Failed to load orders.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ready]);

  const sellerName = (id: string) => sellerNames[id] ?? "Unknown seller";

  const invoices = useMemo(() => buildInvoices(orders), [orders]);

  const sellerOptions = useMemo(
    () =>
      Array.from(new Set(orders.map((o) => o.sellerId)))
        .map((id) => ({ id, name: sellerNames[id] ?? "Unknown seller" }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [orders, sellerNames],
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return invoices
      .filter((inv) => statusFilter === "All" || inv.status === statusFilter)
      .filter((inv) => !sellerFilter || inv.sellerId === sellerFilter)
      .filter((inv) => !term || inv.customerName.toLowerCase().includes(term) || inv.orderNumber.toLowerCase().includes(term) || inv.items.some((item) => item.productName.toLowerCase().includes(term) || item.sku?.toLowerCase().includes(term)));
  }, [invoices, statusFilter, sellerFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    invoices.forEach((inv) => (counts[inv.status] = (counts[inv.status] ?? 0) + 1));
    return counts;
  }, [invoices]);

  const pendingInvoice = pending ? invoices.find((inv) => inv.key === pending.invoiceKey) ?? null : null;
  const detailInvoice = detailKey ? invoices.find((inv) => inv.key === detailKey) ?? null : null;

  const confirmStatusChange = async (note: string) => {
    if (!pendingInvoice || !pending) return;
    const { status } = pending;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await updateOrderStatus(pendingInvoice.key, { status, note });
      setOrders((current) => current.map((o) => (o.id === pendingInvoice.key ? { ...o, status } : o)));
      setNotice(`${invoiceNumber(pendingInvoice)} marked as ${statusLabel(status)}.`);
    } catch (err) {
      setError(err instanceof ApiError ? err.errors[0] ?? err.message : "Failed to update the order status.");
    } finally {
      setSaving(false);
      setPending(null);
    }
  };

  // Picking a status only stages it; nothing is sent until the admin confirms in the dialog.
  const statusSelect = (invoice: Invoice, dark = false) => (
    <select
      value={ADMIN_SETTABLE.includes(invoice.status) ? invoice.status : ""}
      onChange={(e) => e.target.value && setPending({ invoiceKey: invoice.key, status: e.target.value as OrderStatus })}
      aria-label={`Change status of ${invoiceNumber(invoice)}`}
      className={`rounded-lg border px-2 py-1.5 text-xs font-medium outline-none focus:border-[var(--brand)] ${dark ? "border-white/30 bg-white text-slate-700" : "border-slate-200 bg-white text-slate-700"}`}
    >
      {!ADMIN_SETTABLE.includes(invoice.status) && (
        <option value="" disabled>
          {statusLabel(invoice.status)} – change to…
        </option>
      )}
      {ADMIN_SETTABLE.map((s) => (
        <option key={s} value={s}>{statusLabel(s)}</option>
      ))}
    </select>
  );

  if (!ready) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">Fulfillment queue</p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Orders</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-[var(--brand)]"
              placeholder="Search order #, customer or product code"
            />
          </div>
          <select value={sellerFilter} onChange={(e) => { setSellerFilter(e.target.value); setPage(1); }} className={selectClass} aria-label="Filter by seller">
            <option value="">All sellers</option>
            {sellerOptions.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <ViewToggle value={view} onChange={setView} />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["All", ...STATUSES] as const).map((tab) => {
          const active = statusFilter === tab;
          const count = tab === "All" ? invoices.length : statusCounts[tab] ?? 0;
          return (
            <button
              key={tab}
              onClick={() => { setStatusFilter(tab); setPage(1); }}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                active ? "bg-[var(--brand)] text-white" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {tab === "All" ? "All" : statusLabel(tab)} <span className={active ? "text-white/80" : "text-slate-400"}>{count}</span>
            </button>
          );
        })}
      </div>

      {notice && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</div>}
      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {loading ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500">Loading orders…</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500">No orders found.</div>
      ) : view === "grid" ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {paged.map((invoice) => (
            <article key={invoice.key} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-semibold text-slate-900">{invoiceNumber(invoice)}</h2>
                <StatusBadge status={invoice.status} />
              </div>
              <p className="mt-4 text-sm text-slate-700">{invoice.customerName}</p>
              <p className="text-sm text-slate-500">{sellerName(invoice.sellerId)}</p>
              <p className="mt-1 text-sm text-slate-500"><ItemsSummary invoice={invoice} /></p>
              <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3 text-sm">
                <span className="text-slate-500">{new Date(invoice.createdAtUtc).toLocaleDateString()}</span>
                <strong>{money(invoice.total)}</strong>
              </div>
              <div className="mt-3 flex items-center justify-between gap-2">
                {statusSelect(invoice)}
                <button onClick={() => setDetailKey(invoice.key)} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
                  <Eye className="h-3.5 w-3.5" />
                  Invoice
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
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
                {paged.map((invoice) => (
                  <tr key={invoice.key} className="border-b border-slate-200 last:border-b-0">
                    <td className="px-4 py-3 font-medium text-slate-800">{invoiceNumber(invoice)}</td>
                    <td className="px-4 py-3 text-slate-700">{invoice.customerName}</td>
                    <td className="px-4 py-3 text-slate-700">{sellerName(invoice.sellerId)}</td>
                    <td className="px-4 py-3 text-slate-600"><ItemsSummary invoice={invoice} /></td>
                    <td className="px-4 py-3 text-right font-medium text-slate-800">{money(invoice.total)}</td>
                    <td className="px-4 py-3"><StatusBadge status={invoice.status} /></td>
                    <td className="px-4 py-3 text-slate-600">{new Date(invoice.createdAtUtc).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {statusSelect(invoice)}
                        <button onClick={() => setDetailKey(invoice.key)} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
                          <Eye className="h-3.5 w-3.5" />
                          Invoice
                        </button>
                      </div>
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
          onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
        />
      )}

      {detailInvoice && (
        <InvoiceModal
          invoice={detailInvoice}
          sellerName={sellerName(detailInvoice.sellerId)}
          sellerEmail={sellerEmails[detailInvoice.sellerId]}
          statusControl={<>Status: {statusSelect(detailInvoice, true)}</>}
          onClose={() => setDetailKey(null)}
        />
      )}

      {pendingInvoice && pending && (
        <ConfirmStatusModal
          invoice={pendingInvoice}
          status={pending.status}
          saving={saving}
          onCancel={() => setPending(null)}
          onConfirm={confirmStatusChange}
        />
      )}
    </div>
  );
}
