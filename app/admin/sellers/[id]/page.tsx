"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AlertTriangle, ArrowLeft, Check, Copy, ExternalLink, FileText, KeyRound, Mail, Phone, ShieldCheck, Store } from "lucide-react";
import { SellerStatusConfirmModal } from "@/app/components/SellerStatusConfirmModal";
import { Pagination } from "@/app/components/Pagination";
import { ProductThumbnail } from "@/app/components/ProductThumbnail";
import { getAdminOrders, getAdminSeller, getSellerProducts, resetSellerPassword, updateSellerStatus } from "@/lib/api/admin";
import { ApiError, resolveApiUrl } from "@/lib/api/client";
import type { AdminOrderDto, AdminSellerDto, PagedResult, SellerProductDto, SellerStatus } from "@/lib/api/types";
import { useAuthGuard } from "@/lib/api/useAuthGuard";

const STATUSES: SellerStatus[] = ["Pending", "Approved", "Rejected", "Frozen"];

const statusStyles: Record<string, string> = {
  Approved: "bg-emerald-50 text-emerald-700",
  Pending: "bg-amber-50 text-amber-700",
  Rejected: "bg-red-50 text-red-700",
  Frozen: "bg-slate-100 text-slate-600",
};

const money = (value: number) => `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function Card({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
        {icon}
        {title}
      </div>
      {children}
    </section>
  );
}

// Confirm, then reveal the one-time temporary password for the admin to pass on to the seller.
function ResetPasswordDialog({ sellerId, sellerName, onClose }: { sellerId: string; sellerName: string; onClose: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [password, setPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const confirm = async () => {
    setBusy(true);
    setError("");
    try {
      const result = await resetSellerPassword(sellerId);
      setPassword(result.temporaryPassword);
    } catch (err) {
      setError(err instanceof ApiError ? err.errors[0] ?? err.message : "We couldn't reset the password. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    if (!password) return;
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard blocked — the password is still on screen to copy by hand.
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" onClick={busy || password ? undefined : onClose}>
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl" onClick={(event) => event.stopPropagation()}>
        {password === null ? (
          <>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600"><KeyRound className="h-5 w-5" /></div>
            <h2 className="mt-4 text-lg font-semibold text-slate-900">Reset {sellerName}&apos;s password?</h2>
            <p className="mt-2 text-sm text-slate-600">
              This creates a temporary password and immediately replaces their current one. They&apos;ll be asked to choose a new password the next time they sign in.
            </p>
            {error && <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</div>}
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={onClose} disabled={busy} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">Cancel</button>
              <button onClick={confirm} disabled={busy} className="rounded-xl bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--brand-hover)] disabled:opacity-60">{busy ? "Resetting…" : "Reset password"}</button>
            </div>
          </>
        ) : (
          <>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><Check className="h-5 w-5" /></div>
            <h2 className="mt-4 text-lg font-semibold text-slate-900">Password reset</h2>
            <p className="mt-2 text-sm text-slate-600">Send this temporary password to {sellerName}. They&apos;ll be asked to set their own when they sign in with it.</p>
            <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <code className="select-all break-all font-mono text-lg font-semibold tracking-wide text-slate-900">{password}</code>
              <button onClick={copy} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <p className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              This is shown only once. Share it privately (not in a public chat) — if you lose it, just reset the password again.
            </p>
            <div className="mt-5 flex justify-end">
              <button onClick={onClose} className="rounded-xl bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--brand-hover)]">Done</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function SellerProfilePage() {
  const ready = useAuthGuard("Admin");
  const { id } = useParams<{ id: string }>();

  const [seller, setSeller] = useState<AdminSellerDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [orders, setOrders] = useState<AdminOrderDto[]>([]);

  const [products, setProducts] = useState<PagedResult<SellerProductDto> | null>(null);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [pendingStatus, setPendingStatus] = useState<SellerStatus | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    if (!ready || !id) return;
    let cancelled = false;
    getAdminSeller(id)
      .then((data) => {
        if (!cancelled) setSeller(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Failed to load seller.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [ready, id]);

  // Order stats come from the orders list filtered to this seller (best-effort).
  useEffect(() => {
    if (!ready || !id) return;
    let cancelled = false;
    (async () => {
      try {
        const first = await getAdminOrders({ page: 1, pageSize: 100 });
        const all = [...first.items];
        for (let p = 2; p <= first.totalPages; p++) {
          all.push(...(await getAdminOrders({ page: p, pageSize: 100 })).items);
        }
        if (!cancelled) setOrders(all.filter((o) => o.sellerId === id));
      } catch {
        // stats simply stay empty
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ready, id]);

  useEffect(() => {
    if (!ready || !id) return;
    let cancelled = false;
    setProductsLoading(true);
    setProductsError("");
    getSellerProducts(id, page, pageSize)
      .then((data) => {
        if (!cancelled) setProducts(data);
      })
      .catch((err) => {
        if (!cancelled) setProductsError(err instanceof ApiError ? err.message : "Failed to load products.");
      })
      .finally(() => {
        if (!cancelled) setProductsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [ready, id, page, pageSize]);

  const stats = useMemo(
    () => ({
      orders: orders.length,
      revenue: orders.reduce((sum, o) => sum + o.totalAmount, 0),
      profit: orders.reduce((sum, o) => sum + o.profitAmount, 0),
    }),
    [orders],
  );
  const recentOrders = useMemo(() => [...orders].sort((a, b) => b.createdAtUtc.localeCompare(a.createdAtUtc)).slice(0, 5), [orders]);

  const confirmStatus = async (reason: string) => {
    if (!seller || !pendingStatus) return;
    setSaving(true);
    setSaveError("");
    try {
      await updateSellerStatus(seller.id, { status: pendingStatus, reason });
      // Re-read so approved/frozen timestamps stay accurate.
      setSeller(await getAdminSeller(seller.id));
      setNotice(`Seller status changed to ${pendingStatus}.`);
      setPendingStatus(null);
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.errors[0] ?? err.message : "Failed to update status.");
    } finally {
      setSaving(false);
    }
  };

  if (!ready) return null;

  const documentUrl = resolveApiUrl(seller?.documentUrl);
  const isPdf = documentUrl?.toLowerCase().endsWith(".pdf");

  return (
    <div className="space-y-6">
      <Link href="/admin/sellers" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" />
        Back to sellers
      </Link>

      {loading ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500">Loading seller…</div>
      ) : error || !seller ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error || "Seller not found."}</div>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--brand)]/10 text-lg font-semibold text-[var(--brand)]">
                {(seller.shopName || seller.fullName).slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{seller.shopName || seller.fullName}</h1>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                  {seller.fullName}
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[seller.status] ?? "bg-slate-100 text-slate-600"}`}>{seller.status}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
            <button onClick={() => setResetOpen(true)} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              <KeyRound className="h-4 w-4" />
              Reset password
            </button>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              Status
              <select
                value={seller.status}
                onChange={(e) => {
                  const next = e.target.value as SellerStatus;
                  if (next !== seller.status) {
                    setSaveError("");
                    setPendingStatus(next);
                  }
                }}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none focus:border-[var(--brand)]"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </label>
            </div>
          </div>

          {notice && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</div>}

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              ["Orders", String(stats.orders)],
              ["Revenue", money(stats.revenue)],
              ["Seller profit", money(stats.profit)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="text-sm text-slate-500">{label}</div>
                <div className="mt-1 text-2xl font-semibold text-slate-900">{value}</div>
              </div>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card title="Contact & account" icon={<ShieldCheck className="h-4 w-4 text-[var(--brand)]" />}>
              <div className="space-y-2 text-sm text-slate-600">
                <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-slate-400" /> {seller.email}</div>
                <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-slate-400" /> {seller.phoneNumber}</div>
                <div>Registered: {new Date(seller.createdAtUtc).toLocaleString()}</div>
                {seller.approvedAtUtc && <div>Approved: {new Date(seller.approvedAtUtc).toLocaleString()}</div>}
                {seller.frozenAtUtc && <div>Frozen: {new Date(seller.frozenAtUtc).toLocaleString()}</div>}
              </div>
            </Card>

            <Card title="Shop & business" icon={<Store className="h-4 w-4 text-[var(--brand)]" />}>
              <div className="space-y-2 text-sm text-slate-600">
                <div className="font-medium text-slate-800">{seller.shopName} · {seller.shopCategory}</div>
              </div>
            </Card>

            <Card title="Identity document" icon={<FileText className="h-4 w-4 text-[var(--brand)]" />}>
              {documentUrl ? (
                <div className="space-y-2 text-sm text-slate-600">
                  <div>Type: {seller.documentType ?? seller.idType}</div>
                  <div>ID number: {seller.idNumber}</div>
                  {isPdf ? (
                    <a href={documentUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[var(--brand)] hover:underline">
                      View document <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  ) : (
                    <a href={documentUrl} target="_blank" rel="noreferrer" className="block">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={documentUrl} alt="Identity document" className="max-h-56 rounded-lg border border-slate-200 object-contain" />
                    </a>
                  )}
                </div>
              ) : (
                <p className="text-sm text-slate-500">No identity document has been submitted for this seller.</p>
              )}
            </Card>

            <Card title="Recent orders">
              {recentOrders.length === 0 ? (
                <p className="text-sm text-slate-500">No orders yet.</p>
              ) : (
                <ul className="divide-y divide-slate-100 text-sm">
                  {recentOrders.map((order) => (
                    <li key={order.id} className="flex items-center justify-between gap-3 py-2">
                      <div>
                        <div className="font-medium text-slate-800">{order.orderNumber}</div>
                        <div className="text-xs text-slate-500">{new Date(order.createdAtUtc).toLocaleString()}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-slate-800">{money(order.totalAmount)}</div>
                        <div className="text-xs text-slate-500">{order.status.replace(/([a-z])([A-Z])/g, "$1 $2")}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-900">Product listings</h2>
            {productsError && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{productsError}</div>}
            {productsLoading ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500">Loading products…</div>
            ) : !products || products.items.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500">This seller has no product listings yet.</div>
            ) : (
              <>
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px] text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                          <th className="px-4 py-3 font-medium">Image</th>
                          <th className="px-4 py-3 font-medium">Product</th>
                          <th className="px-4 py-3 font-medium">Code</th>
                          <th className="px-4 py-3 font-medium text-right">Base Price</th>
                          <th className="px-4 py-3 font-medium text-right">Seller Price</th>
                          <th className="px-4 py-3 font-medium text-right">Qty listed</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.items.map((product) => (
                          <tr key={product.id} className="border-b border-slate-200 last:border-b-0">
                            <td className="px-4 py-3"><ProductThumbnail name={product.productName} imageUrls={product.imageUrls} className="h-10 w-10" bare /></td>
                            <td className="px-4 py-3 font-medium text-slate-800">{product.productName}</td>
                            <td className="px-4 py-3 font-mono text-xs text-slate-500">{product.sku || "—"}</td>
                            <td className="px-4 py-3 text-right text-slate-600">${product.supplierCost.toFixed(2)}</td>
                            <td className="px-4 py-3 text-right font-medium text-slate-800">${product.sellingPrice.toFixed(2)}</td>
                            <td className="px-4 py-3 text-right text-slate-600">{product.quantity}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <Pagination
                  page={products.page}
                  totalPages={products.totalPages}
                  totalCount={products.totalCount}
                  pageSize={pageSize}
                  onChange={setPage}
                  onPageSizeChange={(size) => {
                    setPageSize(size);
                    setPage(1);
                  }}
                />
              </>
            )}
          </section>

          {resetOpen && <ResetPasswordDialog sellerId={seller.id} sellerName={seller.shopName || seller.fullName} onClose={() => setResetOpen(false)} />}

          {pendingStatus && (
            <SellerStatusConfirmModal
              seller={seller}
              status={pendingStatus}
              saving={saving}
              error={saveError}
              onCancel={() => setPendingStatus(null)}
              onConfirm={confirmStatus}
            />
          )}
        </>
      )}
    </div>
  );
}
