"use client";

import { useEffect, useState } from "react";
import { Send } from "lucide-react";
import { createSellerWithdrawal, getSellerWallet, getSellerWalletTransactions } from "@/lib/api/seller";
import { ApiError } from "@/lib/api/client";
import type { WalletDto, WalletTransactionDto, WithdrawalMethod } from "@/lib/api/types";
import { useAuthGuard } from "@/lib/api/useAuthGuard";

export default function SellerWalletPage() {
  const ready = useAuthGuard("Seller");
  const [wallet, setWallet] = useState<WalletDto | null>(null);
  const [transactions, setTransactions] = useState<WalletTransactionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<WithdrawalMethod>("BankTransfer");
  const [paymentDetails, setPaymentDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [walletData, transactionsData] = await Promise.all([
        getSellerWallet(),
        getSellerWalletTransactions({ pageSize: 20 }),
      ]);
      setWallet(walletData);
      setTransactions(transactionsData.items);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load wallet.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ready) load();
  }, [ready]);

  if (!ready) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError("");
    setFormSuccess("");
    setSubmitting(true);
    try {
      await createSellerWithdrawal({ amount: Number(amount), withdrawalMethod: method, paymentDetails });
      setFormSuccess("Withdrawal request submitted.");
      setAmount("");
      setPaymentDetails("");
      setShowForm(false);
      load();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Failed to submit withdrawal request.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-slate-500">Wallet status</p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Wallet / Withdraw</h1>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-2 text-sm text-slate-500">Available balance</div>
          <div className="text-4xl font-semibold tracking-tight text-slate-900">
            {loading ? "…" : `$${(wallet?.balance ?? 0).toLocaleString()}`}
          </div>
          <button
            onClick={() => setShowForm((current) => !current)}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#f0563f] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#dc4b34]"
          >
            <Send className="h-4 w-4" />
            Request Withdrawal
          </button>

          {showForm && (
            <form onSubmit={handleSubmit} className="mt-5 space-y-3 border-t border-slate-100 pt-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Amount</label>
                <input required type="number" min="1" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-[#f0563f] focus:bg-white" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Method</label>
                <select value={method} onChange={(e) => setMethod(e.target.value as WithdrawalMethod)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-[#f0563f] focus:bg-white">
                  <option value="BankTransfer">Bank Transfer</option>
                  <option value="CashOnHand">Cash On Hand</option>
                  <option value="MobileWallet">Mobile Wallet</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Payment details</label>
                <textarea required rows={3} value={paymentDetails} onChange={(e) => setPaymentDetails(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-[#f0563f] focus:bg-white" placeholder="IBAN, account or wallet number" />
              </div>
              {formError && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</div>}
              <button type="submit" disabled={submitting} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#f0563f] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#dc4b34] disabled:opacity-60">
                {submitting ? "Submitting..." : "Submit request"}
              </button>
            </form>
          )}

          {formSuccess && <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{formSuccess}</div>}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Transaction history</h2>
          {loading ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-slate-500">Loading…</div>
          ) : transactions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-slate-500">No transactions yet.</div>
          ) : (
            <div className="space-y-3">
              {transactions.map((item) => {
                const isCredit = item.type === "Credit" || item.type === "ProfitCredit" || item.type === "Refund";
                return (
                  <div key={item.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div>
                      <div className="font-medium text-slate-800">{item.type}</div>
                      <div className="text-xs text-slate-500">{new Date(item.createdAtUtc).toLocaleDateString()}</div>
                    </div>
                    <div className={`font-semibold ${isCredit ? "text-emerald-600" : "text-slate-800"}`}>
                      {isCredit ? "+" : "-"}${item.amount.toFixed(2)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
