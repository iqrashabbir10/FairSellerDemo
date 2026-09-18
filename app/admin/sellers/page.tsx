"use client";

import { ArrowRight, ShieldCheck } from "lucide-react";
import { sellers } from "@/lib/mock-data";
import { useResponsiveView, ViewToggle } from "@/app/components/ViewToggle";

export default function SellersPage() {
  const [view, setView] = useResponsiveView();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-slate-500">Marketplace partners</p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">View Seller Profile</h1>
      </div>

      <div className="flex justify-end"><ViewToggle value={view} onChange={setView} /></div>
      <div className={view === "grid" ? "grid gap-4 md:grid-cols-2 xl:grid-cols-3" : "space-y-3"}>
        {sellers.map((seller) => (
          <div key={seller.id} className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 ${view === "list" ? "flex flex-wrap items-center justify-between gap-4" : ""}`}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f0563f]/10 text-sm font-semibold text-[#f0563f]">
                  {seller.shopName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="font-semibold text-slate-900">{seller.shopName}</div>
                  <div className="text-xs text-slate-500">{seller.fullName}</div>
                </div>
              </div>
              <span className={`rounded-full px-2 py-1 text-[10px] font-medium ${seller.status === "approved" ? "bg-emerald-50 text-emerald-700" : seller.status === "pending" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"}`}>
                {seller.status}
              </span>
            </div>

            <div className="space-y-2 text-sm text-slate-600">
              <div className="flex justify-between"><span>Category</span><span className="font-medium text-slate-700">{seller.category}</span></div>
              <div className="flex justify-between"><span>Revenue</span><span className="font-medium text-slate-700">${seller.revenue.toLocaleString()}</span></div>
              <div className="flex justify-between"><span>Orders</span><span className="font-medium text-slate-700">{seller.orders}</span></div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-200 pt-3">
              <div className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                <ShieldCheck className="h-3.5 w-3.5" />
                {seller.kycVerified ? "KYC verified" : "Verification pending"}
              </div>
              <button className="inline-flex items-center gap-1 text-sm font-medium text-[#f0563f]">
                View profile
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
