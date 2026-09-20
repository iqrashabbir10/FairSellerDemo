"use client";

import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowLeft, Ban, Paperclip, Reply, RotateCcw, SendHorizontal, Trash2, WifiOff, X } from "lucide-react";
import type { ReplyPreviewDto } from "@/lib/api/types";
import { ATTACHMENT_ACCEPT, MAX_ATTACHMENT_BYTES, formatBytes, validateAttachment } from "@/lib/chat/attachments";
import { deliveryStatus, type ChatMessage, type useChatThread } from "@/lib/chat/useChatThread";
import { ChatAttachmentBubble } from "./ChatAttachmentBubble";
import { MessageStatusTicks } from "./MessageStatusTicks";

const MAX_LENGTH = 4000;
const NEAR_BOTTOM_PX = 96;

type Thread = ReturnType<typeof useChatThread>;

const formatTime = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

function dayLabel(iso: string) {
  const date = new Date(iso);
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round((startOfDay(new Date()) - startOfDay(date)) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: date.getFullYear() === new Date().getFullYear() ? undefined : "numeric" });
}

// Quoted message shown at the top of a reply; clicking it scrolls to (and flashes) the original.
function QuoteBlock({ reply, mine, userId, title, onJump }: { reply: ReplyPreviewDto; mine: boolean; userId: string | undefined; title: string; onJump: (id: string) => void }) {
  const who = reply.senderUserId === userId ? "You" : title;
  const body = reply.isDeleted ? "This message was deleted" : reply.message || (reply.hasAttachment ? "📎 Attachment" : "");
  return (
    <button
      type="button"
      onClick={() => onJump(reply.id)}
      className={`mb-1.5 block w-full rounded-lg border-l-4 px-2.5 py-1.5 text-left text-xs ${mine ? "border-white/70 bg-white/15 text-white" : "border-[var(--brand)] bg-slate-100 text-slate-600"}`}
    >
      <span className={`block truncate font-semibold ${mine ? "text-white" : "text-[var(--brand)]"}`}>{who}</span>
      <span className={`line-clamp-2 break-words ${reply.isDeleted ? "italic opacity-80" : ""}`}>{body}</span>
    </button>
  );
}

