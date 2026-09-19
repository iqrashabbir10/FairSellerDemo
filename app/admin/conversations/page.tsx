"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { deleteAdminSupportMessage, getAdminSupportConversations, getAdminSupportMessages, markAdminSupportMessagesRead, sendAdminSupportMessage } from "@/lib/api/admin";
import { ApiError } from "@/lib/api/client";
import { getSession } from "@/lib/api/session";
import { onConversationStarted, onNewMessage, onReconnected, watchSellerPresence } from "@/lib/signalr/supportHub";
import { playMessageSound } from "@/lib/notificationSound";
import { useChatThread, type ChatApi } from "@/lib/chat/useChatThread";
import { ChatThread } from "@/app/components/ChatThread";
import type { SupportConversationSummaryDto } from "@/lib/api/types";
import { useAuthGuard } from "@/lib/api/useAuthGuard";

const LIST_PAGE_SIZE = 25;

const adminChatApi: ChatApi = {
  getMessages: getAdminSupportMessages,
  markRead: markAdminSupportMessagesRead,
  send: sendAdminSupportMessage,
  remove: deleteAdminSupportMessage,
};

function formatListTime(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

// Page-1 results replace matching rows and lead the list; anything the admin already scrolled to stays.
function mergeFirstPage(current: SupportConversationSummaryDto[], firstPage: SupportConversationSummaryDto[]) {
  const ids = new Set(firstPage.map((c) => c.id));
  return [...firstPage, ...current.filter((c) => !ids.has(c.id))];
}

export default function AdminConversationsPage() {
  const ready = useAuthGuard("Admin");
  const userId = getSession()?.userId;

  const [conversations, setConversations] = useState<SupportConversationSummaryDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [nextPage, setNextPage] = useState(2);
  const [listLoading, setListLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [listError, setListError] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [sellerOnline, setSellerOnline] = useState<boolean | null>(null);

  const activeIdRef = useRef<string | null>(null);
  const searchRef = useRef("");
  const conversationsRef = useRef<SupportConversationSummaryDto[]>([]);
  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);
  useEffect(() => {
    searchRef.current = search;
  }, [search]);
  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  // Debounce so typing doesn't fire a request per keystroke.
  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const loadFirstPage = useCallback(async (mode: "replace" | "merge") => {
    try {
      const result = await getAdminSupportConversations({ page: 1, pageSize: LIST_PAGE_SIZE, search: searchRef.current || undefined });
      setConversations((current) => (mode === "merge" ? mergeFirstPage(current, result.items) : result.items));
      setTotalCount(result.totalCount);
      if (mode === "replace") setNextPage(2);
      setListError("");
    } catch (err) {
      setListError(err instanceof ApiError ? err.message : "Failed to load conversations.");
    } finally {
      setListLoading(false);
    }
  }, []);

  // A new search term restarts the list.
  useEffect(() => {
    if (!ready) return;
    setListLoading(true);
    loadFirstPage("replace");
  }, [ready, search, loadFirstPage]);

  const loadMore = async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    try {
      const result = await getAdminSupportConversations({ page: nextPage, pageSize: LIST_PAGE_SIZE, search: search || undefined });
      setConversations((current) => {
        const ids = new Set(current.map((c) => c.id));
        return [...current, ...result.items.filter((c) => !ids.has(c.id))];
      });
      setNextPage(result.page + 1);
      setTotalCount(result.totalCount);
    } catch (err) {
      setListError(err instanceof ApiError ? err.message : "Failed to load more conversations.");
    } finally {
      setLoadingMore(false);
    }
  };

  // Live inbox updates. Admins are in a server-side "admins" group, so these arrive without joining each thread.
  useEffect(() => {
    if (!ready) return;

    const offStarted = onConversationStarted(() => loadFirstPage("merge"));

    const offNew = onNewMessage((incoming) => {
      const isActive = activeIdRef.current === incoming.conversationId;
      const fromOther = incoming.senderUserId !== userId;
      const known = conversationsRef.current.some((c) => c.id === incoming.conversationId);
      setConversations((current) => {
        const existing = current.find((c) => c.id === incoming.conversationId);
        if (!existing) return current;
        const rest = current.filter((c) => c.id !== incoming.conversationId);
        const preview = incoming.message || (incoming.attachments?.length ? "📎 Attachment" : existing.lastMessage);
        return [
          {
            ...existing,
            lastMessage: preview,
            lastMessageAtUtc: incoming.createdAtUtc,
            unreadCount: !isActive && fromOther ? existing.unreadCount + 1 : existing.unreadCount,
          },
          ...rest,
        ];
      });
      // A thread we haven't loaded yet (or that isn't in the searched subset) — fetch fresh state.
      if (!known) loadFirstPage("merge");
      if (!isActive && fromOther) playMessageSound("received");
    });

    const refresh = () => loadFirstPage("merge");
    const offReconnected = onReconnected(refresh);
    const onVisible = () => document.visibilityState === "visible" && refresh();
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      offStarted();
      offNew();
      offReconnected();
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [ready, userId, loadFirstPage]);

  const active = conversations.find((c) => c.id === activeId) ?? null;
  const activeSellerUserId = active?.sellerUserId;

  useEffect(() => {
    if (!activeSellerUserId) {
      setSellerOnline(null);
      return;
    }
    return watchSellerPresence(activeSellerUserId, setSellerOnline);
  }, [activeSellerUserId]);

  const thread = useChatThread({ conversationId: activeId, userId, api: adminChatApi });

  const openConversation = (id: string) => {
    setActiveId(id);
    setConversations((current) => current.map((c) => (c.id === id && c.unreadCount ? { ...c, unreadCount: 0 } : c)));
  };

  // Once the thread has marked messages read, keep the list preview in step with the open conversation.
  const lastMessage = thread.messages[thread.messages.length - 1];
  useEffect(() => {
    if (!activeId || !lastMessage || lastMessage.localStatus) return;
    setConversations((current) =>
      current.map((c) =>
        c.id === activeId && c.lastMessageAtUtc !== lastMessage.createdAtUtc
          ? { ...c, lastMessage: lastMessage.message || (lastMessage.attachments?.length ? "📎 Attachment" : c.lastMessage), lastMessageAtUtc: lastMessage.createdAtUtc }
          : c,
      ),
    );
  }, [activeId, lastMessage]);

  if (!ready) return null;

  const hasMore = conversations.length < totalCount;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-slate-500">Inbox</p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Conversations</h1>
      </div>

      {listError && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{listError}</div>}

      <div className="grid min-h-[640px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:grid-cols-[340px_1fr]">
        <aside className={`flex-col border-b border-slate-200 bg-slate-50 lg:flex lg:border-b-0 lg:border-r ${activeId ? "hidden" : "flex"}`}>
          <div className="border-b border-slate-200 p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search sellers or shops"
                aria-label="Search conversations"
                className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 outline-none focus:border-[var(--brand)]"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 lg:max-h-[640px]">
            {listLoading ? (
              <div className="space-y-2 p-1" aria-hidden>
                {Array.from({ length: 6 }, (_, i) => (
                  <div key={i} className="h-[74px] animate-pulse rounded-xl bg-slate-200/70" />
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-4 text-center text-sm text-slate-500">
                {search ? "No conversations match your search." : "No conversations yet. They appear here when a seller messages support."}
              </div>
            ) : (
              <ul className="space-y-1">
                {conversations.map((thread) => {
                  const selected = thread.id === activeId;
                  return (
                    <li key={thread.id}>
                      <button
                        onClick={() => openConversation(thread.id)}
                        aria-current={selected}
                        className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition ${selected ? "border-[var(--brand)] bg-white shadow-sm" : "border-transparent hover:bg-white"}`}
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--brand)]/10 text-sm font-semibold text-[var(--brand)]">
                          {(thread.sellerName || thread.shopName).slice(0, 2).toUpperCase()}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center justify-between gap-2">
                            <span className={`truncate text-sm ${thread.unreadCount ? "font-semibold text-slate-900" : "font-medium text-slate-800"}`}>{thread.sellerName}</span>
                            <span className={`shrink-0 text-[11px] ${thread.unreadCount ? "font-semibold text-[var(--brand)]" : "text-slate-400"}`}>
                              {formatListTime(thread.lastMessageAtUtc ?? thread.createdAtUtc)}
                            </span>
                          </span>
                          <span className="block truncate text-xs text-slate-500">{thread.shopName}</span>
                          <span className="mt-1 flex items-center justify-between gap-2">
                            <span className={`flex min-w-0 items-center gap-1 text-sm ${thread.unreadCount ? "text-slate-700" : "text-slate-500"}`}>
                              {thread.lastMessage ? <span className="truncate">{thread.lastMessage}</span> : <span className="italic text-slate-400">No messages yet</span>}
                            </span>
                            {thread.unreadCount > 0 && (
                              <span className="inline-flex min-w-5 shrink-0 items-center justify-center rounded-full bg-[var(--brand)] px-1.5 py-0.5 text-[11px] font-semibold text-white" aria-label={`${thread.unreadCount} unread`}>
                                {thread.unreadCount > 99 ? "99+" : thread.unreadCount}
                              </span>
                            )}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            {hasMore && !listLoading && (
              <button onClick={loadMore} disabled={loadingMore} className="mt-2 w-full rounded-xl border border-slate-200 bg-white py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-60">
                {loadingMore ? "Loading…" : `Load more (${totalCount - conversations.length} left)`}
              </button>
            )}
          </div>
        </aside>

        <div className={`min-w-0 flex-col lg:flex ${activeId ? "flex" : "hidden"}`}>
          {active ? (
            <ChatThread
              key={active.id}
              thread={thread}
              userId={userId}
              title={active.sellerName}
              subtitle={active.shopName}
              online={sellerOnline}
              onBack={() => setActiveId(null)}
              emptyText="No messages yet. Send the first one below."
            />
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center text-slate-500">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                <Search className="h-6 w-6" />
              </span>
              <div className="text-base font-medium text-slate-700">Select a conversation</div>
              <p className="text-sm">Pick a seller from the list to read and reply to their messages.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
