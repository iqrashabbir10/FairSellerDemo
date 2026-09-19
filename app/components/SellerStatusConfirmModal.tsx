"use client";

import { useState } from "react";
import type { AdminSellerDto, SellerStatus } from "@/lib/api/types";

export const SELLER_STATUSES: SellerStatus[] = ["Pending", "Approved", "Rejected", "Frozen"];

const defaultReasons: Partial<Record<SellerStatus, string>> = {
  Approved: "Documents verified.",
};

// Confirm dialog for changing a seller's status; Rejected/Frozen require a reason.
export function SellerStatusConfirmModal({
  seller,
  status,
  saving,
  error,
  onCancel,
  onConfirm,
}: {
  seller: AdminSellerDto;
  status: SellerStatus;
  saving: boolean;
  error: string;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
}) {
  const reasonRequired = status === "Rejected" || status === "Frozen";
  const [reason, setReason] = useState(defaultReasons[status] ?? "");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" onClick={saving ? undefined : onCancel}>
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-xl" onClick={(event) => event.stopPropagation()}>
        <h2 className="text-lg font-semibold text-slate-900">Confirm status change</h2>
        <p className="mt-2 text-sm text-slate-600">
          Change <span className="font-medium text-slate-900">{seller.shopName || seller.fullName}</span> from{" "}
          <span className="font-medium text-slate-900">{seller.status}</span> to <span className="font-medium text-slate-900">{status}</span>?
        </p>
        <label className="mt-4 block text-sm">
          <span className="mb-1 block font-medium text-slate-700">
            Reason {reasonRequired ? <span className="text-red-500">*</span> : <span className="font-normal text-slate-400">(optional)</span>}
          </span>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#f0563f] focus:bg-white"
          />
        </label>
        {error && <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onCancel} disabled={saving} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">
            Cancel
          </button>
          <button
            onClick={() => onConfirm(reason.trim())}
            disabled={saving || (reasonRequired && !reason.trim())}
            className="rounded-xl bg-[#f0563f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#dc4b34] disabled:opacity-60"
          >
            {saving ? "Updating…" : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}
