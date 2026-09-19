"use client";

import { useEffect, useState } from "react";
import { Copy, Plus, Share2 } from "lucide-react";
import { ShareSellerLinkDialog } from "@/app/components/ShareSellerLinkDialog";
import { createInviteCode, getInviteCodes } from "@/lib/api/admin";
import { ApiError } from "@/lib/api/client";
import type { InviteCodeDto } from "@/lib/api/types";
import { useAuthGuard } from "@/lib/api/useAuthGuard";

export default function InviteCodesPage() {
  const ready = useAuthGuard("Admin");
  const [codes, setCodes] = useState<InviteCodeDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [maxUses, setMaxUses] = useState("1");
  const [expiresAt, setExpiresAt] = useState("");
  const [creating, setCreating] = useState(false);
  const [share, setShare] = useState<{ invite: string } | null>(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await getInviteCodes({ pageSize: 100 });
      setCodes(result.items);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load invite codes.");
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
    setCreating(true);
    setError("");
    try {
      await createInviteCode({ maxUses: Number(maxUses), expiresAtUtc: expiresAt ? new Date(expiresAt).toISOString() : null });
      setMaxUses("1");
      setExpiresAt("");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create invite code.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">Seller onboarding</p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Invite Codes</h1>
        </div>
        <button onClick={() => setShare({ invite: "" })} className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand)] px-3.5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--brand-hover)]">
          <Share2 className="h-4 w-4" />
          Share seller link
        </button>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Max uses</label>
          <input type="number" min="1" value={maxUses} onChange={(e) => setMaxUses(e.target.value)} className="w-32 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-[var(--brand)] focus:bg-white" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Expires at <span className="font-normal text-slate-400">(optional)</span></label>
          <input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-[var(--brand)] focus:bg-white" />
        </div>
        <button type="submit" disabled={creating} className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--brand-hover)] disabled:opacity-60">
          <Plus className="h-4 w-4" />
          {creating ? "Creating..." : "Create code"}
        </button>
      </form>

      {loading ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500">Loading invite codes…</div>
      ) : codes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500">No invite codes yet.</div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                  <th className="px-4 py-3 font-medium">Code</th>
                  <th className="px-4 py-3 font-medium text-right">Used / Max</th>
                  <th className="px-4 py-3 font-medium">Expires</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Share</th>
                </tr>
              </thead>
              <tbody>
                {codes.map((code) => (
                  <tr key={code.id} className="border-b border-slate-200 last:border-b-0">
                    <td className="px-4 py-3 font-medium text-slate-800">
                      <button onClick={() => navigator.clipboard.writeText(code.code)} className="inline-flex items-center gap-1 hover:text-[var(--brand)]">
                        {code.code} <Copy className="h-3.5 w-3.5" />
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">{code.usedCount} / {code.maxUses}</td>
                    <td className="px-4 py-3 text-slate-600">{code.expiresAtUtc ? new Date(code.expiresAtUtc).toLocaleDateString() : "Never"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${code.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${code.isActive ? "bg-emerald-500" : "bg-slate-400"}`} />
                        {code.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setShare({ invite: code.code })}
                        disabled={!code.isActive}
                        title={code.isActive ? "Share a registration link with this code" : "This code is inactive"}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Share2 className="h-3.5 w-3.5" /> Share link
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {share && <ShareSellerLinkDialog initialInvite={share.invite} onClose={() => setShare(null)} />}
    </div>
  );
}
