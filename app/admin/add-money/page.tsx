"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Coins, Search, Store } from "lucide-react";
import { creditSellerWallet, getWalletCredits, searchWalletSellers } from "@/lib/api/admin";
import { ApiError } from "@/lib/api/client";
import type { AdminWalletCreditDto, PagedResult, WalletSellerOptionDto } from "@/lib/api/types";
import { useAuthGuard } from "@/lib/api/useAuthGuard";

const MAX_AMOUNT = 1_000_000;
const MAX_NOTE = 500;
const QUICK_AMOUNTS = [100, 500, 1000, 5000];

const money = (value: number) => `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function relativeTime(iso: string) {
  const seconds = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} h ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function amountProblem(raw: string): string | null {
  if (raw.trim() === "") return null;
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) return "Enter an amount greater than zero.";
  if (value > MAX_AMOUNT) return `A single credit can't exceed ${money(MAX_AMOUNT)}.`;
  if (Math.round(value * 100) / 100 !== value) return "Use at most 2 decimal places.";
  return null;
}

export default function AddMoneyPage() {
  const ready = useAuthGuard("Admin");

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [sellers, setSellers] = useState<PagedResult<WalletSellerOptionDto> | null>(null);
  const [sellersLoading, setSellersLoading] = useState(true);
  const [sellersError, setSellersError] = useState("");
  const [sellerPage, setSellerPage] = useState(1);
  const [selected, setSelected] = useState<WalletSellerOptionDto | null>(null);

  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState("");
  // One id per credit attempt: a retry after a timeout reuses it, so the money can't be added twice.
  const [requestId, setRequestId] = useState(() => crypto.randomUUID());

  const [credits, setCredits] = useState<AdminWalletCreditDto[]>([]);
  const [creditsTotal, setCreditsTotal] = useState(0);
  const [creditsPage, setCreditsPage] = useState(1);
  const [creditsLoading, setCreditsLoading] = useState(true);
  const [creditsError, setCreditsError] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setSellerPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    setSellersLoading(true);
    setSellersError("");
    searchWalletSellers({ page: sellerPage, pageSize: 6, search: search || undefined })
      .then((data) => {
        if (!cancelled) setSellers(data);
      })
      .catch((err) => {
        if (!cancelled) setSellersError(err instanceof ApiError ? err.message : "Failed to load sellers.");
      })
      .finally(() => {
        if (!cancelled) setSellersLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [ready, search, sellerPage]);

  const loadCredits = useCallback(async (page: number, append: boolean) => {
    setCreditsLoading(true);
    try {
      const result = await getWalletCredits({ page, pageSize: 10 });
      setCredits((current) => (append ? [...current, ...result.items.filter((c) => !current.some((x) => x.id === c.id))] : result.items));
      setCreditsTotal(result.totalCount);
      setCreditsPage(result.page);
      setCreditsError("");
    } catch (err) {
      setCreditsError(err instanceof ApiError ? err.message : "Failed to load recent credits.");
    } finally {
      setCreditsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (ready) loadCredits(1, false);
  }, [ready, loadCredits]);

  const amountError = amountProblem(amount);
  const amountValue = amountError || amount.trim() === "" ? 0 : Number(amount);
  const noteTrimmed = note.trim();
  const canSubmit = !!selected && amountValue > 0 && !amountError && noteTrimmed.length > 0 && !submitting;
  const newBalance = useMemo(() => (selected && amountValue > 0 ? selected.balance + amountValue : null), [selected, amountValue]);

  if (!ready) return null;

  const submit = async () => {
    if (!selected || !canSubmit) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const result = await creditSellerWallet(selected.sellerId, { amount: amountValue, note: noteTrimmed, requestId });
      setSuccess(
        result.alreadyApplied
          ? `This credit was already applied. ${selected.shopName || selected.sellerName}'s balance is ${money(result.balance)}.`
          : `${money(result.amount)} added to ${selected.shopName || selected.sellerName}. New balance: ${money(result.balance)}.`,
      );
      setSelected({ ...selected, balance: result.balance });
      setSellers((current) => (current ? { ...current, items: current.items.map((s) => (s.sellerId === selected.sellerId ? { ...s, balance: result.balance } : s)) } : current));
      setAmount("");
      setNote("");
      setRequestId(crypto.randomUUID());
      setConfirming(false);
      loadCredits(1, false);
    } catch (err) {
      // Keep requestId as-is: if the request actually reached the server, a retry is safely de-duplicated.
      setSubmitError(err instanceof ApiError ? err.errors[0] ?? err.message : "Couldn't add money. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-slate-500">Manual wallet credit</p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Add Money</h1>
      </div>

      {success && (
        <div className="flex items-start justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700" role="status">
          <span className="inline-flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />{success}</span>
          <button onClick={() => setSuccess("")} className="text-emerald-700/70 hover:text-emerald-800" aria-label="Dismiss">×</button>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <form
            className="space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              if (canSubmit) {
                setSubmitError("");
                setConfirming(true);
              }
            }}
          >
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Select seller</label>
              <div className="relative mb-2">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search by seller or shop name"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-700 outline-none focus:border-[var(--brand)] focus:bg-white"
                />
              </div>
              {sellersError && <div className="mb-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{sellersError}</div>}
              <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200">
                {sellersLoading ? (
                  <li className="p-4 text-center text-sm text-slate-500">Loading sellers…</li>
                ) : !sellers || sellers.items.length === 0 ? (
                  <li className="p-4 text-center text-sm text-slate-500">{search ? "No approved sellers match your search." : "No approved sellers yet."}</li>
                ) : (
                  sellers.items.map((seller) => {
                    const active = selected?.sellerId === seller.sellerId;
                    return (
                      <li key={seller.sellerId}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelected(seller);
                            setSuccess("");
                          }}
                          aria-pressed={active}
                          className={`flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left transition ${active ? "bg-[var(--brand)]/5" : "hover:bg-slate-50"}`}
                        >
                          <span className="flex min-w-0 items-center gap-3">
                            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${active ? "bg-[var(--brand)] text-white" : "bg-[var(--brand)]/10 text-[var(--brand)]"}`}>
                              <Store className="h-4 w-4" />
                            </span>
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-medium text-slate-800">{seller.shopName || seller.sellerName}</span>
                              <span className="block truncate text-xs text-slate-500">{seller.sellerName}</span>
                            </span>
                          </span>
                          <span className="shrink-0 text-right">
                            <span className="block text-xs text-slate-400">Balance</span>
                            <span className="text-sm font-semibold text-slate-800">{money(seller.balance)}</span>
                          </span>
                        </button>
                      </li>
                    );
                  })
                )}
              </ul>
              {sellers && sellers.totalPages > 1 && (
                <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                  <span>Page {sellers.page} of {sellers.totalPages}</span>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setSellerPage((p) => Math.max(1, p - 1))} disabled={sellers.page <= 1} className="rounded-lg border border-slate-200 px-2.5 py-1 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40">Prev</button>
                    <button type="button" onClick={() => setSellerPage((p) => Math.min(sellers.totalPages, p + 1))} disabled={sellers.page >= sellers.totalPages} className="rounded-lg border border-slate-200 px-2.5 py-1 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40">Next</button>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="amount" className="mb-2 block text-sm font-medium text-slate-700">Amount</label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span>
                <input
                  id="amount"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  aria-invalid={!!amountError}
                  className={`w-full rounded-xl border bg-slate-50 py-2.5 pl-7 pr-3 text-sm text-slate-700 outline-none focus:bg-white ${amountError ? "border-red-300 focus:border-red-400" : "border-slate-200 focus:border-[var(--brand)]"}`}
                />
              </div>
              {amountError ? (
                <p className="mt-1 text-xs text-red-600">{amountError}</p>
              ) : (
                <div className="mt-2 flex flex-wrap gap-2">
                  {QUICK_AMOUNTS.map((quick) => (
                    <button key={quick} type="button" onClick={() => setAmount(String(quick))} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50">
                      {money(quick).replace(".00", "")}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="note" className="mb-2 block text-sm font-medium text-slate-700">Note <span className="font-normal text-slate-400">(required, kept in the audit log)</span></label>
              <textarea
                id="note"
                rows={4}
                maxLength={MAX_NOTE}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Promotional credit for the September campaign"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-[var(--brand)] focus:bg-white"
              />
              <div className="mt-1 text-right text-[11px] text-slate-400">{note.length}/{MAX_NOTE}</div>
            </div>

            {selected && newBalance !== null && (
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm">
                <span className="text-slate-500">Balance after credit</span>
                <span className="font-semibold text-slate-900">{money(selected.balance)} <span className="text-slate-400">→</span> <span className="text-emerald-600">{money(newBalance)}</span></span>
              </div>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--brand-hover)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Coins className="h-4 w-4" />
              Credit Wallet
            </button>
          </form>
        </div>

        <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 text-lg font-semibold text-slate-900">Recent transaction log</div>
          {creditsError && <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{creditsError}</div>}
          {creditsLoading && credits.length === 0 ? (
            <div className="space-y-3" aria-hidden>
              {[0, 1, 2].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />)}
            </div>
          ) : credits.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">No manual credits yet.</div>
          ) : (
            <div className="space-y-3">
              {credits.map((credit) => (
                <div key={credit.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 truncate font-medium text-slate-800">{credit.shopName || credit.sellerName}</div>
                    <span className="shrink-0 text-sm font-semibold text-emerald-600">+{money(credit.amount)}</span>
                  </div>
                  {credit.reason && <div className="mt-1 line-clamp-2 text-xs text-slate-600">{credit.reason}</div>}
                  <div className="mt-1 text-xs text-slate-400" title={new Date(credit.createdAtUtc).toLocaleString()}>
                    {credit.sellerName} • {relativeTime(credit.createdAtUtc)}
                  </div>
                </div>
              ))}
              {credits.length < creditsTotal && (
                <button onClick={() => loadCredits(creditsPage + 1, true)} disabled={creditsLoading} className="w-full rounded-xl border border-slate-200 bg-white py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-60">
                  {creditsLoading ? "Loading…" : "Load more"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {confirming && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" onClick={submitting ? undefined : () => setConfirming(false)}>
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-xl" onClick={(event) => event.stopPropagation()}>
            <h2 className="text-lg font-semibold text-slate-900">Confirm wallet credit</h2>
            <p className="mt-2 text-sm text-slate-600">
              Add <span className="font-semibold text-slate-900">{money(amountValue)}</span> to{" "}
              <span className="font-semibold text-slate-900">{selected.shopName || selected.sellerName}</span>&apos;s wallet? This is recorded in the audit log and can&apos;t be undone from here.
            </p>
            <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">{noteTrimmed}</div>
            {submitError && <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{submitError}</div>}
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setConfirming(false)} disabled={submitting} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">Cancel</button>
              <button onClick={submit} disabled={submitting} className="rounded-xl bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--brand-hover)] disabled:opacity-60">
                {submitting ? "Adding…" : submitError ? "Retry" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
