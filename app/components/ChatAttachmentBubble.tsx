import { FileText } from "lucide-react";
import { resolveApiUrl } from "@/lib/api/client";
import type { SupportMessageDto } from "@/lib/api/types";

// Renders a chat message's optional attachment — speculative until the backend adds attachment
// support (see repo memory notes); simply renders nothing if the fields aren't populated.
export function ChatAttachmentBubble({ item, mine }: { item: SupportMessageDto; mine: boolean }) {
  if (!item.attachmentUrl) return null;
  const url = resolveApiUrl(item.attachmentUrl);
  if (!url) return null;

  if (item.attachmentType === "Image") {
    return (
      <a href={url} target="_blank" rel="noreferrer" className="mb-1 block overflow-hidden rounded-lg">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={item.attachmentName ?? "Attachment"} className="max-h-56 w-full object-cover" />
      </a>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className={`mb-1 flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs ${mine ? "bg-white/15 text-white" : "bg-slate-100 text-slate-700"}`}
    >
      <FileText className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate">{item.attachmentName ?? "Download attachment"}</span>
    </a>
  );
}
