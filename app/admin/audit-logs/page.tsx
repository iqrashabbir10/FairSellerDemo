"use client";

import { useEffect, useState } from "react";
import { getAuditLogs } from "@/lib/api/admin";
import { ApiError } from "@/lib/api/client";
import type { AuditLogDto } from "@/lib/api/types";
import { useAuthGuard } from "@/lib/api/useAuthGuard";

export default function AuditLogsPage() {
  const ready = useAuthGuard("Admin");
  const [logs, setLogs] = useState<AuditLogDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ready) return;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const result = await getAuditLogs({ pageSize: 100 });
        setLogs(result.items);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Failed to load audit logs.");
      } finally {
        setLoading(false);
      }
    })();
  }, [ready]);

  if (!ready) return null;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-slate-500">System trail</p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Audit Logs</h1>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {loading ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500">Loading audit logs…</div>
      ) : logs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500">No audit log entries yet.</div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                  <th className="px-4 py-3 font-medium">Actor</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                  <th className="px-4 py-3 font-medium">Entity</th>
                  <th className="px-4 py-3 font-medium">When</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-slate-200 last:border-b-0">
                    <td className="px-4 py-3 font-medium text-slate-800">{log.actorUserId}</td>
                    <td className="px-4 py-3 text-slate-700">{log.action}</td>
                    <td className="px-4 py-3 text-slate-600">{log.entityName} · {log.entityId}</td>
                    <td className="px-4 py-3 text-slate-600">{new Date(log.createdAtUtc).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
