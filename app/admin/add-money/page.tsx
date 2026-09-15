import { Coins } from "lucide-react";

const mockUsers = [
  { id: "sel-101", name: "Aisha Khan — Veloura Home" },
  { id: "cus-101", name: "Layla Ahmed — Customer" },
  { id: "sel-102", name: "Rami Haddad — Luma Elec" },
];

export default function AddMoneyPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-slate-500">Manual wallet credit</p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Add Money</h1>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <form className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Select User</label>
              <select className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-[#f0563f] focus:bg-white">
                {mockUsers.map((user) => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Amount</label>
              <input
                defaultValue="2500"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-[#f0563f] focus:bg-white"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Note</label>
              <textarea
                rows={4}
                defaultValue="Manual wallet credit for promotional campaign."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-[#f0563f] focus:bg-white"
              />
            </div>

            <button className="inline-flex items-center gap-2 rounded-xl bg-[#f0563f] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#dc4b34]">
              <Coins className="h-4 w-4" />
              Credit Wallet
            </button>
          </form>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 text-lg font-semibold text-slate-900">Recent transaction log</div>
          <div className="space-y-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="font-medium text-slate-800">Aisha Khan</div>
                <span className="text-sm font-semibold text-emerald-600">+$2,500</span>
              </div>
              <div className="mt-1 text-xs text-slate-500">Promotional wallet credit • Today</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="font-medium text-slate-800">Layla Ahmed</div>
                <span className="text-sm font-semibold text-emerald-600">+$340</span>
              </div>
              <div className="mt-1 text-xs text-slate-500">Manual adjustment • Yesterday</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
