"use client";

import { useEffect, useState } from "react";
import { CheckCheck, Clock3, X } from "lucide-react";
import { getAdminWithdrawals, updateWithdrawalStatus } from "@/lib/api/admin";
import { ApiError } from "@/lib/api/client";
import type { WithdrawalDto, WithdrawalStatus } from "@/lib/api/types";
import { useAuthGuard } from "@/lib/api/useAuthGuard";

export default function WithdrawalsPage() {
  const ready = useAuthGuard("Admin");
  const [withdrawals, setWithdrawals] = useState<WithdrawalDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await getAdminWithdrawals({ pageSize: 200 });
      setWithdrawals(result.items);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load withdrawals.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ready) load();
  }, [ready]);

  if (!ready) return null;

  const changeStatus = async (id: string, status: WithdrawalStatus) => {
    try {
      await updateWithdrawalStatus(id, { status, note: `Marked as ${status}.`, paymentReference: "" });
      setWithdrawals((current) => current.map((item) => (item.id === id ? { ...item, status } : item)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update withdrawal.");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-slate-500">Payout review</p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Money Withdraw</h1>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {loading ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500">Loading withdrawals…</div>
      ) : withdrawals.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500">No withdrawal requests.</div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                  <th className="px-4 py-3 font-medium">Seller ID</th>
                  <th className="px-4 py-3 font-medium text-right">Amount</th>
                  <th className="px-4 py-3 font-medium">Request Date</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.map((item) => (
                  <tr key={item.id} className="border-b border-slate-200 last:border-b-0">
                    <td className="px-4 py-3 font-medium text-slate-800">{item.sellerId}</td>
                    <td className="px-4 py-3 text-right font-medium text-slate-800">${item.amount.toFixed(2)}</td>
                    <td className="px-4 py-3 text-slate-600">{new Date(item.requestedAtUtc).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                        item.status === "Approved" ? "bg-blue-50 text-blue-700" :
                        item.status === "Paid" ? "bg-emerald-50 text-emerald-700" :
                        item.status === "Rejected" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${
                          item.status === "Approved" ? "bg-blue-500" :
                          item.status === "Paid" ? "bg-emerald-500" :
                          item.status === "Rejected" ? "bg-red-500" : "bg-amber-500"
                        }`} />
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => changeStatus(item.id, "Approved")} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
                          <CheckCheck className="h-3.5 w-3.5" />
                          Approve
                        </button>
                        <button onClick={() => changeStatus(item.id, "Rejected")} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
                          <X className="h-3.5 w-3.5" />
                          Reject
                        </button>
                        <button onClick={() => changeStatus(item.id, "Paid")} className="inline-flex items-center gap-1 rounded-lg bg-[var(--brand)] px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-[var(--brand-hover)]">
                          <Clock3 className="h-3.5 w-3.5" />
                          Mark Paid
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
    </div>
  );
}
