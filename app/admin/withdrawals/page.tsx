"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCheck, CheckCircle2, Clock3, Copy, Landmark, X } from "lucide-react";
import { getAdminWithdrawals, updateWithdrawalStatus } from "@/lib/api/admin";
import { ApiError } from "@/lib/api/client";
import type { WithdrawalDto, WithdrawalStatus } from "@/lib/api/types";
import { useAuthGuard } from "@/lib/api/useAuthGuard";

type Filter = "Pending" | "All" | "Approved" | "Rejected";
const FILTERS: Filter[] = ["Pending", "All", "Approved", "Rejected"];

const money = (value: number) => `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const METHOD_LABEL: Record<string, string> = { BankTransfer: "Bank transfer", Crypto: "Crypto transfer" };

const STATUS_STYLE: Record<WithdrawalStatus, { badge: string; dot: string }> = {
  Pending: { badge: "bg-amber-50 text-amber-700", dot: "bg-amber-500" },
  Approved: { badge: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
  Paid: { badge: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
  Rejected: { badge: "bg-red-50 text-red-700", dot: "bg-red-500" },
};

const sellerLabel = (item: WithdrawalDto) => item.shopName || item.sellerName || "Unknown seller";

function ConfirmDialog({
  item,
  action,
  saving,
  error,
  onCancel,
  onConfirm,
}: {
  item: WithdrawalDto;
  action: "Approved" | "Rejected";
  saving: boolean;
  error: string;
  onCancel: () => void;
  onConfirm: (note: string) => void;
}) {
  const [note, setNote] = useState("");
  const approve = action === "Approved";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" onClick={saving ? undefined : onCancel}>
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${approve ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>
          {approve ? <CheckCheck className="h-5 w-5" /> : <X className="h-5 w-5" />}
        </div>
        <h2 className="mt-4 text-lg font-semibold text-slate-900">
          {approve ? "Approve" : "Reject"} {money(item.amount)} for {sellerLabel(item)}?
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          {approve
            ? "The amount stays deducted from the seller's wallet. Send them the money using the payment details on the request."
            : "The amount goes straight back to the seller's available balance and they're told it was rejected."}
        </p>

        {!approve && (
          <label className="mt-4 block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">Reason <span className="font-normal text-slate-400">(shown to the seller)</span></span>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} maxLength={500} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-[var(--brand)] focus:bg-white" placeholder="e.g. Bank details look incorrect" />
          </label>
        )}

        {error && <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</div>}

        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onCancel} disabled={saving} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">Cancel</button>
          <button
            onClick={() => onConfirm(note.trim())}
            disabled={saving}
            className={`rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 ${approve ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"}`}
          >
            {saving ? "Saving…" : approve ? "Approve" : "Reject"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function WithdrawalsPage() {
  const ready = useAuthGuard("Admin");
  const [withdrawals, setWithdrawals] = useState<WithdrawalDto[]>([]);
  const [filter, setFilter] = useState<Filter>("Pending");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState<{ item: WithdrawalDto; action: "Approved" | "Rejected" } | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError("");
    try {
      const result = await getAdminWithdrawals({ pageSize: 100 });
      setWithdrawals(result.items);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load withdrawals.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (ready) load();
  }, [ready, load]);

  const counts = useMemo(() => {
    const c = { Pending: 0, Approved: 0, Rejected: 0, All: withdrawals.length };
    for (const w of withdrawals) {
      if (w.status === "Pending") c.Pending++;
      else if (w.status === "Rejected") c.Rejected++;
      else c.Approved++; // Approved and Paid
    }
    return c;
  }, [withdrawals]);

  const visible = useMemo(
    () =>
      withdrawals.filter((w) =>
        filter === "All" ? true : filter === "Pending" ? w.status === "Pending" : filter === "Rejected" ? w.status === "Rejected" : w.status === "Approved" || w.status === "Paid",
      ),
    [withdrawals, filter],
  );

  if (!ready) return null;

  const confirm = async (note: string) => {
    if (!pending) return;
    setSaving(true);
    setSaveError("");
    try {
      await updateWithdrawalStatus(pending.item.id, { status: pending.action, note, paymentReference: "" });
      setNotice(
        pending.action === "Approved"
          ? `Approved ${money(pending.item.amount)} for ${sellerLabel(pending.item)}.`
          : `Rejected — ${money(pending.item.amount)} was returned to ${sellerLabel(pending.item)}'s balance.`,
      );
      setPending(null);
      await load();
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.errors[0] ?? err.message : "Couldn't update this request. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const copy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      window.setTimeout(() => setCopied((current) => (current === id ? null : current)), 1500);
    } catch {
      // Clipboard blocked — the text is still on screen.
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-slate-500">Payout review</p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Money Withdraw</h1>
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter requests">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            aria-pressed={filter === f}
            className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium transition ${filter === f ? "bg-[var(--brand)] text-white" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
          >
            {f}
            <span className={`rounded-full px-1.5 text-xs font-semibold ${filter === f ? "bg-white/25" : "bg-slate-100 text-slate-500"}`}>{counts[f]}</span>
          </button>
        ))}
      </div>

      {notice && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700" role="status">
          <span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4" />{notice}</span>
          <button onClick={() => setNotice("")} aria-label="Dismiss" className="text-emerald-700/70 hover:text-emerald-800">×</button>
        </div>
      )}
      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</div>}

      {loading ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500">Loading withdrawals…</div>
      ) : visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500">
          {filter === "Pending" ? "No requests waiting for review." : "No requests here."}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                  <th className="px-4 py-3 font-medium">Seller</th>
                  <th className="px-4 py-3 text-right font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Method &amp; payment details</th>
                  <th className="px-4 py-3 font-medium">Requested</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((item) => {
                  const style = STATUS_STYLE[item.status];
                  return (
                    <tr key={item.id} className="border-b border-slate-200 align-top last:border-b-0">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{sellerLabel(item)}</div>
                        {item.shopName && item.sellerName && <div className="text-xs text-slate-500">{item.sellerName}</div>}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold tabular-nums text-slate-900">{money(item.amount)}</td>
                      <td className="px-4 py-3">
                        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                          <Landmark className="h-3.5 w-3.5 text-[var(--brand)]" />
                          {METHOD_LABEL[item.method ?? ""] ?? item.method ?? "—"}
                        </div>
                        {item.paymentDetails && (
                          <div className="mt-1 flex items-start gap-2">
                            <pre className="whitespace-pre-wrap break-all font-sans text-xs leading-5 text-slate-600">{item.paymentDetails}</pre>
                            <button onClick={() => copy(item.id, item.paymentDetails ?? "")} aria-label="Copy payment details" title="Copy payment details" className="shrink-0 rounded-md border border-slate-200 p-1 text-slate-500 hover:bg-slate-50">
                              {copied === item.id ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                            </button>
                          </div>
                        )}
                        {item.status === "Rejected" && item.note && <p className="mt-1 text-xs text-red-700">Reason: {item.note}</p>}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{new Date(item.requestedAtUtc).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${style.badge}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {item.status === "Pending" ? (
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => {
                                setSaveError("");
                                setPending({ item, action: "Approved" });
                              }}
                              className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                            >
                              <CheckCheck className="h-3.5 w-3.5" />
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                setSaveError("");
                                setPending({ item, action: "Rejected" });
                              }}
                              className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
                            >
                              <X className="h-3.5 w-3.5" />
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                            <Clock3 className="h-3.5 w-3.5" />
                            {item.processedAtUtc ? new Date(item.processedAtUtc).toLocaleDateString() : "Done"}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {pending && <ConfirmDialog item={pending.item} action={pending.action} saving={saving} error={saveError} onCancel={() => setPending(null)} onConfirm={confirm} />}
    </div>
  );
}
