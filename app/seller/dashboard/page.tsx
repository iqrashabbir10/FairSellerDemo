"use client";

import { useEffect, useState } from "react";
import { CircleDollarSign, Package, ShoppingBag, TrendingUp, Wallet } from "lucide-react";
import { getSellerDashboard, getSellerOrders } from "@/lib/api/seller";
import { ApiError } from "@/lib/api/client";
import type { SellerDashboardDto, SellerOrderDto } from "@/lib/api/types";
import { useAuthGuard } from "@/lib/api/useAuthGuard";

export default function SellerDashboardPage() {
  const ready = useAuthGuard("Seller");
  const [dashboard, setDashboard] = useState<SellerDashboardDto | null>(null);
  const [recentOrders, setRecentOrders] = useState<SellerOrderDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ready) return;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const [dashboardData, ordersData] = await Promise.all([
          getSellerDashboard(),
          getSellerOrders({ pageSize: 5 }),
        ]);
        setDashboard(dashboardData);
        setRecentOrders(ordersData.items);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Failed to load dashboard.");
      } finally {
        setLoading(false);
      }
    })();
  }, [ready]);

  if (!ready) return null;

  const stats = dashboard
    ? [
        { label: "Total Orders", value: dashboard.totalOrders.toLocaleString(), icon: Package, tone: "bg-[#eaf8f1] text-[#1b8a5a]" },
        { label: "Pending Orders", value: dashboard.pendingOrders.toLocaleString(), icon: ShoppingBag, tone: "bg-[#eaf2ff] text-[#2e6fe0]" },
        { label: "Expected Profit", value: `$${dashboard.expectedProfitTotal.toLocaleString()}`, icon: CircleDollarSign, tone: "bg-[#fff3e7] text-[#c98a1a]" },
        { label: "Wallet Balance", value: `$${dashboard.walletBalance.toLocaleString()}`, icon: Wallet, tone: "bg-[#eaf8f1] text-[#1b8a5a]" },
      ]
    : [];

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-medium text-slate-500">Seller overview</p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Dashboard</h1>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {loading ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500">Loading dashboard…</div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {stats.map(({ label, value, icon: Icon, tone }) => (
              <div key={label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-6 flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <p className="text-sm text-slate-500">{label}</p>
                    <div className="text-[2rem] font-semibold tracking-tight text-slate-900 tabular-nums">{value}</div>
                  </div>
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span>Live data</span>
                </div>
              </div>
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-4 w-1 rounded-full bg-[#f0563f]" />
                  <h2 className="text-xl font-semibold text-slate-900">Recent Orders</h2>
                </div>
              </div>

              {recentOrders.length > 0 ? (
                <div className="space-y-3">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <div>
                        <div className="font-medium text-slate-800">{order.orderNumber}</div>
                        <div className="text-sm text-slate-500">Qty {order.quantity}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-slate-800">${order.sellingPrice.toFixed(2)}</div>
                        <div className="text-xs text-slate-500">{order.status}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500">No orders yet.</div>
              )}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="h-4 w-1 rounded-full bg-[#2e6fe0]" />
                <h2 className="text-xl font-semibold text-slate-900">Wallet Summary</h2>
              </div>

              <div className="space-y-3 text-sm text-slate-600">
                <div className="flex justify-between rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <span>Completed orders</span>
                  <span className="font-semibold text-slate-800">{dashboard?.completedOrders ?? 0}</span>
                </div>
                <div className="flex justify-between rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <span>Pending withdrawals</span>
                  <span className="font-semibold text-slate-800">{dashboard?.pendingWithdrawals ?? 0}</span>
                </div>
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
