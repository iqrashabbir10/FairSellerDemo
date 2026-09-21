"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, CircleDollarSign, Clock3, Info, Landmark, Send } from "lucide-react";
import { createSellerWithdrawal, getSellerWallet, getSellerWalletTransactions, getSellerWithdrawals } from "@/lib/api/seller";
import { ApiError } from "@/lib/api/client";
import type { CreateWithdrawalPayload, WalletDto, WalletTransactionDto, WithdrawalDto, WithdrawalMethod, WithdrawalStatus } from "@/lib/api/types";
import { useAuthGuard } from "@/lib/api/useAuthGuard";
import { ColorPanel, GradientStatCard } from "@/app/components/DashboardCards";

const money = (value: number) => `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const METHOD_LABEL: Record<string, string> = { BankTransfer: "Bank transfer", Crypto: "Crypto transfer" };
const CRYPTO_NETWORKS = ["USDT (TRC20)", "USDT (ERC20)", "Bitcoin (BTC)", "Ethereum (ETH)"];

const STATUS_STYLE: Record<WithdrawalStatus, string> = {
  Pending: "bg-amber-50 text-amber-700",
  Approved: "bg-emerald-50 text-emerald-700",
  Paid: "bg-emerald-50 text-emerald-700",
  Rejected: "bg-red-50 text-red-700",
};

const fieldClass =
  "w-full rounded-xl border bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:bg-white focus:border-[var(--brand)]";

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}

export default function SellerWalletPage() {
  const ready = useAuthGuard("Seller");
  const [wallet, setWallet] = useState<WalletDto | null>(null);
  const [withdrawals, setWithdrawals] = useState<WithdrawalDto[]>([]);
  const [transactions, setTransactions] = useState<WalletTransactionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [amount, setAmount] = useState("");
  // Nothing is preselected: the bank / crypto fields only appear once a method has been chosen.
  const [method, setMethod] = useState<WithdrawalMethod | "">("");
  const [holder, setHolder] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [network, setNetwork] = useState(CRYPTO_NETWORKS[0]);
  const [walletAddress, setWalletAddress] = useState("");
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");

  const load = useCallback(async () => {
    setError("");
    const [w, list, tx] = await Promise.allSettled([getSellerWallet(), getSellerWithdrawals({ pageSize: 20 }), getSellerWalletTransactions({ pageSize: 15 })]);
    if (w.status === "fulfilled") setWallet(w.value);
    else setError(w.reason instanceof ApiError ? w.reason.message : "Failed to load your wallet.");
    if (list.status === "fulfilled") setWithdrawals(list.value.items);
    if (tx.status === "fulfilled") setTransactions(tx.value.items);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (ready) load();
  }, [ready, load]);

  const balance = wallet?.balance ?? 0;
  const amountNumber = Number(amount);

  // Field-level validation, shown only after the first submit attempt.
  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (!amount.trim() || !Number.isFinite(amountNumber) || amountNumber <= 0) e.amount = "Enter an amount greater than zero.";
    else if (Math.round(amountNumber * 100) / 100 !== amountNumber) e.amount = "Use at most 2 decimal places.";
    else if (amountNumber > balance) e.amount = `You can withdraw up to ${money(balance)}.`;
    if (!method) {
      e.method = "Choose how you want to be paid.";
    } else if (method === "BankTransfer") {
      if (!holder.trim()) e.holder = "Enter the account holder's name.";
      if (!bankName.trim()) e.bankName = "Enter the bank name.";
      if (!/^[A-Za-z0-9 -]{5,34}$/.test(accountNumber.trim())) e.accountNumber = "Enter a valid account number (5–34 letters or digits).";
      if (!/^[A-Za-z0-9]{4,20}$/.test(ifsc.trim())) e.ifsc = "Enter the IFSC code.";
    } else if (!/^[A-Za-z0-9]{20,128}$/.test(walletAddress.trim())) {
      e.walletAddress = "Enter your wallet address (letters and digits, no spaces).";
    }
    return e;
  }, [amount, amountNumber, balance, method, holder, bankName, accountNumber, ifsc, walletAddress]);

  if (!ready) return null;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setTouched(true);
    setFormError("");
    setSuccess("");
    if (Object.keys(errors).length > 0 || !method) return;

    const payload: CreateWithdrawalPayload =
      method === "BankTransfer"
        ? { amount: amountNumber, withdrawalMethod: method, accountHolderName: holder.trim(), bankName: bankName.trim(), accountNumber: accountNumber.trim(), ifsc: ifsc.trim().toUpperCase() }
        : { amount: amountNumber, withdrawalMethod: method, network, walletAddress: walletAddress.trim() };

    setSubmitting(true);
    try {
      await createSellerWithdrawal(payload);
      setSuccess(`Request submitted. ${money(amountNumber)} is held from your balance until an admin reviews it — if it's rejected, it comes straight back.`);
      setAmount("");
      setHolder("");
      setBankName("");
      setAccountNumber("");
      setIfsc("");
      setWalletAddress("");
      setMethod("");
      setTouched(false);
      await load();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.errors[0] ?? err.message : "We couldn't submit your request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const show = (key: string) => (touched ? errors[key] : undefined);
  const ring = (key: string) => (show(key) ? "border-red-300" : "border-slate-200");

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-slate-500">Wallet</p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Money Withdrawal</h1>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</div>}

      <div className="grid gap-4 sm:grid-cols-2">
        <GradientStatCard label="Wallet Balance" value={loading ? "…" : money(balance)} icon={Landmark} gradient="blue" foot={<span>Available for withdrawal</span>} />
        <GradientStatCard label="Pending" value={loading ? "…" : money(wallet?.pendingBalance ?? 0)} icon={CircleDollarSign} gradient="green" foot={<span>Total pending amount</span>} />
      </div>
      <p className="flex items-start gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
        <span>
          When you pick an order, its amount waits in <span className="font-semibold">Pending</span>. When the admin delivers it, the amount moves to your <span className="font-semibold">Wallet Balance</span> and can be withdrawn.
        </span>
      </p>

      <div className="grid items-start gap-6 xl:grid-cols-[1fr_1.1fr]">
        <ColorPanel title="Request a Withdrawal" accent="bg-[var(--brand)]">
          <form onSubmit={submit} className="space-y-4" noValidate>
            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm">
              <span className="text-slate-600">Available Balance</span>
              <span className="text-lg font-bold text-slate-900">{money(balance)}</span>
            </div>

            <Field label="Amount to withdraw ($)" error={show("amount")}>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className={`${fieldClass} ${ring("amount")} pl-7 pr-16`}
                />
                <button type="button" onClick={() => setAmount(String(balance))} disabled={balance <= 0} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-semibold text-[var(--brand)] hover:bg-[var(--brand)]/10 disabled:opacity-40">
                  Max
                </button>
              </div>
            </Field>

            <Field label="Withdrawal method" error={show("method")}>
              <select value={method} onChange={(e) => setMethod(e.target.value as WithdrawalMethod | "")} className={`${fieldClass} ${ring("method")}`}>
                <option value="" disabled>Choose a method…</option>
                <option value="BankTransfer">Bank Transfer</option>
                <option value="Crypto">Crypto Transfer</option>
              </select>
            </Field>

            {method === "BankTransfer" ? (
              <div className="grid gap-4">
                <Field label="Account holder name" error={show("holder")}>
                  <input value={holder} onChange={(e) => setHolder(e.target.value)} maxLength={100} autoComplete="off" className={`${fieldClass} ${ring("holder")}`} />
                </Field>
                <Field label="Bank name" error={show("bankName")}>
                  <input value={bankName} onChange={(e) => setBankName(e.target.value)} maxLength={100} autoComplete="off" className={`${fieldClass} ${ring("bankName")}`} />
                </Field>
                <Field label="Account number" error={show("accountNumber")}>
                  <input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} maxLength={34} autoComplete="off" className={`${fieldClass} ${ring("accountNumber")}`} />
                </Field>
                <Field label="IFSC code" error={show("ifsc")}>
                  <input value={ifsc} onChange={(e) => setIfsc(e.target.value.toUpperCase())} maxLength={20} autoComplete="off" className={`${fieldClass} ${ring("ifsc")} uppercase`} placeholder="e.g. HDFC0001234" />
                </Field>
              </div>
            ) : method === "Crypto" ? (
              <div className="space-y-4">
                <Field label="Network">
                  <select value={network} onChange={(e) => setNetwork(e.target.value)} className={`${fieldClass} border-slate-200`}>
                    {CRYPTO_NETWORKS.map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Wallet address" error={show("walletAddress")}>
                  <input value={walletAddress} onChange={(e) => setWalletAddress(e.target.value)} maxLength={128} autoComplete="off" spellCheck={false} className={`${fieldClass} ${ring("walletAddress")} font-mono`} placeholder="Paste your wallet address" />
                </Field>
                <p className="text-xs text-slate-500">Double-check the address and network — crypto transfers can&apos;t be reversed.</p>
              </div>
            ) : null}

            {formError && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{formError}</div>}
            {success && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700" role="status">{success}</div>}

            <button type="submit" disabled={submitting || balance <= 0} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand)] px-4 py-3 text-sm font-semibold text-white hover:bg-[var(--brand-hover)] disabled:opacity-60">
              <Send className="h-4 w-4" />
              {submitting ? "Submitting…" : "Submit request"}
            </button>
            {balance <= 0 && !loading && <p className="text-center text-xs text-slate-500">You have no available balance to withdraw yet.</p>}
          </form>
        </ColorPanel>

        <div className="space-y-6">
          <ColorPanel title="Withdrawal requests" accent="bg-amber-500">
            {loading ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">Loading…</div>
            ) : withdrawals.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">No withdrawal requests yet.</div>
            ) : (
              <ul className="space-y-3">
                {withdrawals.map((item) => (
                  <li key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-semibold text-slate-900">{money(item.amount)}</div>
                        <div className="text-xs text-slate-500">{METHOD_LABEL[item.method ?? ""] ?? item.method} · {new Date(item.requestedAtUtc).toLocaleDateString()}</div>
                      </div>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLE[item.status]}`}>
                        {item.status === "Pending" && <Clock3 className="h-3 w-3" />}
                        {item.status === "Pending" ? "Pending review" : item.status}
                      </span>
                    </div>
                    {item.status === "Rejected" && (
                      <p className="mt-2 text-xs text-red-700">Rejected{item.note ? `: ${item.note}` : ""} — the amount was returned to your balance.</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </ColorPanel>

          <ColorPanel title="Wallet activity" accent="bg-sky-500">
            {loading ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">Loading…</div>
            ) : transactions.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">No transactions yet.</div>
            ) : (
              <ul className="space-y-2">
                {transactions.map((item) => {
                  const isCredit = item.type === "Credit" || item.type === "ProfitCredit" || item.type === "Refund";
                  return (
                    <li key={item.id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2.5">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${isCredit ? "bg-emerald-50 text-emerald-600" : "bg-slate-200 text-slate-600"}`}>
                          {isCredit ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                        </span>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium text-slate-800">{item.reason || item.type}</div>
                          <div className="text-xs text-slate-500">{new Date(item.createdAtUtc).toLocaleDateString()}</div>
                        </div>
                      </div>
                      <div className={`shrink-0 text-sm font-semibold ${isCredit ? "text-emerald-600" : "text-slate-800"}`}>
                        {isCredit ? "+" : "-"}
                        {money(item.amount)}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </ColorPanel>
        </div>
      </div>
    </div>
  );
}
