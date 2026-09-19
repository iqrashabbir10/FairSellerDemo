// The backend's message-history GET is currently unreliable (404/405) — cache each conversation's
// messages locally (per browser) so a refresh never "loses" something that was actually sent.
import type { SupportMessageDto } from "@/lib/api/types";

const PREFIX = "wayfeir-chat-messages:";

export function getCachedMessages(conversationId: string): SupportMessageDto[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(PREFIX + conversationId);
    return raw ? (JSON.parse(raw) as SupportMessageDto[]) : [];
  } catch {
    return [];
  }
}

export function setCachedMessages(conversationId: string, messages: SupportMessageDto[]) {
  window.localStorage.setItem(PREFIX + conversationId, JSON.stringify(messages));
}
