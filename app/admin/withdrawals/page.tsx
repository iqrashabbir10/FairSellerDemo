import { CheckCheck, Clock3, X } from "lucide-react";
import { withdrawals } from "@/lib/mock-data";

export default function WithdrawalsPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-slate-500">Payout review</p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Money Withdraw</h1>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <th className="px-4 py-3 font-medium">Seller</th>
                <th className="px-4 py-3 font-medium">Shop Name</th>
                <th className="px-4 py-3 font-medium text-right">Amount</th>
                <th className="px-4 py-3 font-medium">Bank / Account Details</th>
                <th className="px-4 py-3 font-medium">Request Date</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {withdrawals.map((item) => (
                <tr key={item.id} className="border-b border-slate-200 last:border-b-0">
                  <td className="px-4 py-3 font-medium text-slate-800">{item.seller}</td>
                  <td className="px-4 py-3 text-slate-600">{item.shopName}</td>
                  <td className="px-4 py-3 text-right font-medium text-slate-800">${item.amount}</td>
                  <td className="px-4 py-3 text-slate-600">{item.account}</td>
                  <td className="px-4 py-3 text-slate-600">{item.requestedAt}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                      item.status === "Approved" ? "bg-blue-50 text-blue-700" :
                      item.status === "Paid" ? "bg-emerald-50 text-emerald-700" :
                      item.status === "Rejected" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${
                        item.status === "Approved" ? "bg-blue-500" :
                        item.status === "Paid" ? "bg-emerald-500" :
                        item.status === "Rejected" ? "bg-red-500" : "bg-amber-500"
                      }`} />
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
                        <CheckCheck className="h-3.5 w-3.5" />
                        Approve
                      </button>
                      <button className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
                        <X className="h-3.5 w-3.5" />
                        Reject
                      </button>
                      <button className="inline-flex items-center gap-1 rounded-lg bg-[#f0563f] px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-[#dc4b34]">
                        <Clock3 className="h-3.5 w-3.5" />
                        Mark Paid
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
