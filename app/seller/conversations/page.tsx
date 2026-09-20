"use client";

import { useEffect, useRef, useState } from "react";
import { createSellerSupportConversation, getSellerSupportConversations, getSellerSupportMessages, markSellerSupportMessagesRead, sendSellerSupportMessage } from "@/lib/api/seller";
import { ApiError } from "@/lib/api/client";
import { getSession } from "@/lib/api/session";
import { watchSupportAgentsPresence } from "@/lib/signalr/supportHub";
import { useChatThread, type ChatApi } from "@/lib/chat/useChatThread";
import { ChatThread } from "@/app/components/ChatThread";
import { useAuthGuard } from "@/lib/api/useAuthGuard";

const sellerChatApi: ChatApi = {
  getMessages: getSellerSupportMessages,
  markRead: markSellerSupportMessagesRead,
  send: sendSellerSupportMessage,
};

export default function SellerConversationsPage() {
  const ready = useAuthGuard("Seller");
  const userId = getSession()?.userId;
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [supportOnline, setSupportOnline] = useState<boolean | null>(null);
  const resolving = useRef(false);

  // Always resolve a real conversation id from the server before sending anything. A seller has a single
  // support thread: reuse the most recent one, and only create one when none exists.
  useEffect(() => {
    if (!ready || !userId || resolving.current) return;
    resolving.current = true;
    (async () => {
      try {
        const items = await getSellerSupportConversations();
        const latest = [...items].sort((a, b) => b.createdAtUtc.localeCompare(a.createdAtUtc))[0];
        const conversation = latest ?? (await createSellerSupportConversation());
        setConversationId(conversation.id);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Failed to load your conversation.");
      } finally {
        setLoading(false);
      }
    })();
  }, [ready, userId]);

  useEffect(() => {
    if (!ready) return;
    return watchSupportAgentsPresence(setSupportOnline);
  }, [ready]);

  const thread = useChatThread({ conversationId, userId, api: sellerChatApi });

  if (!ready) return null;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-slate-500">Inbox</p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Conversations</h1>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="flex min-h-[640px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <ChatThread
          key={conversationId ?? "none"}
          thread={thread}
          userId={userId}
          title="Support Team"
          subtitle="WayFair support"
          online={supportOnline}
          disabledReason={loading ? "Loading conversation…" : !conversationId ? "Conversation unavailable" : undefined}
          emptyText="Send a message to start the conversation."
        />
      </div>
    </div>
  );
}
