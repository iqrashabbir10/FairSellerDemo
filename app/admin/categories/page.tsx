"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { createAdminCategory, getAdminCategories } from "@/lib/api/admin";
import { ApiError } from "@/lib/api/client";
import type { CategoryDto } from "@/lib/api/types";
import { useAuthGuard } from "@/lib/api/useAuthGuard";

export default function AdminCategoriesPage() {
  const ready = useAuthGuard("Admin");
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      setCategories(await getAdminCategories());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load categories.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ready) load();
  }, [ready]);

  if (!ready) return null;

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      setError("Category name is required.");
      return;
    }
    setCreating(true);
    setError("");
    try {
      await createAdminCategory({ name: name.trim() });
      setName("");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.errors[0] ?? err.message : "Failed to create category.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-slate-500">Catalog overview</p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Categories</h1>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="min-w-[220px] flex-1">
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Category name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Home & Living" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-[#f0563f] focus:bg-white" />
        </div>
        <button type="submit" disabled={creating} className="inline-flex items-center gap-2 rounded-xl bg-[#f0563f] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#dc4b34] disabled:opacity-60">
          <Plus className="h-4 w-4" />
          {creating ? "Adding..." : "Add category"}
        </button>
      </form>

      {loading ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500">Loading categories…</div>
      ) : categories.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500">No categories yet.</div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <th className="px-4 py-3 font-medium">Name</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id} className="border-b border-slate-200 last:border-b-0">
                  <td className="px-4 py-3 font-medium text-slate-800">{category.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
