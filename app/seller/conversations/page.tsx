"use client";

import { useEffect, useRef, useState } from "react";
import { Paperclip, SendHorizontal, X } from "lucide-react";
import {
  createSellerSupportConversation,
  getSellerSupportConversations,
  getSellerSupportMessages,
  markSellerSupportMessagesRead,
  sendSellerSupportMessage,
} from "@/lib/api/seller";
import { ApiError } from "@/lib/api/client";
import { getSession } from "@/lib/api/session";
import { joinConversation, leaveConversation, onMessagesRead, onReceiveMessage } from "@/lib/signalr/supportHub";
import { playMessageSound } from "@/lib/notificationSound";
import { getCachedMessages, setCachedMessages } from "@/lib/chatMessageCache";
import { MessageStatusTicks } from "@/app/components/MessageStatusTicks";
import { ChatAttachmentBubble } from "@/app/components/ChatAttachmentBubble";
import type { SupportMessageDto } from "@/lib/api/types";
import { useAuthGuard } from "@/lib/api/useAuthGuard";

function addUnique(current: SupportMessageDto[], incoming: SupportMessageDto) {
  if (current.some((message) => message.id === incoming.id)) return current;
  return [...current, incoming];
}

export default function SellerConversationsPage() {
  const ready = useAuthGuard("Seller");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<SupportMessageDto[]>([]);
  // Ids the server has confirmed persisting (via a GET), vs. ones only known from our own POST
  // response — the difference between a single "sent" tick and a double "delivered" tick.
  const [confirmedIds, setConfirmedIds] = useState<Set<string>>(new Set());
  const [readUntil, setReadUntil] = useState<string | null>(null);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [messagesUnavailable, setMessagesUnavailable] = useState(false);
  const [attachment, setAttachment] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
    setMessages(getCachedMessages(activeId));
    joinConversation(activeId).catch(() => {});

    const fetchMessages = async (isInitial: boolean) => {
      try {
        const result = await getSellerSupportMessages(activeId, { pageSize: 100 });
        if (cancelled) return;
        setConfirmedIds((current) => {
          const next = new Set(current);
          result.items.forEach((item) => next.add(item.id));
          return next;
        });
        setMessages((current) => {
          const incomingNew = result.items.filter((item) => !current.some((existing) => existing.id === item.id));
          if (!isInitial && incomingNew.some((item) => item.senderUserId !== userId)) {
            playMessageSound("received");
          }
          return result.items;
        });
      } catch (err) {
        if (cancelled) return;
        // Backend route not deployed yet (404/405) — keep whatever is cached instead of blanking it.
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

    const unsubscribeReceive = onReceiveMessage((incoming) => {
      if (incoming.conversationId === activeId) {
        setConfirmedIds((current) => new Set(current).add(incoming.id));
        setMessages((current) => {
          if (current.some((message) => message.id === incoming.id)) return current;
          if (incoming.senderUserId !== userId) playMessageSound("received");
          return [...current, incoming];
        });
      }
    });

    // Speculative — only fires if the backend implements read receipts (see repo memory notes).
    const unsubscribeRead = onMessagesRead((payload) => {
      if (payload.conversationId === activeId) setReadUntil(payload.readAtUtc);
    });

    return () => {
      cancelled = true;
      window.clearInterval(pollId);
      unsubscribeReceive();
      unsubscribeRead();
      leaveConversation(activeId).catch(() => {});
    };
  }, [activeId, userId]);

  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  // Keep the local cache in sync so a refresh (or the history GET failing) never loses a message
  // that was actually sent/received successfully.
  useEffect(() => {
    if (activeId) setCachedMessages(activeId, messages);
  }, [activeId, messages]);

  // Tell the backend we've seen the admin's messages whenever we're actively viewing the thread
  // (best-effort — a no-op if the backend hasn't implemented this route yet).
  useEffect(() => {
    if (!activeId) return;
    const hasUnreadFromOther = messages.some((item) => item.senderUserId !== userId);
    if (hasUnreadFromOther) markSellerSupportMessagesRead(activeId).catch(() => {});
  }, [activeId, messages, userId]);

  if (!ready) return null;

  const handleSend = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!activeId || (!message.trim() && !attachment)) return;
    setSending(true);
    try {
      const sent = await sendSellerSupportMessage(activeId, message, attachment);
      setMessages((current) => addUnique(current, sent));
      playMessageSound("sent");
      setMessage("");
      setAttachment(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
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

      <div className="flex min-h-[640px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Support Team</h2>
            <p className="text-xs text-slate-500">Admin</p>
          </div>
        </div>

        <div ref={scrollRef} className="flex flex-1 flex-col gap-4 overflow-y-auto bg-[#fcfbfa] p-5">
          {loading || messagesLoading ? (
            <div className="text-sm text-slate-500">Loading messages…</div>
          ) : messages.length === 0 ? (
            <div className="text-sm text-slate-500">
              {messagesUnavailable ? "Message history isn't available from the server right now — you can still send a new message below." : "Send a message to start the conversation."}
            </div>
          ) : (
            messages.map((item) => {
              const mine = item.senderUserId === userId;
              const status = item.readAtUtc || (readUntil && item.createdAtUtc <= readUntil)
                ? "read"
                : confirmedIds.has(item.id)
                  ? "delivered"
                  : "sent";
              return (
                <div key={item.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${mine ? "bg-[#f0563f] text-white" : "bg-white text-slate-700 ring-1 ring-slate-200"}`}>
                    <ChatAttachmentBubble item={item} mine={mine} />
                    {item.message}
                    <div className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${mine ? "text-white/80" : "text-slate-400"}`}>
                      {new Date(item.createdAtUtc).toLocaleTimeString()}
                      {mine && <MessageStatusTicks status={status} className={status === "read" ? "" : "text-white/80"} />}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <form onSubmit={handleSend} className="border-t border-slate-200 p-4">
          {attachment && (
            <div className="mb-2 flex items-center justify-between gap-2 rounded-lg bg-slate-100 px-3 py-1.5 text-xs text-slate-700">
              <span className="truncate">{attachment.name}</span>
              <button type="button" onClick={() => { setAttachment(null); if (fileInputRef.current) fileInputRef.current.value = ""; }} className="shrink-0 rounded p-0.5 hover:bg-slate-200">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
          <div className="flex gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf,.doc,.docx,.txt"
              onChange={(e) => setAttachment(e.target.files?.[0] ?? null)}
              disabled={!activeId}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={!activeId}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-slate-500 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Attach a file or image"
            >
              <Paperclip className="h-4 w-4" />
            </button>
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
      </div>
    </div>
  );
}
