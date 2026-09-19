"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ApiError } from "@/lib/api/client";
import type { PagedRequest, PagedResult, SupportMessageDto } from "@/lib/api/types";
import {
  joinConversation,
  leaveConversation,
  onConnectionState,
  onMessageDeleted,
  onMessagesDelivered,
  onMessagesRead,
  onReceiveMessage,
  onReconnected,
  type ConnectionState,
} from "@/lib/signalr/supportHub";
import { playMessageSound } from "@/lib/notificationSound";
import { validateAttachment } from "./attachments";

const PAGE_SIZE = 30;
// Only used while the hub is down; when it's healthy, messages arrive over the socket instead.
const FALLBACK_POLL_MS = 4000;

export type DeliveryStatus = "sending" | "failed" | "sent" | "delivered" | "read";

export interface ChatMessage extends SupportMessageDto {
  localStatus?: "sending" | "failed";
  localError?: string;
  localFile?: { name: string; size: number };
}

export interface ChatApi {
  getMessages: (conversationId: string, request: PagedRequest) => Promise<PagedResult<SupportMessageDto>>;
  markRead: (conversationId: string) => Promise<unknown>;
  send: (conversationId: string, text: string, file?: File | null, replyToMessageId?: string | null) => Promise<SupportMessageDto>;
  remove: (conversationId: string, messageId: string) => Promise<unknown>;
}

// What a deleted message looks like locally: body, attachments and quote are gone, the tombstone stays.
const asDeleted = (m: ChatMessage): ChatMessage => ({ ...m, isDeleted: true, message: "", attachments: null, localFile: undefined });

export function deliveryStatus(message: ChatMessage): DeliveryStatus {
  if (message.localStatus) return message.localStatus;
  if (message.readAtUtc) return "read";
  if (message.deliveredAtUtc) return "delivered";
  return "sent";
}

const byTime = (a: ChatMessage, b: ChatMessage) =>
  a.createdAtUtc === b.createdAtUtc ? a.id.localeCompare(b.id) : a.createdAtUtc.localeCompare(b.createdAtUtc);

// Server copies win over anything we hold for the same id; still-pending local messages are kept.
function mergeMessages(current: ChatMessage[], incoming: ChatMessage[]) {
  const map = new Map<string, ChatMessage>();
  for (const message of current) map.set(message.id, message);
  for (const message of incoming) {
    const existing = map.get(message.id);
    // A push event can race the REST response; never let a stale copy erase read/delivered state.
    map.set(message.id, {
      ...message,
      deliveredAtUtc: message.deliveredAtUtc ?? existing?.deliveredAtUtc ?? null,
      readAtUtc: message.readAtUtc ?? existing?.readAtUtc ?? null,
    });
  }
  return Array.from(map.values()).sort(byTime);
}

const newLocalId = () => `local-${crypto.randomUUID()}`;

/**
 * State machine for one support conversation: paged history (newest first, older on demand), live
 * messages, optimistic sending with retry, and delivered/read receipts. Shared by the admin and seller
 * screens — they only differ in the ChatApi they pass in.
 */
