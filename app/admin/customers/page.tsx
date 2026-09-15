import { Search } from "lucide-react";
import { customers } from "@/lib/mock-data";

export default function CustomersPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">Customer base</p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Customer Profiles</h1>
        </div>
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-[#f0563f]"
            placeholder="Search customers"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium text-right">Orders Count</th>
                <th className="px-4 py-3 font-medium text-right">Total Spent</th>
                <th className="px-4 py-3 font-medium">Joined Date</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id} className="border-b border-slate-200 last:border-b-0">
                  <td className="px-4 py-3 font-medium text-slate-800">{customer.name}</td>
                  <td className="px-4 py-3 text-slate-600">{customer.email}</td>
                  <td className="px-4 py-3 text-slate-600">{customer.phone}</td>
                  <td className="px-4 py-3 text-right text-slate-700">{customer.ordersCount}</td>
                  <td className="px-4 py-3 text-right font-medium text-slate-800">${customer.totalSpent}</td>
                  <td className="px-4 py-3 text-slate-600">{customer.joinedAt}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${customer.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${customer.status === "active" ? "bg-emerald-500" : "bg-red-500"}`} />
                      {customer.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">View</button>
                      <button className="rounded-lg bg-[#f0563f] px-2.5 py-1.5 text-xs font-medium text-white hover:bg-[#dc4b34]">Block</button>
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
