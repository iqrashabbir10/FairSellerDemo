import { ArrowUpRight, CircleDollarSign, RefreshCcw, ShoppingCart, Store, TrendingUp, Users } from "lucide-react";
import { pendingSellerApprovals, recentActivity } from "@/lib/mock-data";

const stats = [
  { label: "Total Customers", value: "24.8K", icon: Users, tone: "bg-[#eaf8f1] text-[#1b8a5a]" },
  { label: "Active Sellers", value: "128", icon: Store, tone: "bg-[#eaf2ff] text-[#2e6fe0]" },
  { label: "Total Orders", value: "8,430", icon: ShoppingCart, tone: "bg-[#fff3e7] text-[#c98a1a]" },
  { label: "Total Revenue", value: "$482K", icon: CircleDollarSign, tone: "bg-[#eaf8f1] text-[#1b8a5a]" },
];

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">Marketplace overview</p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Dashboard</h1>
        </div>
        <button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50">
          <RefreshCcw className="h-4 w-4" />
          Refresh Data
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition duration-300 animate-[fadeIn_0.45s_ease]">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div className="space-y-2">
                <p className="text-sm text-slate-500">{label}</p>
                <div className="text-[2rem] font-semibold tracking-tight text-slate-900 tabular-nums">{value}</div>
              </div>
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs font-medium text-emerald-600">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>+12.4% vs last month</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_0.9fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-4 w-1 rounded-full bg-[#f0563f]" />
              <h2 className="text-xl font-semibold text-slate-900">Pending Seller Approvals</h2>
            </div>
            <span className="rounded-full bg-[#fff3ec] px-2.5 py-1 text-xs font-medium text-[#f0563f]">{pendingSellerApprovals.length} Requests</span>
          </div>

          {pendingSellerApprovals.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="pb-3 font-medium">Shop Name</th>
                    <th className="pb-3 font-medium">Seller Name</th>
                    <th className="pb-3 font-medium">Email</th>
                    <th className="pb-3 font-medium">Phone</th>
                    <th className="pb-3 font-medium">Registration Date</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">View Password</th>
                    <th className="pb-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingSellerApprovals.map((seller) => (
                    <tr key={seller.id} className="border-b border-slate-200 last:border-b-0">
                      <td className="py-3 pr-3 font-medium text-slate-800">{seller.shopName}</td>
                      <td className="py-3 pr-3">{seller.fullName}</td>
                      <td className="py-3 pr-3 text-slate-600">{seller.email}</td>
                      <td className="py-3 pr-3 text-slate-600">{seller.phone}</td>
                      <td className="py-3 pr-3 text-slate-600">{seller.joinedAt}</td>
                      <td className="py-3 pr-3">
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                          Pending
                        </span>
                      </td>
                      <td className="py-3 pr-3 text-slate-600">••••••</td>
                      <td className="py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button className="rounded-lg bg-[#f0563f] px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-[#db4d36]">Approve</button>
                          <button className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50">Reject</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-center text-slate-500">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-200">
                <ArrowUpRight className="h-5 w-5 text-slate-400" />
              </div>
              <div className="text-lg font-medium text-slate-700">No pending approval requests.</div>
              <p className="mt-1 text-sm text-slate-500">Approved sellers will appear here.</p>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-4 w-1 rounded-full bg-[#2e6fe0]" />
              <h2 className="text-xl font-semibold text-slate-900">Recent Activity</h2>
            </div>
          </div>

          {recentActivity.length > 0 ? (
            <div className="space-y-4">
              {recentActivity.map((item) => (
                <div key={item.id} className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <div className="mt-1 h-2.5 w-2.5 rounded-full bg-[#f0563f]" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-slate-800">{item.title}</p>
                      <span className="text-[11px] text-slate-400">{item.time}</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-center text-slate-500">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-200">
                <ShoppingCart className="h-5 w-5 text-slate-400" />
              </div>
              <div className="text-lg font-medium text-slate-700">No recent activity to display.</div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