export function useChatThread({ conversationId, userId, api }: { conversationId: string | null; userId: string | undefined; api: ChatApi }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState("");
  const [connection, setConnection] = useState<ConnectionState>("disconnected");
  const [visible, setVisible] = useState(true);

  const nextPageRef = useRef(2);
  const loadingOlderRef = useRef(false);
  const pendingFiles = useRef(new Map<string, File | null>());
  const pendingReplies = useRef(new Map<string, string | null>());
  const apiRef = useRef(api);
  useEffect(() => {
    apiRef.current = api;
  }, [api]);

  useEffect(() => onConnectionState(setConnection), []);

  // A message only counts as "seen" while the tab is actually on screen.
  useEffect(() => {
    const update = () => setVisible(document.visibilityState === "visible");
    update();
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);

  const fetchLatest = useCallback(async (id: string) => {
    const result = await apiRef.current.getMessages(id, { page: 1, pageSize: PAGE_SIZE });
    return result;
  }, []);

  // Initial load + live subscriptions for the open conversation.
  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      setHasMore(false);
      setError("");
      return;
    }
    const id = conversationId;
    let cancelled = false;
    setMessages([]);
    setHasMore(false);
    setError("");
    setLoading(true);
    nextPageRef.current = 2;

    fetchLatest(id)
      .then((result) => {
        if (cancelled) return;
        setMessages((current) => mergeMessages(current, result.items));
        setHasMore(result.page < result.totalPages);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Failed to load messages.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    joinConversation(id).catch(() => {});

    const offReceive = onReceiveMessage((incoming) => {
      if (incoming.conversationId !== id) return;
      setMessages((current) => {
        if (current.some((m) => m.id === incoming.id && !m.localStatus)) return current;
        return mergeMessages(current, [incoming]);
      });
      if (incoming.senderUserId !== userId) playMessageSound("received");
    });

    const offRead = onMessagesRead(({ conversationId: cid, readAtUtc }) => {
      if (cid !== id) return;
      setMessages((current) =>
        current.map((m) => (m.senderUserId === userId && !m.readAtUtc && m.createdAtUtc <= readAtUtc ? { ...m, readAtUtc, deliveredAtUtc: m.deliveredAtUtc ?? readAtUtc } : m)),
      );
    });

    const offDelivered = onMessagesDelivered(({ conversationId: cid, deliveredAtUtc }) => {
      if (cid !== id) return;
      setMessages((current) =>
        current.map((m) => (m.senderUserId === userId && !m.deliveredAtUtc && !m.localStatus && m.createdAtUtc <= deliveredAtUtc ? { ...m, deliveredAtUtc } : m)),
      );
    });

    // Also refresh any quote that points at the deleted message.
    const offDeleted = onMessageDeleted(({ conversationId: cid, messageId }) => {
      if (cid !== id) return;
      setMessages((current) =>
        current.map((m) => {
          if (m.id === messageId) return asDeleted(m);
          if (m.replyTo?.id === messageId) return { ...m, replyTo: { ...m.replyTo, message: "", hasAttachment: false, isDeleted: true } };
          return m;
        }),
      );
    });

    // After a drop we may have missed pushes — pull the newest page and merge it in.
    const offReconnected = onReconnected(() => {
      fetchLatest(id)
        .then((result) => {
          if (!cancelled) setMessages((current) => mergeMessages(current, result.items));
        })
        .catch(() => {});
    });

    return () => {
      cancelled = true;
      offReceive();
      offRead();
      offDelivered();
      offDeleted();
      offReconnected();
      leaveConversation(id).catch(() => {});
    };
  }, [conversationId, userId, fetchLatest]);

  // Degraded mode: poll slowly, only while the socket is down and the tab is visible.
  useEffect(() => {
    if (!conversationId || connection === "connected" || !visible) return;
    const id = conversationId;
    const timer = window.setInterval(() => {
      fetchLatest(id)
        .then((result) => setMessages((current) => mergeMessages(current, result.items)))
        .catch(() => {});
    }, FALLBACK_POLL_MS);
    return () => window.clearInterval(timer);
  }, [conversationId, connection, visible, fetchLatest]);

  // Mark the other side's messages read while the thread is open and on screen.
  const hasUnreadFromOther = useMemo(
    () => messages.some((m) => m.senderUserId !== userId && !m.readAtUtc && !m.localStatus),
    [messages, userId],
  );
  useEffect(() => {
    if (!conversationId || !visible || !hasUnreadFromOther) return;
    const readAt = new Date().toISOString();
    apiRef.current.markRead(conversationId).catch(() => {});
    setMessages((current) =>
      current.map((m) => (m.senderUserId !== userId && !m.readAtUtc && !m.localStatus ? { ...m, readAtUtc: readAt } : m)),
    );
  }, [conversationId, visible, hasUnreadFromOther, userId]);

  const loadOlder = useCallback(async () => {
    if (!conversationId || loadingOlderRef.current || !hasMore) return;
    loadingOlderRef.current = true;
    setLoadingOlder(true);
    try {
      const result = await apiRef.current.getMessages(conversationId, { page: nextPageRef.current, pageSize: PAGE_SIZE });
      nextPageRef.current = result.page + 1;
      setMessages((current) => mergeMessages(current, result.items));
      setHasMore(result.page < result.totalPages);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load earlier messages.");
    } finally {
      loadingOlderRef.current = false;
      setLoadingOlder(false);
    }
  }, [conversationId, hasMore]);

  const transmit = useCallback(
    async (localId: string, text: string, file: File | null) => {
      if (!conversationId) return;
      try {
        const sent = await apiRef.current.send(conversationId, text, file, pendingReplies.current.get(localId) ?? null);
        pendingFiles.current.delete(localId);
        pendingReplies.current.delete(localId);
        setMessages((current) => mergeMessages(current.filter((m) => m.id !== localId), [sent]));
      } catch (err) {
        const reason = err instanceof ApiError ? err.errors[0] ?? err.message : "Couldn't send this message.";
        setMessages((current) => current.map((m) => (m.id === localId ? { ...m, localStatus: "failed", localError: reason } : m)));
      }
    },
    [conversationId],
  );

  /** Optimistically appends the message and sends it. Returns a validation error, or null on success. */
  const send = useCallback(
    (text: string, file: File | null, replyTo?: ChatMessage | null): string | null => {
      if (!conversationId || !userId) return "Conversation isn't ready yet.";
      const trimmed = text.trim();
      if (!trimmed && !file) return null;
      if (file) {
        const problem = validateAttachment(file);
        if (problem) return problem;
      }
      const localId = newLocalId();
      pendingFiles.current.set(localId, file);
      pendingReplies.current.set(localId, replyTo?.id ?? null);
      const optimistic: ChatMessage = {
        replyTo: replyTo
          ? {
              id: replyTo.id,
              senderUserId: replyTo.senderUserId,
              message: replyTo.message.slice(0, 140),
              hasAttachment: !!replyTo.attachments?.length || !!replyTo.localFile,
              isDeleted: !!replyTo.isDeleted,
            }
          : null,
        id: localId,
        conversationId,
        senderUserId: userId,
        message: trimmed,
        createdAtUtc: new Date().toISOString(),
        localStatus: "sending",
        localFile: file ? { name: file.name, size: file.size } : undefined,
      };
      setMessages((current) => mergeMessages(current, [optimistic]));
      playMessageSound("sent");
      void transmit(localId, trimmed, file);
      return null;
    },
    [conversationId, userId, transmit],
  );

  const retry = useCallback(
    (localId: string) => {
      const target = messages.find((m) => m.id === localId);
      if (!target) return;
      setMessages((current) => current.map((m) => (m.id === localId ? { ...m, localStatus: "sending", localError: undefined } : m)));
      void transmit(localId, target.message, pendingFiles.current.get(localId) ?? null);
    },
    [messages, transmit],
  );

  const discard = useCallback((localId: string) => {
    pendingFiles.current.delete(localId);
    pendingReplies.current.delete(localId);
    setMessages((current) => current.filter((m) => m.id !== localId));
  }, []);

  /** "Delete for everyone". Optimistic; restores the message and returns an error string if the server refuses. */
  const deleteMessage = useCallback(
    async (messageId: string): Promise<string | null> => {
      if (!conversationId) return "Conversation isn't ready yet.";
      const original = messages.find((m) => m.id === messageId);
      if (!original) return null;
      setMessages((current) => current.map((m) => (m.id === messageId ? asDeleted(m) : m)));
      try {
        await apiRef.current.remove(conversationId, messageId);
        return null;
      } catch (err) {
        setMessages((current) => current.map((m) => (m.id === messageId ? original : m)));
        return err instanceof ApiError ? err.errors[0] ?? err.message : "Couldn't delete this message.";
      }
    },
    [conversationId, messages],
  );

  return { messages, loading, loadingOlder, hasMore, error, connection, loadOlder, send, retry, discard, deleteMessage };
}
