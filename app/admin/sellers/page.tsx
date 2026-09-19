"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Search, ShieldCheck } from "lucide-react";
import { useResponsiveView, ViewToggle } from "@/app/components/ViewToggle";
import { Pagination } from "@/app/components/Pagination";
import { SELLER_STATUSES, SellerStatusConfirmModal } from "@/app/components/SellerStatusConfirmModal";
import { getAdminOrders, getAdminSellers, updateSellerStatus } from "@/lib/api/admin";
import { ApiError } from "@/lib/api/client";
import type { AdminOrderDto, AdminSellerDto, PagedResult, SellerStatus } from "@/lib/api/types";
import { useAuthGuard } from "@/lib/api/useAuthGuard";

const STATUS_TABS: (SellerStatus | "All")[] = ["All", "Pending", "Approved", "Rejected", "Frozen"];

const statusStyles: Record<string, string> = {
  Approved: "bg-emerald-50 text-emerald-700",
  Pending: "bg-amber-50 text-amber-700",
  Rejected: "bg-red-50 text-red-700",
  Frozen: "bg-slate-100 text-slate-600",
};

async function fetchAllOrders() {
  const first = await getAdminOrders({ page: 1, pageSize: 100 });
  const items = [...first.items];
  for (let page = 2; page <= first.totalPages; page++) {
    items.push(...(await getAdminOrders({ page, pageSize: 100 })).items);
  }
  return items;
}

export default function SellersPage() {
  const ready = useAuthGuard("Admin");
  const [view, setView] = useResponsiveView();
  const [result, setResult] = useState<PagedResult<AdminSellerDto> | null>(null);
  const [stats, setStats] = useState<Record<string, { orders: number; revenue: number }>>({});
  const [statusFilter, setStatusFilter] = useState<SellerStatus | "All">("All");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState<{ seller: AdminSellerDto; status: SellerStatus } | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    setLoading(true);
    setError("");
    getAdminSellers({ page, pageSize, status: statusFilter === "All" ? undefined : statusFilter })
      .then((data) => {
        if (!cancelled) setResult(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Failed to load sellers.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [ready, page, pageSize, statusFilter]);

  // Orders/revenue per seller are derived from the orders list (best-effort; hidden if it fails).
  useEffect(() => {
    if (!ready) return;
    fetchAllOrders()
      .then((orders: AdminOrderDto[]) => {
        const next: Record<string, { orders: number; revenue: number }> = {};
        for (const order of orders) {
          const entry = (next[order.sellerId] ??= { orders: 0, revenue: 0 });
          entry.orders += 1;
          entry.revenue += order.totalAmount;
        }
        setStats(next);
      })
      .catch(() => {});
  }, [ready]);

  const confirmStatus = async (reason: string) => {
    if (!pending) return;
    const { seller, status } = pending;
    setSaving(true);
    setSaveError("");
    try {
      await updateSellerStatus(seller.id, { status, reason });
      setNotice(`${seller.shopName || seller.fullName} is now ${status}.`);
      setPending(null);
      // Refetch so a status filter (e.g. Pending) drops sellers that no longer match.
      const refreshed = await getAdminSellers({ page, pageSize, status: statusFilter === "All" ? undefined : statusFilter });
      setResult(refreshed);
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.errors[0] ?? err.message : "Failed to update status.");
    } finally {
      setSaving(false);
    }
  };

  if (!ready) return null;

  // The API has no search parameter, so search narrows the current page only.
  const term = search.trim().toLowerCase();
  const sellers = (result?.items ?? []).filter(
    (s) => !term || [s.shopName, s.fullName, s.email, s.shopCategory].some((v) => v?.toLowerCase().includes(term)),
  );
  const hasStats = Object.keys(stats).length > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">Marketplace partners</p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">View Seller Profile</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-[#f0563f]"
              placeholder="Search sellers"
            />
          </div>
          <ViewToggle value={view} onChange={setView} />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setStatusFilter(tab);
              setPage(1);
            }}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
              statusFilter === tab ? "bg-[#f0563f] text-white" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {notice && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</div>}
      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {loading ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500">Loading sellers…</div>
      ) : sellers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500">No sellers found.</div>
      ) : (
        <div className={view === "grid" ? "grid gap-4 md:grid-cols-2 xl:grid-cols-3" : "space-y-3"}>
          {sellers.map((seller) => {
            const stat = stats[seller.id] ?? { orders: 0, revenue: 0 };
            return (
              <div key={seller.id} className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 ${view === "list" ? "flex flex-wrap items-center justify-between gap-4" : ""}`}>
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f0563f]/10 text-sm font-semibold text-[#f0563f]">
                      {(seller.shopName || seller.fullName).slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">{seller.shopName || seller.fullName}</div>
                      <div className="text-xs text-slate-500">{seller.fullName}</div>
                    </div>
                  </div>
                  <span className={`rounded-full px-2 py-1 text-[10px] font-medium ${statusStyles[seller.status] ?? "bg-slate-100 text-slate-600"}`}>{seller.status}</span>
                </div>

                <div className="space-y-2 text-sm text-slate-600">
                  <div className="flex justify-between gap-4"><span>Category</span><span className="font-medium text-slate-700">{seller.shopCategory || "—"}</span></div>
                  {hasStats && <div className="flex justify-between gap-4"><span>Revenue</span><span className="font-medium text-slate-700">${stat.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>}
                  {hasStats && <div className="flex justify-between gap-4"><span>Orders</span><span className="font-medium text-slate-700">{stat.orders}</span></div>}
                </div>

                <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-200 pt-3">
                  <div className={`inline-flex items-center gap-1 text-xs font-medium ${seller.status === "Approved" ? "text-emerald-700" : "text-slate-500"}`}>
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {seller.status === "Approved" ? "Verified" : "Not verified"}
                  </div>
                  <div className="flex items-center gap-3">
                    <select
                      value={seller.status}
                      onChange={(e) => {
                        const next = e.target.value as SellerStatus;
                        if (next !== seller.status) {
                          setSaveError("");
                          setPending({ seller, status: next });
                        }
                      }}
                      aria-label={`Change status of ${seller.shopName || seller.fullName}`}
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-700 outline-none focus:border-[#f0563f]"
                    >
                      {SELLER_STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  <Link href={`/admin/sellers/${seller.id}`} className="inline-flex items-center gap-1 text-sm font-medium text-[#f0563f]">
                    View profile
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {result && result.totalCount > 0 && (
        <Pagination
          page={result.page}
          totalPages={result.totalPages}
          totalCount={result.totalCount}
          pageSize={pageSize}
          onChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
        />
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
