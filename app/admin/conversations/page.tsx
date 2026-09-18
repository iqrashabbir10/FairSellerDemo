"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Plus, Search, SendHorizontal, X } from "lucide-react";
import { getAdminSellers, getAdminSupportConversations, getAdminSupportMessages, sendAdminSupportMessage } from "@/lib/api/admin";
import { ApiError } from "@/lib/api/client";
import { getSession } from "@/lib/api/session";
import { joinConversation, leaveConversation, onConversationStarted, onNewMessage, onReceiveMessage, onReconnected } from "@/lib/signalr/supportHub";
import { playMessageSound } from "@/lib/notificationSound";
import type { AdminSellerDto, SupportConversationSummaryDto, SupportMessageDto } from "@/lib/api/types";
import { useAuthGuard } from "@/lib/api/useAuthGuard";

function addUnique(current: SupportMessageDto[], incoming: SupportMessageDto) {
  if (current.some((message) => message.id === incoming.id)) return current;
  return [...current, incoming];
}

export default function AdminConversationsPage() {
  const ready = useAuthGuard("Admin");
  const [conversations, setConversations] = useState<SupportConversationSummaryDto[]>([]);
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [unreadIds, setUnreadIds] = useState<Set<string>>(new Set());
  const [messages, setMessages] = useState<SupportMessageDto[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesUnavailable, setMessagesUnavailable] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [sellers, setSellers] = useState<AdminSellerDto[]>([]);
  const [sellerNotice, setSellerNotice] = useState("");
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeSearch, setComposeSearch] = useState("");
  const activeIdRef = useRef<string | null>(null);
  const userId = getSession()?.userId;

  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  const refetchConversations = useCallback(async () => {
    setConversationsLoading(true);
    try {
      const items = await getAdminSupportConversations();
      setConversations(items);
      setError("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load conversations.");
    } finally {
      setConversationsLoading(false);
    }
  }, []);

  // Hydrate the inbox on mount (required — SignalR has no history), then re-hydrate whenever the
  // tab regains focus or the hub recovers from a dropped connection.
  useEffect(() => {
    if (!ready) return;
    refetchConversations();

    (async () => {
      try {
        const result = await getAdminSellers({ pageSize: 200 });
        setSellers(result.items);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Failed to load sellers.");
      }
    })();

    const onFocus = () => refetchConversations();
    window.addEventListener("focus", onFocus);
    const unsubscribeReconnected = onReconnected(() => refetchConversations());

    return () => {
      window.removeEventListener("focus", onFocus);
      unsubscribeReconnected();
    };
  }, [ready, refetchConversations]);

  // Admins auto-join a server-side "admins" group, so these arrive without JoinConversation per
  // thread. A brand new conversation (or one we don't have cached yet) re-hydrates the whole list
  // so we always show the real seller/shop name instead of a placeholder.
  useEffect(() => {
    if (!ready) return;

    const unsubscribeStarted = onConversationStarted(() => {
      refetchConversations();
    });

    const unsubscribeNew = onNewMessage((incoming) => {
      const isActive = activeIdRef.current === incoming.conversationId;
      let found = false;
      setConversations((current) => {
        const existing = current.find((entry) => entry.id === incoming.conversationId);
        if (!existing) return current;
        found = true;
        const rest = current.filter((entry) => entry.id !== incoming.conversationId);
        return [{ ...existing, lastMessage: incoming.message, lastMessageAtUtc: incoming.createdAtUtc }, ...rest];
      });
      if (!found) refetchConversations();
      if (!isActive) {
        setUnreadIds((current) => new Set(current).add(incoming.conversationId));
        if (incoming.senderUserId !== userId) playMessageSound("received");
      }
    });

    return () => {
      unsubscribeStarted();
      unsubscribeNew();
    };
  }, [ready, userId, refetchConversations]);

  // Join the open conversation's hub group, load its history, and listen for live messages.
  // Also polls every few seconds as a fallback while the SignalR hub is unreachable, so a
  // seller's reply still shows up without a manual refresh.
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
        const result = await getAdminSupportMessages(activeId, { pageSize: 100 });
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

  const openConversation = (id: string) => {
    setActiveId(id);
    setSellerNotice("");
    setUnreadIds((current) => {
      if (!current.has(id)) return current;
      const next = new Set(current);
      next.delete(id);
      return next;
    });
  };

  const selectSeller = (sellerId: string) => {
    setSellerNotice("");
    setComposeOpen(false);
    setComposeSearch("");
    const match = conversations.find((entry) => entry.sellerId === sellerId);
    if (match) {
      openConversation(match.id);
    } else {
      setActiveId(null);
      const seller = sellers.find((s) => s.id === sellerId);
      setSellerNotice(`${seller?.fullName ?? "This seller"} hasn't started a conversation yet — admins can only reply once a seller messages first.`);
    }
  };

  const filteredSellers = sellers.filter((seller) => {
    const query = composeSearch.trim().toLowerCase();
    if (!query) return true;
    return seller.fullName.toLowerCase().includes(query) || seller.email.toLowerCase().includes(query);
  });

  const handleSend = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!activeId || !message.trim()) return;
    setSending(true);
    try {
      const sent = await sendAdminSupportMessage(activeId, message);
      setMessages((current) => addUnique(current, sent));
      playMessageSound("sent");
      setMessage("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  const activeConversation = conversations.find((entry) => entry.id === activeId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">Inbox</p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Conversations</h1>
        </div>
        <div className="relative">
          <button
            onClick={() => setComposeOpen((open) => !open)}
            className="inline-flex items-center gap-2 rounded-xl bg-[#f0563f] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#dc4b34]"
          >
            <Plus className="h-4 w-4" />
            New chat
          </button>
          {composeOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setComposeOpen(false)} />
              <div className="absolute right-0 z-20 mt-2 w-80 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
                <div className="flex items-center justify-between gap-2 pb-2">
                  <span className="text-sm font-medium text-slate-700">Start a chat</span>
                  <button onClick={() => setComposeOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="relative mb-2">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    autoFocus
                    value={composeSearch}
                    onChange={(e) => setComposeSearch(e.target.value)}
                    placeholder="Search sellers"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-700 outline-none focus:border-[#f0563f] focus:bg-white"
                  />
                </div>
                <div className="max-h-72 space-y-1 overflow-y-auto">
                  {filteredSellers.length === 0 ? (
                    <div className="p-3 text-center text-sm text-slate-500">No sellers match.</div>
                  ) : (
                    filteredSellers.map((seller) => (
                      <button
                        key={seller.id}
                        onClick={() => selectSeller(seller.id)}
                        className="w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-slate-50"
                      >
                        <div className="font-medium text-slate-800">{seller.fullName}</div>
                        <div className="text-xs text-slate-500">{seller.email}</div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {sellerNotice && <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">{sellerNotice}</div>}
      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="grid min-h-[640px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:grid-cols-[320px_1fr]">
        <aside className="border-b border-slate-200 bg-slate-50 lg:border-b-0 lg:border-r">
          <div className="border-b border-slate-200 px-4 py-3 text-sm font-medium text-slate-700">Recent threads</div>
          <div className="space-y-2 p-3">
            {conversationsLoading ? (
              <div className="p-3 text-sm text-slate-500">Loading…</div>
            ) : conversations.length === 0 ? (
              <div className="p-3 text-sm text-slate-500">No conversations yet.</div>
            ) : (
              conversations.map((thread) => (
                <button
                  key={thread.id}
                  onClick={() => openConversation(thread.id)}
                  className={`w-full rounded-xl border p-3 text-left transition ${
                    thread.id === activeId ? "border-[#f0563f] bg-white shadow-sm" : "border-transparent bg-transparent hover:bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-medium text-slate-800">{thread.sellerName}</div>
                    {unreadIds.has(thread.id) && <span className="h-2 w-2 shrink-0 rounded-full bg-[#f0563f]" />}
                  </div>
                  <div className="text-xs text-slate-500">{thread.shopName}</div>
                  <div className="mt-2 line-clamp-2 text-sm text-slate-600">{thread.lastMessage ?? "No messages yet"}</div>
                  <div className="mt-1 text-xs text-slate-400">{new Date(thread.lastMessageAtUtc ?? thread.createdAtUtc).toLocaleString()}</div>
                </button>
              ))
            )}
          </div>
        </aside>

        <section className="flex min-h-[500px] flex-col">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                {activeConversation ? activeConversation.sellerName : "Select a conversation"}
              </h2>
              <p className="text-xs text-slate-500">{activeConversation?.shopName ?? "Seller"}</p>
            </div>
          </div>

          <div ref={scrollRef} className="flex flex-1 flex-col gap-4 overflow-y-auto bg-[#fcfbfa] p-5">
            {!activeId ? (
              <div className="text-sm text-slate-500">Pick a conversation from the list to view messages.</div>
            ) : messagesLoading ? (
              <div className="text-sm text-slate-500">Loading messages…</div>
            ) : messages.length === 0 ? (
              <div className="text-sm text-slate-500">
                {messagesUnavailable ? "Message history isn't available from the server right now — you can still send a new message below." : "No messages yet."}
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
                placeholder={activeId ? "Type a message" : "Select a conversation first"}
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
