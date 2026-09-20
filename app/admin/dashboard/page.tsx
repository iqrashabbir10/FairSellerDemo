"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  CircleDollarSign,
  RefreshCcw,
  ShoppingCart,
  Store,
  Users,
  WalletCards,
} from "lucide-react";
import { getAdminDashboard, getAdminOrders, getAdminSellers, updateSellerStatus } from "@/lib/api/admin";
import { ApiError } from "@/lib/api/client";
import type { AdminDashboardDto, AdminOrderDto, AdminSellerDto, SellerStatus } from "@/lib/api/types";
import { useAuthGuard } from "@/lib/api/useAuthGuard";
import { SellerStatusConfirmModal } from "@/app/components/SellerStatusConfirmModal";
import { ColumnChart, LineChart, compact, type DayPoint } from "@/app/components/DashboardCharts";
import { ColorPanel, GradientStatCard, SalesOverviewCard, countByGroup, type GradientName } from "@/app/components/DashboardCards";

const RANGES = [7, 14, 30] as const;

const money = (value: number) => `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const statusLabel = (status: string) => status.replace(/([a-z])([A-Z])/g, "$1 $2");

const statusTone: Record<string, string> = {
  Delivered: "bg-emerald-50 text-emerald-700",
  Completed: "bg-emerald-50 text-emerald-700",
  Pending: "bg-amber-50 text-amber-700",
  PaymentRequired: "bg-amber-50 text-amber-700",
  PaymentVerification: "bg-amber-50 text-amber-700",
  Cancelled: "bg-red-50 text-red-700",
  Returned: "bg-red-50 text-red-700",
};

function relativeTime(iso: string) {
  const seconds = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const units: [number, string][] = [[60, "minute"], [3600, "hour"], [86400, "day"]];
  let value = seconds / 60;
  let unit = "minute";
  for (const [size, name] of units) {
    if (seconds >= size) {
      value = seconds / size;
      unit = name;
    }
  }
  const n = Math.floor(value);
  return seconds > 86400 * 30 ? new Date(iso).toLocaleDateString() : `${n} ${unit}${n === 1 ? "" : "s"} ago`;
}

async function fetchAllOrders() {
  const first = await getAdminOrders({ page: 1, pageSize: 100 });
  const items = [...first.items];
  for (let page = 2; page <= first.totalPages; page++) {
    items.push(...(await getAdminOrders({ page, pageSize: 100 })).items);
  }
  return items;
}

const dayKey = (date: Date) => `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

function buildSeries(orders: AdminOrderDto[], days: number, pick: (o: AdminOrderDto) => number) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const buckets = new Map<string, number>();
  for (const order of orders) {
    const key = dayKey(new Date(order.createdAtUtc));
    buckets.set(key, (buckets.get(key) ?? 0) + pick(order));
  }
  const points: DayPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    points.push({
      label: date.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      fullLabel: date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }),
      value: buckets.get(dayKey(date)) ?? 0,
    });
  }
  return points;
}

function sumWindow(orders: AdminOrderDto[], fromDaysAgo: number, toDaysAgo: number, pick: (o: AdminOrderDto) => number) {
  const now = Date.now();
  const day = 86400000;
  return orders
    .filter((o) => {
      const t = new Date(o.createdAtUtc).getTime();
      return t >= now - fromDaysAgo * day && t < now - toDaysAgo * day;
    })
    .reduce((sum, o) => sum + pick(o), 0);
}

