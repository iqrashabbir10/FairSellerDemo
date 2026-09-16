"use client";

import { useEffect, useState } from "react";
import { ExternalLink, FileText, Mail, Phone, ShieldCheck, Store, X } from "lucide-react";
import { getAdminSeller } from "@/lib/api/admin";
import { ApiError, resolveApiUrl } from "@/lib/api/client";
import type { AdminSellerDto } from "@/lib/api/types";

export function SellerDetailModal({ sellerId, onClose }: { sellerId: string; onClose: () => void }) {
  const [seller, setSeller] = useState<AdminSellerDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    getAdminSeller(sellerId)
      .then((data) => {
        if (!cancelled) setSeller(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Failed to load seller details.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [sellerId]);

  const documentUrl = resolveApiUrl(seller?.documentUrl);
  const isPdf = documentUrl?.toLowerCase().endsWith(".pdf");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl" onClick={(event) => event.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Seller details</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        {loading ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500">Loading…</div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        ) : seller ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f0563f]/10 text-sm font-semibold text-[#f0563f]">
                {seller.fullName.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="font-semibold text-slate-900">{seller.fullName}</div>
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">{seller.status}</span>
              </div>
            </div>

            <div className="grid gap-2 text-sm text-slate-600">
              <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-slate-400" /> {seller.email}</div>
              <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-slate-400" /> {seller.phoneNumber}</div>
              <div>Registered: {new Date(seller.createdAtUtc).toLocaleString()}</div>
              {seller.approvedAtUtc && <div>Approved: {new Date(seller.approvedAtUtc).toLocaleString()}</div>}
              {seller.frozenAtUtc && <div>Frozen: {new Date(seller.frozenAtUtc).toLocaleString()}</div>}
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-800">
                <Store className="h-4 w-4 text-[#f0563f]" />
                Shop & business
              </div>
              <div className="space-y-1 text-sm text-slate-600">
                <div>{seller.shopName} · {seller.shopCategory}</div>
                <p>{seller.shopDescription}</p>
                <div>Address: {seller.address}, {seller.city}, {seller.country} {seller.postalCode}</div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-800">
                <FileText className="h-4 w-4 text-[#f0563f]" />
                Identity document
              </div>
              {documentUrl ? (
                <div className="space-y-2 text-sm text-slate-600">
                  <div>Type: {seller.documentType ?? seller.idType}</div>
                  <div>ID number: {seller.idNumber}</div>
                  {isPdf ? (
                    <a href={documentUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[#f0563f] hover:underline">
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
            </div>

            <div className="flex items-center gap-2 text-xs font-medium text-emerald-700">
              <ShieldCheck className="h-3.5 w-3.5" />
              {seller.approvedAtUtc ? "Verified account" : "Awaiting verification"}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
