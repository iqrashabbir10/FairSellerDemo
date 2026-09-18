"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye, Search, X } from "lucide-react";
import { useResponsiveView, ViewToggle } from "@/app/components/ViewToggle";
import { ProductThumbnail } from "@/app/components/ProductThumbnail";
import { getSellerOrders } from "@/lib/api/seller";
import { getSellerProductById } from "@/lib/api/sellerProducts";
import { ApiError } from "@/lib/api/client";
import type { OrderStatus, PaymentStatus, ProductDto, SellerOrderDto } from "@/lib/api/types";
import { useAuthGuard } from "@/lib/api/useAuthGuard";

const statusStyles: Record<OrderStatus, { dot: string; badge: string }> = {
  Pending: { dot: "bg-amber-500", badge: "bg-amber-50 text-amber-700" },
  PaymentRequired: { dot: "bg-amber-500", badge: "bg-amber-50 text-amber-700" },
  PaymentVerification: { dot: "bg-blue-500", badge: "bg-blue-50 text-blue-700" },
  ReadyToPick: { dot: "bg-blue-500", badge: "bg-blue-50 text-blue-700" },
  Picked: { dot: "bg-blue-500", badge: "bg-blue-50 text-blue-700" },
  OnTheWay: { dot: "bg-indigo-500", badge: "bg-indigo-50 text-indigo-700" },
  Delivered: { dot: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700" },
  Completed: { dot: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700" },
  Processing: { dot: "bg-blue-500", badge: "bg-blue-50 text-blue-700" },
  Cancelled: { dot: "bg-red-500", badge: "bg-red-50 text-red-700" },
  Returned: { dot: "bg-red-500", badge: "bg-red-50 text-red-700" },
};

const paymentStatusStyles: Record<PaymentStatus, string> = {
  PendingVerification: "bg-amber-50 text-amber-700",
  Verified: "bg-emerald-50 text-emerald-700",
  Rejected: "bg-red-50 text-red-700",
};

function StatusBadge({ status }: { status: OrderStatus }) {
  const style = statusStyles[status] ?? { dot: "bg-slate-500", badge: "bg-slate-100 text-slate-700" };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${style.badge}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {status}
    </span>
  );
}

function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${paymentStatusStyles[status] ?? "bg-slate-100 text-slate-700"}`}>
      {status}
    </span>
  );
}

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const dateTimeFormat = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });

export default function SellerOrdersPage() {
  const ready = useAuthGuard("Seller");
  const [view, setView] = useResponsiveView();
  const [orders, setOrders] = useState<SellerOrderDto[]>([]);
  const [products, setProducts] = useState<Record<string, ProductDto>>({});
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<SellerOrderDto | null>(null);

  useEffect(() => {
    if (!ready) return;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const result = await getSellerOrders({ page: 1, pageSize: 100 });
        setOrders(result.items);

        const uniqueProductIds = Array.from(new Set(result.items.map((order) => order.productId)));
        const entries = await Promise.all(
          uniqueProductIds.map(async (productId) => {
            try {
              const product = await getSellerProductById(productId);
              return [productId, product] as const;
            } catch {
              return null;
            }
          })
        );
        setProducts(Object.fromEntries(entries.filter((entry): entry is readonly [string, ProductDto] => entry !== null)));
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Failed to load orders.");
      } finally {
        setLoading(false);
      }
    })();
  }, [ready]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return orders;
    return orders.filter((order) => {
      const productName = products[order.productId]?.name ?? "";
      return order.orderNumber.toLowerCase().includes(query) || productName.toLowerCase().includes(query);
    });
  }, [orders, products, search]);

  if (!ready) return null;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-slate-500">Fulfillment</p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Orders</h1>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-700 outline-none focus:border-[#f0563f] focus:bg-white"
              placeholder="Search by order number or product"
            />
          </div>
          <ViewToggle value={view} onChange={setView} />
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">Loading orders…</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">No orders found.</div>
      ) : view === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((order) => {
            const product = products[order.productId];
            return (
              <article key={order.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="truncate text-sm font-semibold text-slate-900">{order.orderNumber}</h2>
                  <StatusBadge status={order.status} />
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <ProductThumbnail name={product?.name ?? "Product"} imageUrls={product?.imageUrls} className="h-14 w-14 shrink-0" bare />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">{product?.name ?? order.productId}</p>
                    <p className="text-xs text-slate-500">Qty: {order.quantity}</p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-slate-500">Selling Price</p>
                    <p className="font-medium text-slate-800">{currency.format(order.sellingPrice)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Expected Profit</p>
                    <p className="font-medium text-slate-800">{currency.format(order.expectedProfit)}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <PaymentStatusBadge status={order.paymentStatus} />
                  <span className="text-xs text-slate-500">{dateTimeFormat.format(new Date(order.createdAtUtc))}</span>
                </div>
                <button
                  onClick={() => setSelectedOrder(order)}
                  className="mt-4 inline-flex w-full items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  <Eye className="h-3.5 w-3.5" />
                  View details
                </button>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                  <th className="px-4 py-3 font-medium">Order Number</th>
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium text-right">Qty</th>
                  <th className="px-4 py-3 font-medium text-right">Selling Price</th>
                  <th className="px-4 py-3 font-medium text-right">Expected Profit</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Payment</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => {
                  const product = products[order.productId];
                  return (
                    <tr key={order.id} className="border-b border-slate-200 last:border-b-0">
                      <td className="px-4 py-3 font-medium text-slate-800">{order.orderNumber}</td>
                      <td className="px-4 py-3 text-slate-700">
                        <div className="flex items-center gap-2">
                          <ProductThumbnail name={product?.name ?? "Product"} imageUrls={product?.imageUrls} className="h-8 w-8" bare />
                          <span className="truncate">{product?.name ?? order.productId}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600">{order.quantity}</td>
                      <td className="px-4 py-3 text-right font-medium text-slate-800">{currency.format(order.sellingPrice)}</td>
                      <td className="px-4 py-3 text-right font-medium text-slate-800">{currency.format(order.expectedProfit)}</td>
                      <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
                      <td className="px-4 py-3"><PaymentStatusBadge status={order.paymentStatus} /></td>
                      <td className="px-4 py-3 text-slate-600">{dateTimeFormat.format(new Date(order.createdAtUtc))}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View
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

      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setSelectedOrder(null)}>
          <div
            className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Order details</p>
                <h2 className="text-lg font-semibold text-slate-900">{selectedOrder.orderNumber}</h2>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <ProductThumbnail
                name={products[selectedOrder.productId]?.name ?? "Product"}
                imageUrls={products[selectedOrder.productId]?.imageUrls}
                className="h-16 w-16 shrink-0"
                bare
              />
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-800">{products[selectedOrder.productId]?.name ?? selectedOrder.productId}</p>
                <p className="text-xs text-slate-500">Product ID: {selectedOrder.productId}</p>
              </div>
            </div>

            <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-xs text-slate-500">Order ID</dt>
                <dd className="mt-0.5 break-all font-medium text-slate-800">{selectedOrder.id}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Quantity</dt>
                <dd className="mt-0.5 font-medium text-slate-800">{selectedOrder.quantity}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Selling Price</dt>
                <dd className="mt-0.5 font-medium text-slate-800">{currency.format(selectedOrder.sellingPrice)}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Expected Profit</dt>
                <dd className="mt-0.5 font-medium text-slate-800">{currency.format(selectedOrder.expectedProfit)}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Order Status</dt>
                <dd className="mt-1"><StatusBadge status={selectedOrder.status} /></dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Payment Status</dt>
                <dd className="mt-1"><PaymentStatusBadge status={selectedOrder.paymentStatus} /></dd>
              </div>
              <div className="col-span-2">
                <dt className="text-xs text-slate-500">Created At</dt>
                <dd className="mt-0.5 font-medium text-slate-800">{dateTimeFormat.format(new Date(selectedOrder.createdAtUtc))}</dd>
              </div>
            </dl>
          </div>
        </div>
      )}
    </div>
  );
}
