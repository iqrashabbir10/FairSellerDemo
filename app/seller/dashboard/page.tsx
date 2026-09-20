"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, BadgeCheck, CircleDollarSign, Package, ShoppingCart, Wallet } from "lucide-react";
import { getSellerDashboard, getSellerListings, getSellerOrders, getSellerProducts, getSellerProfile } from "@/lib/api/seller";
import { ApiError } from "@/lib/api/client";
import type { PagedResult, ProductDto, SellerDashboardDto, SellerOrderDto, SellerProductDto, SellerProfileDto } from "@/lib/api/types";
import { useAuthGuard } from "@/lib/api/useAuthGuard";
import { ProductThumbnail } from "@/app/components/ProductThumbnail";
import { ColorPanel, CreditScoreCard, GradientStatCard, RatingCard, SalesOverviewCard, countByGroup, groupStatus } from "@/app/components/DashboardCards";

// A listing counts as "running low" when fewer than this many units are left.
const LOW_QUANTITY = 5;
const PAGE = 100;
const MAX_PAGES = 20;

const money = (value: number) => `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Walks every page of a paged endpoint (capped so a huge account can't hang the dashboard).
async function fetchAll<T>(load: (page: number) => Promise<PagedResult<T>>) {
  const first = await load(1);
  const items = [...first.items];
  for (let page = 2; page <= Math.min(first.totalPages, MAX_PAGES); page++) {
    items.push(...(await load(page)).items);
  }
  return items;
}

const CATEGORY_COLORS = ["bg-sky-500", "bg-emerald-500", "bg-amber-500", "bg-pink-500", "bg-purple-500", "bg-teal-500", "bg-orange-500", "bg-indigo-500"];

export default function SellerDashboardPage() {
  const ready = useAuthGuard("Seller");
  const [profile, setProfile] = useState<SellerProfileDto | null>(null);
  const [dashboard, setDashboard] = useState<SellerDashboardDto | null>(null);
  const [orders, setOrders] = useState<SellerOrderDto[]>([]);
  const [listings, setListings] = useState<SellerProductDto[]>([]);
  const [catalog, setCatalog] = useState<ProductDto[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [prof, dash, allOrders, allListings, allCatalog] = await Promise.allSettled([
      getSellerProfile(),
      getSellerDashboard(),
      fetchAll((page) => getSellerOrders({ page, pageSize: PAGE })),
      fetchAll((page) => getSellerListings({ page, pageSize: PAGE })),
      fetchAll((page) => getSellerProducts({ page, pageSize: PAGE })),
    ]);
    const next: Record<string, string> = {};
    const fail = (key: string, result: PromiseRejectedResult, fallback: string) => {
      next[key] = result.reason instanceof ApiError ? result.reason.message : fallback;
    };
    if (prof.status === "fulfilled") setProfile(prof.value);
    if (dash.status === "fulfilled") setDashboard(dash.value);
    else fail("dashboard", dash, "Couldn't load your summary figures.");
    if (allOrders.status === "fulfilled") setOrders(allOrders.value);
    else fail("orders", allOrders, "Couldn't load your orders.");
    if (allListings.status === "fulfilled") setListings(allListings.value);
    else fail("listings", allListings, "Couldn't load your listings.");
    // Only used to name each listing's category; the category panel just stays empty without it.
    if (allCatalog.status === "fulfilled") setCatalog(allCatalog.value);
    setErrors(next);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (ready) load();
  }, [ready, load]);

  const stats = useMemo(() => {
    const counted = orders.filter((o) => groupStatus(o.status) !== "Cancelled");
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const monthStart = new Date(startOfDay.getFullYear(), startOfDay.getMonth(), 1);
    const lastMonthStart = new Date(startOfDay.getFullYear(), startOfDay.getMonth() - 1, 1);
    const at = (o: SellerOrderDto) => new Date(o.createdAtUtc).getTime();
    const sum = (list: SellerOrderDto[]) => list.reduce((total, o) => total + o.totalAmount, 0);

    return {
      totalSales: sum(counted),
      today: sum(counted.filter((o) => at(o) >= startOfDay.getTime())),
      thisMonth: sum(counted.filter((o) => at(o) >= monthStart.getTime())),
      lastMonth: sum(counted.filter((o) => at(o) >= lastMonthStart.getTime() && at(o) < monthStart.getTime())),
      all: countByGroup(orders.map((o) => o.status)),
      month: countByGroup(orders.filter((o) => at(o) >= monthStart.getTime()).map((o) => o.status)),
    };
  }, [orders]);

  const categories = useMemo(() => {
    const nameByProduct = new Map(catalog.map((p) => [p.id, p.categoryName]));
    const counts = new Map<string, number>();
    for (const listing of listings) {
      const name = nameByProduct.get(listing.productId) || "Uncategorised";
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [catalog, listings]);

  const lowStock = useMemo(
    () => listings.filter((l) => l.quantity < LOW_QUANTITY).sort((a, b) => a.quantity - b.quantity).slice(0, 6),
    [listings],
  );
  const recentOrders = useMemo(() => [...orders].sort((a, b) => b.createdAtUtc.localeCompare(a.createdAtUtc)).slice(0, 5), [orders]);

  if (!ready) return null;

  const shop = profile?.shopName || profile?.fullName;
  const monthOrders = Object.values(stats.month).reduce((a, b) => a + b, 0);
  const maxCategory = categories[0]?.[1] ?? 1;
  const errorList = Object.values(errors);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">Seller overview</p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Dashboard</h1>
        </div>
        {shop && (
          <div className="inline-flex items-center gap-3 rounded-2xl bg-amber-400 py-1.5 pl-1.5 pr-4 text-slate-900 shadow-sm">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">{shop.slice(0, 1).toUpperCase()}</span>
            <span className="text-sm font-semibold">{shop}</span>
            {profile?.status === "Approved" && <BadgeCheck className="h-4 w-4 text-slate-900/70" aria-label="Verified seller" />}
          </div>
        )}
      </div>

      {errorList.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {errorList.join(" ")}{" "}
          <button onClick={load} className="font-semibold underline-offset-2 hover:underline">Retry</button>
        </div>
      )}

      {loading ? (
        <div className="space-y-4" aria-hidden>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="h-44 animate-pulse rounded-2xl bg-slate-200/70" />
            <div className="h-44 animate-pulse rounded-2xl bg-slate-200/70" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => <div key={i} className="h-32 animate-pulse rounded-2xl bg-slate-200/70" />)}
          </div>
          <div className="h-56 animate-pulse rounded-2xl bg-slate-200/70" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <CreditScoreCard score={profile?.creditScore} />
            <RatingCard rating={profile?.rating} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <GradientStatCard label="Total products" value={listings.length.toLocaleString()} icon={Package} gradient="green" href="/seller/my-listings" foot={<span>{lowStock.length} running low</span>} />
            <GradientStatCard label="Total orders" value={(dashboard?.totalOrders ?? orders.length).toLocaleString()} icon={ShoppingCart} gradient="blue" href="/seller/orders" foot={<span>{dashboard?.pendingOrders ?? stats.all.New} pending</span>} />
            <GradientStatCard label="Wallet balance" value={money(dashboard?.walletBalance ?? 0)} icon={Wallet} gradient="amber" href="/seller/wallet" foot={<span>{dashboard?.pendingWithdrawals ?? 0} pending withdrawals</span>} />
            <GradientStatCard label="Total sales" value={money(stats.totalSales)} icon={CircleDollarSign} gradient="pink" foot={<span>Expected profit {money(dashboard?.expectedProfitTotal ?? 0)}</span>} />
          </div>

          <SalesOverviewCard
            subtitle="Order status breakdown"
            total={money(stats.totalSales)}
            counts={stats.all}
            pills={[`${orders.length} total orders`, `${listings.length} products`, `${stats.all.Picked} picked`]}
          />

          <div className="grid gap-6 lg:grid-cols-3">
            <ColorPanel title="Category-wise products" accent="bg-sky-500">
              {categories.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">No listings yet.</p>
              ) : (
                <ul className="space-y-3">
                  {categories.slice(0, 8).map(([name, count], index) => (
                    <li key={name}>
                      <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                        <span className="truncate text-slate-700">{name}</span>
                        <span className="font-semibold tabular-nums text-slate-900">{count}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div className={`h-full rounded-full ${CATEGORY_COLORS[index % CATEGORY_COLORS.length]}`} style={{ width: `${Math.max((count / maxCategory) * 100, 4)}%` }} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </ColorPanel>

            <ColorPanel title="Orders this month" accent="bg-emerald-500" action={<span className="text-sm text-slate-500"><span className="font-semibold text-slate-900">{monthOrders}</span> total</span>}>
              <ul className="space-y-2.5 text-sm">
                {[
                  { label: "New orders", value: stats.month.New, dot: "bg-sky-500" },
                  { label: "Cancelled", value: stats.month.Cancelled, dot: "bg-red-500" },
                  { label: "On the way", value: stats.month.OnWay, dot: "bg-amber-500" },
                  { label: "Picked", value: stats.month.Picked, dot: "bg-purple-500" },
                  { label: "Completed", value: stats.month.Completed, dot: "bg-emerald-500" },
                ].map((row) => (
                  <li key={row.label} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5">
                    <span className="inline-flex items-center gap-2 text-slate-700"><span className={`h-2.5 w-2.5 rounded-full ${row.dot}`} />{row.label}</span>
                    <span className="text-lg font-bold tabular-nums text-slate-900">{row.value}</span>
                  </li>
                ))}
              </ul>
            </ColorPanel>

            <ColorPanel title="Sold amount" accent="bg-pink-500">
              <div className="space-y-4">
                {[
                  { label: "Today", value: stats.today, tone: "text-sky-600" },
                  { label: "This month", value: stats.thisMonth, tone: "text-emerald-600" },
                  { label: "Last month", value: stats.lastMonth, tone: "text-pink-600" },
                ].map((row) => (
                  <div key={row.label} className="rounded-xl bg-slate-50 px-4 py-3">
                    <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{row.label}</div>
                    <div className={`mt-0.5 text-2xl font-bold tabular-nums ${row.tone}`}>{money(row.value)}</div>
                  </div>
                ))}
              </div>
            </ColorPanel>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
            <ColorPanel
              title="Recent orders"
              accent="bg-blue-500"
              action={<Link href="/seller/orders" className="inline-flex items-center gap-1 text-sm font-medium text-[var(--brand)] hover:underline">View all <ArrowRight className="h-3.5 w-3.5" /></Link>}
            >
              {recentOrders.length > 0 ? (
                <div className="space-y-3">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <div>
                        <div className="font-medium text-slate-800">{order.orderNumber}</div>
                        <div className="text-sm text-slate-500">{order.items.length} item{order.items.length === 1 ? "" : "s"} · Qty {order.items.reduce((sum, item) => sum + item.quantity, 0)}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-slate-800">{money(order.totalAmount)}</div>
                        <div className="text-xs text-slate-500">{order.status.replace(/([a-z])([A-Z])/g, "$1 $2")}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500">No orders yet.</div>
              )}
            </ColorPanel>

            <ColorPanel
              title="Running low"
              accent="bg-amber-500"
              action={<Link href="/seller/my-listings" className="inline-flex items-center gap-1 text-sm font-medium text-[var(--brand)] hover:underline">My listings <ArrowRight className="h-3.5 w-3.5" /></Link>}
            >
              {lowStock.length > 0 ? (
                <div className="space-y-3">
                  {lowStock.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <ProductThumbnail name={item.productName} imageUrls={item.imageUrls} className="h-12 w-12 shrink-0" bare />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-slate-800">{item.productName}</div>
                        {item.sku && <div className="font-mono text-xs text-slate-400">{item.sku}</div>}
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${item.quantity === 0 ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>
                        {item.quantity === 0 ? "Out" : `${item.quantity} left`}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
                  Nothing is running low — every listing has {LOW_QUANTITY} or more units.
                </div>
              )}
            </ColorPanel>
          </div>
        </>
      )}
    </div>
  );
}