function Delta({ current, previous }: { current: number; previous: number }) {
  if (previous === 0 && current === 0) return <span>No change</span>;
  if (previous === 0) return <span className="rounded-full bg-white/20 px-2 py-0.5 font-semibold">New activity</span>;
  const pct = ((current - previous) / previous) * 100;
  const up = pct >= 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className="inline-flex items-center gap-0.5 rounded-full bg-white/20 px-2 py-0.5 font-semibold">
      <Icon className="h-3.5 w-3.5" />
      {Math.abs(pct).toFixed(1)}%
    </span>
  );
}

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-slate-200/70 ${className}`} />;
}

function SectionError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      <span className="inline-flex items-center gap-2"><AlertCircle className="h-4 w-4 shrink-0" />{message}</span>
      <button onClick={onRetry} className="font-semibold underline-offset-2 hover:underline">Retry</button>
    </div>
  );
}

function Card({ title, accent = "bg-[var(--brand)]", action, children, className = "" }: { title: string; accent?: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <ColorPanel title={title} accent={accent} action={action} className={className}>
      {children}
    </ColorPanel>
  );
}

export default function AdminDashboardPage() {
  const ready = useAuthGuard("Admin");
  const [range, setRange] = useState<(typeof RANGES)[number]>(14);

  const [dashboard, setDashboard] = useState<AdminDashboardDto | null>(null);
  const [orders, setOrders] = useState<AdminOrderDto[]>([]);
  const [pendingSellers, setPendingSellers] = useState<AdminSellerDto[]>([]);
  const [sellerNames, setSellerNames] = useState<Record<string, string>>({});

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const [pending, setPending] = useState<{ seller: AdminSellerDto; status: SellerStatus } | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    const [dash, allOrders, pendingList, sellerList] = await Promise.allSettled([
      getAdminDashboard(),
      fetchAllOrders(),
      getAdminSellers({ status: "Pending", pageSize: 5 }),
      getAdminSellers({ pageSize: 100 }),
    ]);
    const next: Record<string, string> = {};
    const fail = (key: string, result: PromiseRejectedResult, fallback: string) => {
      next[key] = result.reason instanceof ApiError ? result.reason.message : fallback;
    };
    if (dash.status === "fulfilled") setDashboard(dash.value);
    else fail("dashboard", dash, "Failed to load summary figures.");
    if (allOrders.status === "fulfilled") setOrders(allOrders.value);
    else fail("orders", allOrders, "Failed to load orders.");
    if (pendingList.status === "fulfilled") setPendingSellers(pendingList.value.items);
    else fail("sellers", pendingList, "Failed to load seller approvals.");
    if (sellerList.status === "fulfilled") setSellerNames(Object.fromEntries(sellerList.value.items.map((s) => [s.id, s.shopName || s.fullName])));
    setErrors(next);
    setUpdatedAt(new Date());
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    if (ready) load();
  }, [ready, load]);

  const refresh = () => {
    setRefreshing(true);
    load();
  };

  const confirmStatus = async (reason: string) => {
    if (!pending) return;
    setSaving(true);
    setSaveError("");
    try {
      await updateSellerStatus(pending.seller.id, { status: pending.status, reason });
      setNotice(`${pending.seller.shopName || pending.seller.fullName} was ${pending.status.toLowerCase()}.`);
      setPending(null);
      load();
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.errors[0] ?? err.message : "Failed to update seller status.");
    } finally {
      setSaving(false);
    }
  };

  const ordersSeries = useMemo(() => buildSeries(orders, range, () => 1), [orders, range]);
  const revenueSeries = useMemo(() => buildSeries(orders, range, (o) => o.totalAmount), [orders, range]);
  const ordersInRange = ordersSeries.reduce((sum, p) => sum + p.value, 0);
  const revenueInRange = revenueSeries.reduce((sum, p) => sum + p.value, 0);

  const grossRevenue = useMemo(() => orders.reduce((sum, o) => sum + o.totalAmount, 0), [orders]);
  const previousOrders = useMemo(() => sumWindow(orders, range * 2, range, () => 1), [orders, range]);
  const previousRevenue = useMemo(() => sumWindow(orders, range * 2, range, (o) => o.totalAmount), [orders, range]);


  const statusCounts = useMemo(() => countByGroup(orders.map((o) => o.status)), [orders]);

  const recentOrders = useMemo(
    () => [...orders].sort((a, b) => b.createdAtUtc.localeCompare(a.createdAtUtc)).slice(0, 6),
    [orders],
  );

  if (!ready) return null;

  const attention: { label: string; count: number; href: string; icon: typeof Store; gradient: GradientName }[] = dashboard
    ? [
        { label: "Seller approvals", count: dashboard.pendingSellers, href: "/admin/sellers", icon: Store, gradient: "amber" },
        { label: "Payments to verify", count: dashboard.pendingPaymentVerifications, href: "/admin/orders", icon: CircleDollarSign, gradient: "orange" },
        { label: "Withdrawal requests", count: dashboard.pendingWithdrawals, href: "/admin/withdrawals", icon: WalletCards, gradient: "purple" },
      ]
    : [];

  const kpis = dashboard
    ? [
        {
          label: "Gross revenue",
          value: money(grossRevenue),
          icon: CircleDollarSign,
          gradient: "green" as GradientName,
          foot: <><Delta current={revenueInRange} previous={previousRevenue} /><span>vs previous {range} days</span></>,
        },
        {
          label: "Platform profit",
          value: money(dashboard.totalPlatformProfit),
          icon: WalletCards,
          gradient: "teal" as GradientName,
          foot: <span>All time</span>,
        },
        {
          label: "Total orders",
          value: dashboard.totalOrders.toLocaleString(),
          icon: ShoppingCart,
          gradient: "blue" as GradientName,
          foot: <><Delta current={ordersInRange} previous={previousOrders} /><span>vs previous {range} days</span></>,
        },
        {
          label: "Active sellers",
          value: dashboard.approvedSellers.toLocaleString(),
          icon: Users,
          gradient: "pink" as GradientName,
          foot: <span>{dashboard.totalSellers.toLocaleString()} registered in total</span>,
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Dashboard</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm" role="group" aria-label="Date range">
            {RANGES.map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                aria-pressed={range === r}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${range === r ? "bg-[var(--brand)] text-white shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
              >
                {r}d
              </button>
            ))}
          </div>
          <button
            onClick={refresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCcw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
          {updatedAt && <span className="hidden text-xs text-slate-400 sm:inline">Updated {updatedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>}
        </div>
      </div>

      {notice && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4" />{notice}</span>
          <button onClick={() => setNotice("")} className="text-emerald-700/70 hover:text-emerald-800" aria-label="Dismiss">×</button>
        </div>
      )}
      {errors.dashboard && <SectionError message={errors.dashboard} onRetry={load} />}

      {loading ? (
        <>
          <Skeleton className="h-16 w-full" />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-32" />)}
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <Skeleton className="h-72" />
            <Skeleton className="h-72" />
          </div>
        </>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {kpis.map(({ label, value, icon, gradient, foot }) => (
              <GradientStatCard key={label} label={label} value={value} icon={icon} gradient={gradient} foot={foot} />
            ))}
          </div>

          {attention.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-3">
              {attention.map(({ label, count, href, icon, gradient }) => (
                <GradientStatCard key={label} label={label} value={count.toLocaleString()} icon={icon} gradient={gradient} href={href} foot={<span>{count > 0 ? "Needs your attention" : "All caught up"}</span>} />
              ))}
            </div>
          )}

          {!errors.orders && (
            <SalesOverviewCard
              subtitle="Order status breakdown across all sellers"
              total={money(grossRevenue)}
              counts={statusCounts}
              pills={[`${orders.length.toLocaleString()} total orders`, `${(dashboard?.approvedSellers ?? 0).toLocaleString()} active sellers`, `${money(dashboard?.totalPlatformProfit ?? 0)} platform profit`]}
            />
          )}

          {errors.orders ? (
            <SectionError message={errors.orders} onRetry={load} />
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              <Card
                title="Orders"
                accent="bg-blue-500"
                action={<span className="text-sm text-slate-500"><span className="font-semibold text-slate-900">{ordersInRange.toLocaleString()}</span> in the last {range} days</span>}
              >
                <ColumnChart points={ordersSeries} format={(v) => (Number.isInteger(v) ? v.toLocaleString() : v.toFixed(1))} title={`Orders per day, last ${range} days`} />
              </Card>
              <Card
                title="Revenue"
                accent="bg-emerald-500"
                action={<span className="text-sm text-slate-500"><span className="font-semibold text-slate-900">{money(revenueInRange)}</span> in the last {range} days</span>}
              >
                <LineChart points={revenueSeries} format={(v) => (v >= 1000 ? `$${compact(v)}` : `$${Math.round(v * 100) / 100}`)} title={`Revenue per day, last ${range} days`} />
              </Card>
            </div>
          )}

          <div>
            <Card
              title="Recent orders"
              accent="bg-pink-500"
              action={<Link href="/admin/orders" className="inline-flex items-center gap-1 text-sm font-medium text-[var(--brand)] hover:underline">View all <ArrowRight className="h-3.5 w-3.5" /></Link>}
            >
              {recentOrders.length === 0 ? (
                <EmptyState icon={ShoppingCart} title="No orders yet" hint="New orders will show up here as they come in." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[520px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                        <th className="pb-2 font-medium">Order</th>
                        <th className="pb-2 font-medium">Customer</th>
                        <th className="pb-2 font-medium">Seller</th>
                        <th className="pb-2 text-right font-medium">Total</th>
                        <th className="pb-2 pl-4 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentOrders.map((order) => (
                        <tr key={order.id} className="border-b border-slate-100 last:border-b-0">
                          <td className="py-3 pr-3">
                            <div className="font-medium text-slate-800">{order.orderNumber}</div>
                            <div className="text-xs text-slate-400">{relativeTime(order.createdAtUtc)}</div>
                          </td>
                          <td className="py-3 pr-3 text-slate-700">{order.customerName || "—"}</td>
                          <td className="py-3 pr-3 text-slate-600">{sellerNames[order.sellerId] ?? "—"}</td>
                          <td className="py-3 text-right font-medium tabular-nums text-slate-800">{money(order.totalAmount)}</td>
                          <td className="py-3 pl-4">
                            <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${statusTone[order.status] ?? "bg-blue-50 text-blue-700"}`}>{statusLabel(order.status)}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

          </div>

          <div>
            <Card
              title="Pending seller approvals"
              accent="bg-amber-500"
              action={
                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                  {dashboard?.pendingSellers ?? pendingSellers.length} pending
                </span>
              }
            >
              {errors.sellers ? (
                <SectionError message={errors.sellers} onRetry={load} />
              ) : pendingSellers.length === 0 ? (
                <EmptyState icon={CheckCircle2} title="No pending approvals" hint="New seller applications will appear here." />
              ) : (
                <ul className="divide-y divide-slate-100">
                  {pendingSellers.map((seller) => (
                    <li key={seller.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--brand)]/10 text-sm font-semibold text-[var(--brand)]">
                          {(seller.shopName || seller.fullName).slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate font-medium text-slate-900">{seller.shopName || seller.fullName}</div>
                          <div className="truncate text-xs text-slate-500">{seller.fullName} · {seller.email}</div>
                          <div className="text-xs text-slate-400">Applied {relativeTime(seller.createdAtUtc)}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link href={`/admin/sellers/${seller.id}`} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50">Review</Link>
                        <button onClick={() => { setSaveError(""); setPending({ seller, status: "Approved" }); }} className="rounded-lg bg-[var(--brand)] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[var(--brand-hover)]">Approve</button>
                        <button onClick={() => { setSaveError(""); setPending({ seller, status: "Rejected" }); }} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50">Reject</button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

          </div>
        </>
      )}

      {pending && (
        <SellerStatusConfirmModal
          seller={pending.seller}
          status={pending.status}
          saving={saving}
          error={saveError}
          onCancel={() => setPending(null)}
          onConfirm={confirmStatus}
        />
      )}
    </div>
  );
}

function EmptyState({ icon: Icon, title, hint }: { icon: React.ComponentType<{ className?: string }>; title: string; hint?: string }) {
  return (
    <div className="flex min-h-[160px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 text-center">
      <span className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm ring-1 ring-slate-200">
        <Icon className="h-5 w-5" />
      </span>
      <div className="text-sm font-medium text-slate-700">{title}</div>
      {hint && <p className="mt-0.5 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}
