"use client";

import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { getAdminSellers, updateSellerStatus } from "@/lib/api/admin";
import { ApiError } from "@/lib/api/client";
import type { AdminSellerDto, SellerStatus } from "@/lib/api/types";
import { useResponsiveView, ViewToggle } from "@/app/components/ViewToggle";
import { useAuthGuard } from "@/lib/api/useAuthGuard";
import { SellerDetailModal } from "@/app/components/SellerDetailModal";

const statusTone: Record<SellerStatus, string> = {
  Approved: "bg-emerald-50 text-emerald-700",
  Pending: "bg-amber-50 text-amber-700",
  Rejected: "bg-red-50 text-red-700",
  Frozen: "bg-slate-100 text-slate-600",
};

export default function SellersPage() {
  const ready = useAuthGuard("Admin");
  const [view, setView] = useResponsiveView();
  const [sellers, setSellers] = useState<AdminSellerDto[]>([]);
  const [statusFilter, setStatusFilter] = useState<SellerStatus | "">("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewingSellerId, setViewingSellerId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await getAdminSellers({ status: statusFilter || undefined, pageSize: 100 });
      setSellers(result.items);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load sellers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ready) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, statusFilter]);

  if (!ready) return null;

  const changeStatus = async (id: string, status: SellerStatus) => {
    try {
      await updateSellerStatus(id, { status, reason: `Status changed to ${status} by admin.` });
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update seller status.");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-slate-500">Marketplace partners</p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">View Seller Profile</h1>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as SellerStatus | "")} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none">
          <option value="">All statuses</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
          <option value="Frozen">Frozen</option>
        </select>
        <ViewToggle value={view} onChange={setView} />
      </div>

      {loading ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500">Loading sellers…</div>
      ) : sellers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500">No sellers found.</div>
      ) : (
        <div className={view === "grid" ? "grid gap-4 md:grid-cols-2 xl:grid-cols-3" : "space-y-3"}>
          {sellers.map((seller) => (
            <div key={seller.id} className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 ${view === "list" ? "flex flex-wrap items-center justify-between gap-4" : ""}`}>
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f0563f]/10 text-sm font-semibold text-[#f0563f]">
                    {seller.fullName.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">{seller.fullName}</div>
                    <div className="text-xs text-slate-500">{seller.email}</div>
                  </div>
                </div>
                <span className={`rounded-full px-2 py-1 text-[10px] font-medium ${statusTone[seller.status]}`}>{seller.status}</span>
              </div>

              <div className="space-y-2 text-sm text-slate-600">
                <div className="flex justify-between"><span>Phone</span><span className="font-medium text-slate-700">{seller.phoneNumber}</span></div>
                <div className="flex justify-between"><span>Joined</span><span className="font-medium text-slate-700">{new Date(seller.createdAtUtc).toLocaleDateString()}</span></div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-200 pt-3">
                <div className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {seller.approvedAtUtc ? `Approved ${new Date(seller.approvedAtUtc).toLocaleDateString()}` : "Not approved"}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setViewingSellerId(seller.id)} className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">View</button>
                  {seller.status !== "Approved" && (
                    <button onClick={() => changeStatus(seller.id, "Approved")} className="rounded-lg bg-[#f0563f] px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-[#dc4b34]">Approve</button>
                  )}
                  {seller.status !== "Frozen" && seller.status === "Approved" && (
                    <button onClick={() => changeStatus(seller.id, "Frozen")} className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">Freeze</button>
                  )}
                  {seller.status !== "Rejected" && (
                    <button onClick={() => changeStatus(seller.id, "Rejected")} className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">Reject</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {viewingSellerId && <SellerDetailModal sellerId={viewingSellerId} onClose={() => setViewingSellerId(null)} />}
    </div>
  );
}
