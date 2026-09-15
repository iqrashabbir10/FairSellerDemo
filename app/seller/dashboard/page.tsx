import { ArrowUpRight, CircleDollarSign, Package, ShoppingBag, TrendingUp, Wallet } from "lucide-react";

const stats = [
  { label: "My Products", value: "42", icon: Package, tone: "bg-[#eaf8f1] text-[#1b8a5a]" },
  { label: "My Orders", value: "186", icon: ShoppingBag, tone: "bg-[#eaf2ff] text-[#2e6fe0]" },
  { label: "Total Sales", value: "$24.7K", icon: CircleDollarSign, tone: "bg-[#fff3e7] text-[#c98a1a]" },
  { label: "Wallet Balance", value: "$3,280", icon: Wallet, tone: "bg-[#eaf8f1] text-[#1b8a5a]" },
];

const recentOrders = [
  { id: "ORD-4201", customer: "Layla Ahmed", total: "$178", status: "Delivered" },
  { id: "ORD-4208", customer: "Nora Bell", total: "$430", status: "Processing" },
  { id: "ORD-4212", customer: "Lina Moreno", total: "$90", status: "Pending" },
];

export default function SellerDashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-medium text-slate-500">Seller overview</p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Dashboard</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
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
              <span>+7.9% this month</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-4 w-1 rounded-full bg-[#f0563f]" />
              <h2 className="text-xl font-semibold text-slate-900">Recent Orders</h2>
            </div>
            <span className="text-sm font-medium text-slate-500">Today</span>
          </div>

          <div className="space-y-3">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div>
                  <div className="font-medium text-slate-800">{order.id}</div>
                  <div className="text-sm text-slate-500">{order.customer}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-slate-800">{order.total}</div>
                  <div className="text-xs text-slate-500">{order.status}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="h-4 w-1 rounded-full bg-[#2e6fe0]" />
            <h2 className="text-xl font-semibold text-slate-900">Recent Activity</h2>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="font-medium text-slate-800">Product approved</div>
                <span className="text-[11px] text-slate-400">12m ago</span>
              </div>
              <div className="mt-1 text-sm text-slate-600">Aster Ceramic Lamp received admin approval.</div>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="font-medium text-slate-800">Withdrawal requested</div>
                <span className="text-[11px] text-slate-400">1h ago</span>
              </div>
              <div className="mt-1 text-sm text-slate-600">A payout of $2,550 is awaiting review.</div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
