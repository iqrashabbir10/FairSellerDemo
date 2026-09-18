"use client";

import { useEffect, useRef, useState } from "react";
import { SendHorizontal } from "lucide-react";
import {
  createSellerSupportConversation,
  getSellerSupportConversations,
  getSellerSupportMessages,
  sendSellerSupportMessage,
} from "@/lib/api/seller";
import { ApiError } from "@/lib/api/client";
import { getSession } from "@/lib/api/session";
import { joinConversation, leaveConversation, onReceiveMessage } from "@/lib/signalr/supportHub";
import { playMessageSound } from "@/lib/notificationSound";
import type { SupportConversationDto, SupportMessageDto } from "@/lib/api/types";
import { useAuthGuard } from "@/lib/api/useAuthGuard";

function addUnique(current: SupportMessageDto[], incoming: SupportMessageDto) {
  if (current.some((message) => message.id === incoming.id)) return current;
  return [...current, incoming];
}

export default function SellerConversationsPage() {
  const ready = useAuthGuard("Seller");
  const [threads, setThreads] = useState<SupportConversationDto[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<SupportMessageDto[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [messagesUnavailable, setMessagesUnavailable] = useState(false);
  const userId = getSession()?.userId;

  // Always resolve a real conversation id before sending anything — never trust a cached/guessed
  // id, since sending to one that was never created (or no longer exists) 404s.
  useEffect(() => {
    if (!ready || !userId) return;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const items = await getSellerSupportConversations();
        // Old duplicate conversations from earlier bugs may still exist server-side — always
        // resolve to the most recently created one so refreshes don't land on a stale empty thread.
        const sorted = [...items].sort((a, b) => new Date(b.createdAtUtc).getTime() - new Date(a.createdAtUtc).getTime());
        const conversation = sorted.length > 0 ? sorted[0] : await createSellerSupportConversation();
        setThreads([conversation]);
        setActiveId(conversation.id);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Failed to load conversations.");
      } finally {
        setLoading(false);
      }
    })();
  }, [ready, userId]);

  // Join the active conversation's hub group, load its history, and listen for live messages.
  // Also polls every few seconds as a fallback while the SignalR hub is unreachable, so replies
  // still show up without a manual refresh.
  useEffect(() => {
    if (!activeId) {
      setMessages([]);
      return;
    }
    let cancelled = false;
    setMessagesLoading(true);
    setMessagesUnavailable(false);
    joinConversation(activeId).catch(() => {});

    const fetchMessages = async (isInitial: boolean) => {
      try {
        const result = await getSellerSupportMessages(activeId, { pageSize: 100 });
        if (cancelled) return;
        setMessages((current) => {
          const incomingNew = result.items.filter((item) => !current.some((existing) => existing.id === item.id));
          if (!isInitial && incomingNew.some((item) => item.senderUserId !== userId)) {
            playMessageSound("received");
          }
          return result.items;
        });
      } catch (err) {
        if (cancelled) return;
        // Backend route not deployed yet (404/405) — show a muted note, not a scary red error.
        if (err instanceof ApiError && (err.status === 404 || err.status === 405)) {
          setMessagesUnavailable(true);
        } else if (isInitial) {
          setError(err instanceof ApiError ? err.message : "Failed to load messages.");
        }
      } finally {
        if (!cancelled && isInitial) setMessagesLoading(false);
      }
    };

    fetchMessages(true);
    const pollId = window.setInterval(() => fetchMessages(false), 4000);

    const unsubscribe = onReceiveMessage((incoming) => {
      if (incoming.conversationId === activeId) {
        setMessages((current) => {
          if (current.some((message) => message.id === incoming.id)) return current;
          if (incoming.senderUserId !== userId) playMessageSound("received");
          return [...current, incoming];
        });
      }
    });

    return () => {
      cancelled = true;
      window.clearInterval(pollId);
      unsubscribe();
      leaveConversation(activeId).catch(() => {});
    };
  }, [activeId, userId]);

  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  if (!ready) return null;

  const handleSend = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!activeId || !message.trim()) return;
    setSending(true);
    try {
      const sent = await sendSellerSupportMessage(activeId, message);
      setMessages((current) => addUnique(current, sent));
      playMessageSound("sent");
      setMessage("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-slate-500">Inbox</p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Conversations</h1>
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

          <div ref={scrollRef} className="flex flex-1 flex-col gap-4 overflow-y-auto bg-[#fcfbfa] p-5">
            {messagesLoading ? (
              <div className="text-sm text-slate-500">Loading messages…</div>
            ) : messages.length === 0 ? (
              <div className="text-sm text-slate-500">
                {messagesUnavailable ? "Message history isn't available from the server right now — you can still send a new message below." : "Send a message to start the conversation."}
              </div>
            ) : (
              messages.map((item) => {
                const mine = item.senderUserId === userId;
                return (
                  <div key={item.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${mine ? "bg-[#f0563f] text-white" : "bg-white text-slate-700 ring-1 ring-slate-200"}`}>
                      {item.message}
                      <div className={`mt-1 text-[10px] ${mine ? "text-white/80" : "text-slate-400"}`}>{new Date(item.createdAtUtc).toLocaleTimeString()}</div>
                    </div>
                  </div>
                );
              })
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
