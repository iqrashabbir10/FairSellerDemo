"use client";

import { useEffect, useState } from "react";
import { Check, ExternalLink, X } from "lucide-react";
import { getPendingPayments, verifyPayment } from "@/lib/api/admin";
import { ApiError } from "@/lib/api/client";
import type { PendingPaymentDto } from "@/lib/api/types";
import { useAuthGuard } from "@/lib/api/useAuthGuard";

export default function AdminPaymentsPage() {
  const ready = useAuthGuard("Admin");
  const [payments, setPayments] = useState<PendingPaymentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      setPayments(await getPendingPayments());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load pending payments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ready) load();
  }, [ready]);

  if (!ready) return null;

  const handleVerify = async (id: string, approve: boolean) => {
    const rejectionReason = approve ? null : window.prompt("Rejection reason") ?? "Receipt does not match order total.";
    try {
      await verifyPayment(id, { approve, rejectionReason });
      setPayments((current) => current.filter((payment) => payment.id !== id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to verify payment.");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-slate-500">Payment verification queue</p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Payments</h1>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {loading ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500">Loading payments…</div>
      ) : payments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500">No payments pending verification.</div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                  <th className="px-4 py-3 font-medium">Order ID</th>
                  <th className="px-4 py-3 font-medium text-right">Amount</th>
                  <th className="px-4 py-3 font-medium">Receipt</th>
                  <th className="px-4 py-3 font-medium">Submitted</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id} className="border-b border-slate-200 last:border-b-0">
                    <td className="px-4 py-3 font-medium text-slate-800">{payment.orderId}</td>
                    <td className="px-4 py-3 text-right font-medium text-slate-800">${payment.amount.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <a href={payment.fileUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[var(--brand)] hover:underline">
                        View receipt <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{new Date(payment.submittedAtUtc).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleVerify(payment.id, true)} className="inline-flex items-center gap-1 rounded-lg bg-[var(--brand)] px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-[var(--brand-hover)]">
                          <Check className="h-3.5 w-3.5" />
                          Approve
                        </button>
                        <button onClick={() => handleVerify(payment.id, false)} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                          <X className="h-3.5 w-3.5" />
                          Reject
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