const Bubble = memo(function Bubble({
  item,
  mine,
  userId,
  title,
  onRetry,
  onDiscard,
  onReply,
  onJump,
}: {
  item: ChatMessage;
  mine: boolean;
  userId: string | undefined;
  title: string;
  onRetry: (id: string) => void;
  onDiscard: (id: string) => void;
  onReply: (item: ChatMessage) => void;
  onJump: (id: string) => void;
}) {
  const status = deliveryStatus(item);
  const persisted = !item.localStatus;

  if (item.isDeleted) {
    return (
      <div id={`msg-${item.id}`} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
        <div className="flex max-w-[80%] items-center gap-1.5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-3.5 py-2 text-sm italic text-slate-400 sm:max-w-[70%]">
          <Ban className="h-3.5 w-3.5 shrink-0" />
          This message was deleted
          <span className="ml-1 text-[10px] not-italic">{formatTime(item.createdAtUtc)}</span>
        </div>
      </div>
    );
  }

  const actions = persisted && (
    <div className="flex shrink-0 items-center gap-0.5 self-center opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100">
      <button type="button" onClick={() => onReply(item)} title="Reply" aria-label="Reply to this message" className="rounded-full p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700">
        <Reply className="h-3.5 w-3.5" />
      </button>
    </div>
  );

  return (
    <div id={`msg-${item.id}`} className={`group flex items-start gap-1 rounded-xl transition-colors ${mine ? "justify-end" : "justify-start"}`}>
      {mine && actions}
      <div className="max-w-[80%] sm:max-w-[70%]">
        <div className={`rounded-2xl px-3.5 py-2 text-sm ${mine ? "rounded-br-md bg-[var(--brand)] text-white" : "rounded-bl-md bg-white text-slate-700 ring-1 ring-slate-200"} ${status === "failed" ? "opacity-80" : ""}`}>
          {item.replyTo && <QuoteBlock reply={item.replyTo} mine={mine} userId={userId} title={title} onJump={onJump} />}
          <ChatAttachmentBubble item={item} mine={mine} />
          {item.message && <p className="whitespace-pre-wrap break-words">{item.message}</p>}
          <div className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${mine ? "text-white/80" : "text-slate-400"}`}>
            {formatTime(item.createdAtUtc)}
            {mine && <MessageStatusTicks status={status} className="text-white/80" />}
          </div>
        </div>
        {status === "failed" && (
          <div className="mt-1 flex flex-wrap items-center justify-end gap-2 text-xs text-red-600">
            <span>{item.localError ?? "Couldn't send."}</span>
            <button onClick={() => onRetry(item.id)} className="inline-flex items-center gap-1 font-semibold hover:underline">
              <RotateCcw className="h-3 w-3" /> Retry
            </button>
            <button onClick={() => onDiscard(item.id)} className="inline-flex items-center gap-1 font-semibold text-slate-500 hover:underline">
              <Trash2 className="h-3 w-3" /> Discard
            </button>
          </div>
        )}
      </div>
      {!mine && actions}
    </div>
  );
});

export function ChatThread({
  thread,
  userId,
  title,
  subtitle,
  online,
  disabledReason,
  emptyText = "No messages yet. Say hello 👋",
  onBack,
}: {
  thread: Thread;
  userId: string | undefined;
  title: string;
  subtitle?: string;
  /** null = unknown / not tracked. */
  online?: boolean | null;
  /** When set the composer is disabled and shows this text. */
  disabledReason?: string;
  emptyText?: string;
  onBack?: () => void;
}) {
  const { messages, loading, loadingOlder, hasMore, error, connection, loadOlder, send, retry, discard } = thread;

  const scrollRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);
  const prevSnapshot = useRef<{ first?: string; last?: string; height: number }>({ height: 0 });
  const [unseenBelow, setUnseenBelow] = useState(0);

  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [composeError, setComposeError] = useState("");
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);

  const startReply = useCallback((item: ChatMessage) => {
    setReplyTo(item);
    requestAnimationFrame(() => textareaRef.current?.focus());
  }, []);

  // Scrolls to the quoted message and flashes it. If it's in older history that isn't loaded yet, say so
  // rather than silently doing nothing.
  const jumpTo = useCallback((id: string) => {
    const el = document.getElementById(`msg-${id}`);
    if (!el) {
      setComposeError("That message is in older history. Scroll up and load earlier messages to see it.");
      return;
    }
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("bg-[var(--brand)]/15");
    window.setTimeout(() => el.classList.remove("bg-[var(--brand)]/15"), 1400);
  }, []);

  const scrollToBottom = useCallback((smooth = false) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
    setUnseenBelow(0);
  }, []);

  // Keep the viewport sensible as the list changes: stay pinned to the newest message, keep the reading
  // position when older history is prepended, and count new messages that arrive while scrolled up.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const prev = prevSnapshot.current;
    const first = messages[0]?.id;
    const last = messages[messages.length - 1]?.id;

    if (prev.first === undefined) {
      scrollToBottom();
    } else if (first !== prev.first && last === prev.last) {
      el.scrollTop += el.scrollHeight - prev.height; // older messages were prepended
    } else if (last !== prev.last) {
      const mine = messages[messages.length - 1]?.senderUserId === userId;
      if (stickToBottom.current || mine) scrollToBottom(true);
      else setUnseenBelow((n) => n + 1);
    }
    prevSnapshot.current = { first, last, height: el.scrollHeight };
  }, [messages, userId, scrollToBottom]);

  // Pages render this with key={conversationId}, so switching conversations remounts it fresh (pinned to the
  // bottom, empty composer).

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_PX;
    if (stickToBottom.current) setUnseenBelow(0);
  };

  // Load older history when the top sentinel scrolls into view.
  const topRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const target = topRef.current;
    if (!target || !hasMore) return;
    const observer = new IntersectionObserver(([entry]) => entry.isIntersecting && loadOlder(), { root: scrollRef.current, rootMargin: "120px" });
    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMore, loadOlder, messages.length]);

  const autosize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  };

  const pickFile = (candidate: File | null | undefined) => {
    if (!candidate) return;
    const problem = validateAttachment(candidate);
    if (problem) {
      setComposeError(problem);
      return;
    }
    setComposeError("");
    setFile(candidate);
  };

  const submit = () => {
    if (disabledReason) return;
    const problem = send(text, file, replyTo);
    if (problem) {
      setComposeError(problem);
      return;
    }
    setReplyTo(null);
    setText("");
    setFile(null);
    setComposeError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    requestAnimationFrame(autosize);
  };

  // Group by day so long histories stay scannable.
  const rows = useMemo(() => {
    const out: ({ type: "day"; key: string; label: string } | { type: "msg"; key: string; item: ChatMessage })[] = [];
    let lastDay = "";
    for (const item of messages) {
      const label = dayLabel(item.createdAtUtc);
      const dayKey = new Date(item.createdAtUtc).toDateString();
      if (dayKey !== lastDay) {
        out.push({ type: "day", key: `day-${dayKey}`, label });
        lastDay = dayKey;
      }
      out.push({ type: "msg", key: item.id, item });
    }
    return out;
  }, [messages]);

  return (
    <section
      className="relative flex min-h-[520px] flex-1 flex-col"
      onDragOver={(e) => {
        if (disabledReason) return;
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={(e) => {
        if (e.currentTarget === e.target) setDragging(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        if (!disabledReason) pickFile(e.dataTransfer.files?.[0]);
      }}
    >
      <header className="flex items-center gap-3 border-b border-slate-200 px-4 py-3 sm:px-5 sm:py-4">
        {onBack && (
          <button onClick={onBack} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden" aria-label="Back to conversations">
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
        <div className="relative shrink-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--brand)]/10 text-sm font-semibold text-[var(--brand)]">
            {title.slice(0, 2).toUpperCase()}
          </div>
          {/* WhatsApp-style presence dot on the avatar */}
          {online !== undefined && online !== null && (
            <span
              className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white ${online ? "bg-emerald-500" : "bg-slate-300"}`}
              aria-label={online ? "Online" : "Offline"}
            />
          )}
        </div>
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold text-slate-900">{title}</h2>
          <p className="flex items-center gap-1.5 truncate text-xs text-slate-500">
            {online !== undefined && online !== null && (
              <>
                <span className={`h-2 w-2 shrink-0 rounded-full ${online ? "bg-emerald-500" : "bg-slate-300"}`} />
                <span className={online ? "text-emerald-600" : ""}>{online ? "Online" : "Offline"}</span>
                {subtitle && <span aria-hidden>·</span>}
              </>
            )}
            {subtitle && <span className="truncate">{subtitle}</span>}
          </p>
        </div>
      </header>

      {connection !== "connected" && (
        <div className="flex items-center gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800" role="status">
          <WifiOff className="h-3.5 w-3.5" />
          {connection === "reconnecting" ? "Reconnecting… new messages may be delayed." : "You're offline. Messages will sync once you're back online."}
        </div>
      )}

      <div className="relative flex-1 overflow-hidden bg-[#fcfbfa]">
        <div ref={scrollRef} onScroll={onScroll} role="log" aria-live="polite" aria-label="Messages" className="absolute inset-0 space-y-3 overflow-y-auto p-4 sm:p-5">
          {hasMore && (
            <div ref={topRef} className="flex justify-center py-1">
              <button onClick={loadOlder} disabled={loadingOlder} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-sm hover:bg-slate-50 disabled:opacity-60">
                {loadingOlder ? "Loading…" : "Load earlier messages"}
              </button>
            </div>
          )}

          {loading ? (
            <div className="space-y-3" aria-hidden>
              {[60, 40, 70, 45].map((w, i) => (
                <div key={i} className={`flex ${i % 2 ? "justify-end" : "justify-start"}`}>
                  <div className="h-10 animate-pulse rounded-2xl bg-slate-200/70" style={{ width: `${w}%` }} />
                </div>
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-full min-h-[200px] items-center justify-center text-sm text-slate-500">{error || emptyText}</div>
          ) : (
            rows.map((row) =>
              row.type === "day" ? (
                <div key={row.key} className="flex justify-center py-1">
                  <span className="rounded-full bg-slate-200/70 px-3 py-0.5 text-[11px] font-medium text-slate-600">{row.label}</span>
                </div>
              ) : (
                <Bubble
                  key={row.key}
                  item={row.item}
                  mine={row.item.senderUserId === userId}
                  userId={userId}
                  title={title}
                  onRetry={retry}
                  onDiscard={discard}
                  onReply={startReply}
                  onJump={jumpTo}
                />
              )
            )
          )}
          {error && messages.length > 0 && <div className="rounded-lg bg-red-50 px-3 py-2 text-center text-xs text-red-700">{error}</div>}
        </div>

        {unseenBelow > 0 && (
          <button
            onClick={() => scrollToBottom(true)}
            className="absolute bottom-3 right-4 inline-flex items-center gap-1.5 rounded-full bg-[var(--brand)] px-3 py-1.5 text-xs font-semibold text-white shadow-lg hover:bg-[var(--brand-hover)]"
          >
            <ArrowDown className="h-3.5 w-3.5" />
            {unseenBelow} new message{unseenBelow === 1 ? "" : "s"}
          </button>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="border-t border-slate-200 bg-white p-3 sm:p-4"
      >
        {replyTo && (
          <div className="mb-2 flex items-center justify-between gap-2 rounded-lg border-l-4 border-[var(--brand)] bg-slate-100 px-3 py-1.5 text-xs text-slate-600">
            <span className="min-w-0">
              <span className="block font-semibold text-[var(--brand)]">Replying to {replyTo.senderUserId === userId ? "yourself" : title}</span>
              <span className="block truncate">{replyTo.message || (replyTo.attachments?.length ? "📎 Attachment" : "")}</span>
            </span>
            <button type="button" onClick={() => setReplyTo(null)} className="shrink-0 rounded p-0.5 hover:bg-slate-200" aria-label="Cancel reply">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
        {file && (
          <div className="mb-2 flex items-center justify-between gap-2 rounded-lg bg-slate-100 px-3 py-1.5 text-xs text-slate-700">
            <span className="flex min-w-0 items-center gap-2">
              <Paperclip className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{file.name}</span>
              <span className="shrink-0 text-slate-500">{formatBytes(file.size)}</span>
            </span>
            <button type="button" onClick={() => setFile(null)} className="shrink-0 rounded p-0.5 hover:bg-slate-200" aria-label="Remove attachment">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
        {composeError && <div className="mb-2 rounded-lg bg-red-50 px-3 py-1.5 text-xs text-red-700" role="alert">{composeError}</div>}

        <div className="flex items-end gap-2">
          <input ref={fileInputRef} type="file" accept={ATTACHMENT_ACCEPT} className="hidden" onChange={(e) => pickFile(e.target.files?.[0])} />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={!!disabledReason}
            title={`Attach a file (max ${formatBytes(MAX_ATTACHMENT_BYTES)})`}
            aria-label="Attach a file"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Paperclip className="h-4 w-4" />
          </button>
          <textarea
            ref={textareaRef}
            value={text}
            rows={1}
            maxLength={MAX_LENGTH}
            disabled={!!disabledReason}
            onChange={(e) => {
              setText(e.target.value);
              autosize();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder={disabledReason ?? "Type a message"}
            aria-label="Message"
            className="max-h-[140px] min-h-10 flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-[var(--brand)] focus:bg-white disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={!!disabledReason || (!text.trim() && !file)}
            aria-label="Send message"
            className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl bg-[var(--brand)] px-4 text-sm font-semibold text-white hover:bg-[var(--brand-hover)] disabled:opacity-50"
          >
            <SendHorizontal className="h-4 w-4" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </div>
        {text.length > MAX_LENGTH - 300 && <div className="mt-1 text-right text-[11px] text-slate-400">{text.length}/{MAX_LENGTH}</div>}
      </form>

      {dragging && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center rounded-2xl border-2 border-dashed border-[var(--brand)] bg-white/80 text-sm font-semibold text-[var(--brand)]">
          Drop a file to attach it (max {formatBytes(MAX_ATTACHMENT_BYTES)})
        </div>
      )}
    </section>
  );
}
