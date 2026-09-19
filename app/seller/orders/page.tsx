"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Check, CheckCircle2, Copy, Eye, PackageCheck, Search, Truck, Wallet, X, ClipboardList, BadgeDollarSign } from "lucide-react";
import { useResponsiveView, ViewToggle } from "@/app/components/ViewToggle";
import { ProductThumbnail } from "@/app/components/ProductThumbnail";
import { getSellerOrders, getSellerWallet, pickSellerOrder } from "@/lib/api/seller";
import { ApiError } from "@/lib/api/client";
import type { OrderStatus, SellerOrderDto } from "@/lib/api/types";
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

function StatusBadge({ status }: { status: OrderStatus }) {
  const style = statusStyles[status] ?? { dot: "bg-slate-500", badge: "bg-slate-100 text-slate-700" };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${style.badge}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {status}
    </span>
  );
}

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const dateTimeFormat = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });

const PICKABLE: OrderStatus[] = ["Pending", "ReadyToPick"];

// "Pick order" is only offered while an order is waiting to be picked, and only enabled when the wallet covers it.
function PickAction({
  order,
  balance,
  onPick,
  className = "",
}: {
  order: SellerOrderDto;
  balance: number | null;
  onPick: (order: SellerOrderDto) => void;
  className?: string;
}) {
  if (!PICKABLE.includes(order.status)) return null;
  const short = balance !== null && balance < order.pickCost;
  return (
    <div className={className}>
      <button
        onClick={() => onPick(order)}
        disabled={short}
        className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-[var(--brand)] px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[var(--brand-hover)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <PackageCheck className="h-3.5 w-3.5" />
        Pick order · {currency.format(order.pickCost)}
      </button>
      {short && (
        <p className="mt-1.5 text-xs text-amber-700" role="status">
          Insufficient balance — this order needs {currency.format(order.pickCost)} and your wallet has {currency.format(balance)}. Add{" "}
          {currency.format(order.pickCost - balance)} to continue.
        </p>
      )}
    </div>
  );
}

const totalQuantity = (order: SellerOrderDto) => order.items.reduce((sum, item) => sum + item.quantity, 0);

// "Wireless Headphones" or "Wireless Headphones + 2 more"
const itemsLabel = (order: SellerOrderDto) =>
  order.items.length === 0 ? "—" : order.items.length === 1 ? order.items[0].productName : `${order.items[0].productName} + ${order.items.length - 1} more`;

// Where an order is in its journey. Anything outside this list (cancelled, returned…) just shows its badge.
const JOURNEY: { status: OrderStatus; label: string; icon: typeof Check }[] = [
  { status: "Pending", label: "Placed", icon: ClipboardList },
  { status: "Picked", label: "Picked", icon: PackageCheck },
  { status: "OnTheWay", label: "On the way", icon: Truck },
  { status: "Delivered", label: "Delivered", icon: CheckCircle2 },
];

function journeyIndex(status: OrderStatus) {
  if (status === "Completed") return JOURNEY.length - 1;
  const index = JOURNEY.findIndex((step) => step.status === status);
  return index === -1 ? (["ReadyToPick", "PaymentRequired", "PaymentVerification", "Processing"].includes(status) ? 0 : -1) : index;
}

function OrderJourney({ status }: { status: OrderStatus }) {
  const current = journeyIndex(status);
  if (current === -1) return null;
  return (
    <ol className="flex items-start" aria-label="Order progress">
      {JOURNEY.map((step, index) => {
        const done = index < current || (index === current && current === JOURNEY.length - 1);
        const active = index === current && !done;
        const Icon = step.icon;
        return (
          <li key={step.status} className="relative flex flex-1 flex-col items-center text-center">
            {index > 0 && <span className={`absolute right-1/2 top-4 h-0.5 w-full ${index <= current ? "bg-emerald-400" : "bg-slate-200"}`} aria-hidden />}
            <span
              className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 bg-white ${
                done ? "border-emerald-500 bg-emerald-500 text-white" : active ? "border-[var(--brand)] text-[var(--brand)] ring-4 ring-[var(--brand)]/15" : "border-slate-200 text-slate-300"
              }`}
            >
              {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
            </span>
            <span className={`mt-2 text-xs font-medium ${done || active ? "text-slate-800" : "text-slate-400"}`}>{step.label}</span>
          </li>
        );
      })}
    </ol>
  );
}

function Stat({ label, value, tone = "default", icon }: { label: string; value: string; tone?: "default" | "brand" | "good"; icon?: React.ReactNode }) {
  const styles = tone === "brand" ? "bg-[var(--brand)]/10 text-[var(--brand)]" : tone === "good" ? "bg-emerald-50 text-emerald-700" : "bg-slate-50 text-slate-800";
  return (
    <div className={`rounded-2xl px-4 py-3 ${styles}`}>
      <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide opacity-70">{icon}{label}</div>
      <div className="mt-1 text-lg font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function OrderDetailsDialog({
  order,
  balance,
  onClose,
  onPick,
}: {
  order: SellerOrderDto;
  balance: number | null;
  onClose: () => void;
  onPick: (order: SellerOrderDto) => void;
}) {
  const [copied, setCopied] = useState(false);

  // Escape closes; the page behind stays put while the dialog is open.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  const copyOrderNumber = async () => {
    try {
      await navigator.clipboard.writeText(order.orderNumber);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // clipboard blocked — the number is still visible to copy by hand
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 backdrop-blur-[2px] sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Order ${order.orderNumber}`}
        className="flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-t-3xl border border-slate-200 bg-white shadow-2xl sm:rounded-3xl"
        onClick={(event) => event.stopPropagation()}
      >
        {/* header */}
        <div className="relative bg-gradient-to-br from-[var(--brand)] to-[var(--brand-hover)] px-6 pb-6 pt-5 text-white">
          <button onClick={onClose} className="absolute right-4 top-4 rounded-full bg-white/15 p-1.5 hover:bg-white/25" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/75">Order</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <h2 className="break-all text-xl font-semibold tracking-tight">{order.orderNumber}</h2>
            <button onClick={copyOrderNumber} className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-medium hover:bg-white/25" aria-label="Copy order number">
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-white/85">
            <span className="rounded-full bg-white px-2.5 py-0.5"><StatusBadge status={order.status} /></span>
            <span>Placed {dateTimeFormat.format(new Date(order.createdAtUtc))}</span>
          </div>
        </div>

        {/* body */}
        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
          <section aria-label="Items in this order">
            <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400">
              <span>Items</span>
              <span>{order.items.length} product{order.items.length === 1 ? "" : "s"} · {totalQuantity(order)} unit{totalQuantity(order) === 1 ? "" : "s"}</span>
            </div>
            <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-200">
              {order.items.map((item) => (
                <li key={item.productId} className="flex items-center gap-3 p-3">
                  <ProductThumbnail name={item.productName} imageUrls={item.imageUrl ? [item.imageUrl] : []} className="h-14 w-14 shrink-0" bare />
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-semibold text-slate-900">{item.productName}</p>
                    {item.sku && <p className="font-mono text-xs text-slate-500">{item.sku}</p>}
                    <p className="text-xs text-slate-500">{item.quantity} × {currency.format(item.unitPrice)}</p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold tabular-nums text-slate-900">{currency.format(item.lineTotal)}</span>
                </li>
              ))}
            </ul>
          </section>

          <OrderJourney status={order.status} />

          <div className="grid grid-cols-2 gap-3">
            <Stat label="Order total" value={currency.format(order.totalAmount)} icon={<BadgeDollarSign className="h-3.5 w-3.5" />} />
            <Stat label="Expected profit" value={currency.format(order.expectedProfit)} tone="good" />
            <Stat label="Cost to pick" value={currency.format(order.pickCost)} tone="brand" icon={<Wallet className="h-3.5 w-3.5" />} />
            <Stat label="Items" value={String(order.items.length)} />
          </div>

          <dl className="divide-y divide-slate-100 rounded-2xl border border-slate-200 text-sm">
            <div className="flex justify-between gap-4 px-4 py-2.5"><dt className="text-slate-500">Order number</dt><dd className="break-all text-right font-mono text-sm font-medium text-slate-800">{order.orderNumber}</dd></div>
          </dl>
        </div>

        {/* footer */}
        <div className="border-t border-slate-100 bg-slate-50/70 px-6 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 flex-1">
              <PickAction order={order} balance={balance} onPick={onPick} />
            </div>
            <button onClick={onClose} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SellerOrdersPage() {
  const ready = useAuthGuard("Seller");
  const [view, setView] = useResponsiveView();
  const [orders, setOrders] = useState<SellerOrderDto[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<SellerOrderDto | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [pickTarget, setPickTarget] = useState<SellerOrderDto | null>(null);
  const [picking, setPicking] = useState(false);
  const [pickError, setPickError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!ready) return;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const result = await getSellerOrders({ page: 1, pageSize: 100 });
        setOrders(result.items);
        getSellerWallet().then((wallet) => setBalance(wallet.balance)).catch(() => {});

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
    return orders.filter(
      (order) =>
        order.orderNumber.toLowerCase().includes(query) ||
        order.items.some((item) => item.productName.toLowerCase().includes(query) || (item.sku ?? "").toLowerCase().includes(query)),
    );
  }, [orders, search]);

  const confirmPick = async () => {
    if (!pickTarget) return;
    setPicking(true);
    setPickError("");
    try {
      const result = await pickSellerOrder(pickTarget.id);
      setOrders((current) => current.map((order) => (order.id === result.order.id ? result.order : order)));
      setSelectedOrder((current) => (current && current.id === result.order.id ? result.order : current));
      setBalance(result.balance);
      setNotice(`${result.order.orderNumber} picked. ${currency.format(result.order.pickCost)} was deducted from your wallet.`);
      setPickTarget(null);
    } catch (err) {
      setPickError(err instanceof ApiError ? err.errors[0] ?? err.message : "Couldn't pick this order. Please try again.");
      // The balance or the order may have changed elsewhere — resync.
      getSellerWallet().then((wallet) => setBalance(wallet.balance)).catch(() => {});
    } finally {
      setPicking(false);
    }
  };

  if (!ready) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">Fulfillment</p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Orders</h1>
        </div>
        {balance !== null && (
          <Link href="/seller/wallet" className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm transition hover:border-slate-300">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--brand)]/10 text-[var(--brand)]">
              <Wallet className="h-4 w-4" />
            </span>
            <span>
              <span className="block text-xs text-slate-500">Wallet balance</span>
              <span className="block text-base font-semibold text-slate-900">{currency.format(balance)}</span>
            </span>
          </Link>
        )}
      </div>

      {notice && (
        <div className="flex items-start justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700" role="status">
          <span className="inline-flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />{notice}</span>
          <button onClick={() => setNotice("")} className="text-emerald-700/70 hover:text-emerald-800" aria-label="Dismiss">×</button>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-700 outline-none focus:border-[var(--brand)] focus:bg-white"
              placeholder="Search by order number, product or code"
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
            return (
              <article key={order.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="truncate text-sm font-semibold text-slate-900">{order.orderNumber}</h2>
                  <StatusBadge status={order.status} />
                </div>
                <ul className="mt-3 space-y-2">
                  {order.items.slice(0, 3).map((item) => (
                    <li key={item.productId} className="flex items-center gap-3">
                      <ProductThumbnail name={item.productName} imageUrls={item.imageUrl ? [item.imageUrl] : []} className="h-12 w-12 shrink-0" bare />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-800">{item.productName}</p>
                        {item.sku && <p className="font-mono text-xs text-slate-400">{item.sku}</p>}
                        <p className="text-xs text-slate-500">Qty: {item.quantity}</p>
                      </div>
                    </li>
                  ))}
                  {order.items.length > 3 && <li className="pl-1 text-xs font-medium text-slate-500">+ {order.items.length - 3} more product{order.items.length - 3 === 1 ? "" : "s"}</li>}
                </ul>
                <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-slate-500">Order Total</p>
                    <p className="font-medium text-slate-800">{currency.format(order.totalAmount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Expected Profit</p>
                    <p className="font-medium text-slate-800">{currency.format(order.expectedProfit)}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-xs text-slate-500">Cost to pick</span>
                  <span className="font-medium text-slate-800">{currency.format(order.pickCost)}</span>
                </div>
                <div className="mt-3 text-xs text-slate-500">{dateTimeFormat.format(new Date(order.createdAtUtc))}</div>
                <PickAction order={order} balance={balance} onPick={(o) => { setPickError(""); setPickTarget(o); }} className="mt-4" />
                <button
                  onClick={() => setSelectedOrder(order)}
                  className="mt-2 inline-flex w-full items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
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
            <table className="w-full min-w-[1100px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                  <th className="px-4 py-3 font-medium">Order Number</th>
                  <th className="px-4 py-3 font-medium">Products</th>
                  <th className="px-4 py-3 font-medium text-right">Qty</th>
                  <th className="px-4 py-3 font-medium text-right">Order Total</th>
                  <th className="px-4 py-3 font-medium text-right">Expected Profit</th>
                  <th className="px-4 py-3 font-medium text-right">Cost to pick</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => {
                  return (
                    <tr key={order.id} className="border-b border-slate-200 last:border-b-0">
                      <td className="px-4 py-3 font-medium text-slate-800">{order.orderNumber}</td>
                      <td className="px-4 py-3 text-slate-700">
                        <div className="flex items-center gap-2">
                          <ProductThumbnail name={order.items[0]?.productName ?? "Product"} imageUrls={order.items[0]?.imageUrl ? [order.items[0].imageUrl] : []} className="h-8 w-8" bare />
                          <span className="min-w-0">
                            <span className="block truncate">{itemsLabel(order)}</span>
                            {order.items[0]?.sku && <span className="block font-mono text-xs text-slate-400">{order.items[0].sku}{order.items.length > 1 ? " …" : ""}</span>}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600">{totalQuantity(order)}</td>
                      <td className="px-4 py-3 text-right font-medium text-slate-800">{currency.format(order.totalAmount)}</td>
                      <td className="px-4 py-3 text-right font-medium text-slate-800">{currency.format(order.expectedProfit)}</td>
                      <td className="px-4 py-3 text-right font-medium text-slate-800">{currency.format(order.pickCost)}</td>
                      <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
                      <td className="px-4 py-3 text-slate-600">{dateTimeFormat.format(new Date(order.createdAtUtc))}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex flex-col items-end gap-1.5">
                        <PickAction order={order} balance={balance} onPick={(o) => { setPickError(""); setPickTarget(o); }} className="w-full max-w-[260px] text-left" />
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </button>
                        </div>
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
        <OrderDetailsDialog
          order={selectedOrder}
          balance={balance}
          onClose={() => setSelectedOrder(null)}
          onPick={(o) => {
            setPickError("");
            setPickTarget(o);
          }}
        />
      )}

      {pickTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4" onClick={picking ? undefined : () => setPickTarget(null)}>
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-xl" onClick={(event) => event.stopPropagation()}>
            <h2 className="text-lg font-semibold text-slate-900">Pick this order?</h2>
            <p className="mt-2 text-sm text-slate-600">
              <span className="font-medium text-slate-900">{currency.format(pickTarget.pickCost)}</span> will be deducted from your wallet and{" "}
              <span className="font-medium text-slate-900">{pickTarget.orderNumber}</span> will move to <span className="font-medium text-slate-900">Picked</span>.
            </p>
            {balance !== null && (
              <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm">
                <span className="text-slate-500">Wallet balance</span>
                <span className="font-semibold text-slate-900">
                  {currency.format(balance)} <span className="text-slate-400">→</span> {currency.format(balance - pickTarget.pickCost)}
                </span>
              </div>
            )}
            {pickError && <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{pickError}</div>}
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setPickTarget(null)} disabled={picking} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                Cancel
              </button>
              <button onClick={confirmPick} disabled={picking} className="rounded-xl bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--brand-hover)] disabled:opacity-60">
                {picking ? "Picking…" : "Confirm & pay"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
