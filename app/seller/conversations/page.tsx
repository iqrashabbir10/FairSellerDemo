"use client";

import { useEffect, useState } from "react";
import { SendHorizontal } from "lucide-react";
import { createSellerSupportConversation, getSellerSupportConversations, sendSellerSupportMessage } from "@/lib/api/seller";
import { ApiError } from "@/lib/api/client";
import type { SupportConversationDto } from "@/lib/api/types";
import { useAuthGuard } from "@/lib/api/useAuthGuard";

export default function SellerConversationsPage() {
  const ready = useAuthGuard("Seller");
  const [threads, setThreads] = useState<SupportConversationDto[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [sentMessages, setSentMessages] = useState<string[]>([]);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await getSellerSupportConversations({ pageSize: 50 });
      setThreads(result.items);
      setActiveId((current) => current ?? result.items[0]?.id ?? null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load conversations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ready) load();
  }, [ready]);

  if (!ready) return null;

  const startConversation = async () => {
    try {
      const conversation = await createSellerSupportConversation();
      setThreads((current) => [conversation, ...current]);
      setActiveId(conversation.id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to start conversation.");
    }
  };

  const handleSend = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!activeId || !message.trim()) return;
    setSending(true);
    try {
      const sent = await sendSellerSupportMessage(activeId, message);
      setSentMessages((current) => [...current, sent.message]);
      setMessage("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">Inbox</p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Conversations</h1>
        </div>
        <button onClick={startConversation} className="inline-flex items-center gap-2 rounded-xl bg-[#f0563f] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#dc4b34]">
          New conversation
        </button>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="grid min-h-[640px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:grid-cols-[320px_1fr]">
        <aside className="border-b border-slate-200 bg-slate-50 lg:border-b-0 lg:border-r">
          <div className="border-b border-slate-200 px-4 py-3 text-sm font-medium text-slate-700">Recent messages</div>
          <div className="space-y-2 p-3">
            {loading ? (
              <div className="p-3 text-sm text-slate-500">Loading…</div>
            ) : threads.length === 0 ? (
              <div className="p-3 text-sm text-slate-500">No conversations yet.</div>
            ) : (
              threads.map((thread) => (
                <button
                  key={thread.id}
                  onClick={() => setActiveId(thread.id)}
                  className={`w-full rounded-xl border p-3 text-left ${thread.id === activeId ? "border-[#f0563f] bg-white shadow-sm" : "border-transparent bg-transparent hover:bg-white"}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-medium text-slate-800">Support #{thread.id.slice(0, 8)}</div>
                    <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">{thread.status}</span>
                  </div>
                  <div className="mt-2 text-sm text-slate-600">{new Date(thread.createdAtUtc).toLocaleString()}</div>
                </button>
              ))
            )}
          </div>
        </aside>

        <section className="flex min-h-[500px] flex-col">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Support Team</h2>
              <p className="text-xs text-slate-500">Admin</p>
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-4 bg-[#fcfbfa] p-5">
            {sentMessages.length === 0 ? (
              <div className="text-sm text-slate-500">Send a message to start the conversation.</div>
            ) : (
              sentMessages.map((text, index) => (
                <div key={index} className="flex justify-end">
                  <div className="max-w-[75%] rounded-2xl bg-[#f0563f] px-4 py-2 text-sm text-white">{text}</div>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleSend} className="border-t border-slate-200 p-4">
            <div className="flex gap-3">
              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={!activeId}
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-[#f0563f] focus:bg-white"
                placeholder={activeId ? "Type a message" : "Start a conversation first"}
              />
              <button type="submit" disabled={sending || !activeId} className="inline-flex items-center gap-2 rounded-xl bg-[#f0563f] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#dc4b34] disabled:opacity-60">
                <SendHorizontal className="h-4 w-4" />
                Send
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
