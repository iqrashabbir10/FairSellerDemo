import { Plus, RotateCcw, Warehouse } from "lucide-react";

const stockRows = [
  { sku: "SKU-0012", product: "Aster Ceramic Lamp", quantity: 26, location: "Warehouse A-12", threshold: 12, supplier: "Nordic Studio" },
  { sku: "SKU-0024", product: "Echo Smart Speaker", quantity: 64, location: "Warehouse B-09", threshold: 15, supplier: "Audio Works" },
  { sku: "SKU-0041", product: "Mira Throw Pillow Set", quantity: 82, location: "Warehouse C-03", threshold: 20, supplier: "Dune Co." },
  { sku: "SKU-0077", product: "Solstice Backpack", quantity: 46, location: "Warehouse A-07", threshold: 16, supplier: "Horizon Supply" },
  { sku: "SKU-0091", product: "Sable Leather Tote", quantity: 23, location: "Warehouse D-04", threshold: 10, supplier: "Marta line" },
];

export default function StorehousePage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">Inventory overview</p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Product Storehouse</h1>
        </div>
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
            <Plus className="h-4 w-4" />
            Add Stock
          </button>
          <button className="inline-flex items-center gap-2 rounded-xl bg-[#f0563f] px-3.5 py-2.5 text-sm font-semibold text-white hover:bg-[#dc4b34]">
            <RotateCcw className="h-4 w-4" />
            Adjust Stock
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <th className="px-4 py-3 font-medium">SKU</th>
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium text-right">Quantity</th>
                <th className="px-4 py-3 font-medium">Warehouse</th>
                <th className="px-4 py-3 font-medium text-right">Threshold</th>
                <th className="px-4 py-3 font-medium">Supplier</th>
              </tr>
            </thead>
            <tbody>
              {stockRows.map((row) => (
                <tr key={row.sku} className="border-b border-slate-200 last:border-b-0">
                  <td className="px-4 py-3 font-medium text-slate-800">{row.sku}</td>
                  <td className="px-4 py-3 text-slate-700">{row.product}</td>
                  <td className="px-4 py-3 text-right font-medium text-slate-800">{row.quantity}</td>
                  <td className="px-4 py-3 text-slate-600">{row.location}</td>
                  <td className="px-4 py-3 text-right text-slate-600">{row.threshold}</td>
                  <td className="px-4 py-3 text-slate-600">{row.supplier}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
