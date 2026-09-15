import { Send } from "lucide-react";

const txHistory = [
  { id: "TX-011", type: "Sale payout", amount: "+$1,240", date: "2025-09-12" },
  { id: "TX-010", type: "Withdrawal", amount: "-$950", date: "2025-09-08" },
  { id: "TX-009", type: "Refund", amount: "+$180", date: "2025-09-06" },
];

export default function SellerWalletPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-slate-500">Wallet status</p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Wallet / Withdraw</h1>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-2 text-sm text-slate-500">Available balance</div>
          <div className="text-4xl font-semibold tracking-tight text-slate-900">$3,280</div>
          <button className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#f0563f] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#dc4b34]">
            <Send className="h-4 w-4" />
            Request Withdrawal
          </button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Transaction history</h2>
          <div className="space-y-3">
            {txHistory.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div>
                  <div className="font-medium text-slate-800">{item.type}</div>
                  <div className="text-xs text-slate-500">{item.date}</div>
                </div>
                <div className={`font-semibold ${item.amount.startsWith("+") ? "text-emerald-600" : "text-slate-800"}`}>{item.amount}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
