import { FileText, Loader2 } from "lucide-react";
import { resolveApiUrl } from "@/lib/api/client";
import { attachmentDisplayName, formatBytes, isImageFile } from "@/lib/chat/attachments";
import type { ChatMessage } from "@/lib/chat/useChatThread";

// Renders a chat message's attachments: inline previews for images, a download chip for other files,
// and an "uploading" chip while an optimistic message with a file is still in flight.
export function ChatAttachmentBubble({ item, mine }: { item: ChatMessage; mine: boolean }) {
  const chip = mine ? "bg-white/15 text-white" : "bg-slate-100 text-slate-700";

  if (item.localFile) {
    return (
      <div className={`mb-1 flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs ${chip}`}>
        {item.localStatus === "sending" ? <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" /> : <FileText className="h-3.5 w-3.5 shrink-0" />}
        <span className="truncate">{item.localFile.name}</span>
        <span className="shrink-0 opacity-70">{formatBytes(item.localFile.size)}</span>
      </div>
    );
  }

  if (!item.attachments?.length) return null;

  return (
    <div className="space-y-1">
      {item.attachments.map((attachment) => {
        const url = resolveApiUrl(attachment.fileUrl);
        if (!url) return null;
        const name = attachmentDisplayName(attachment.fileUrl);
        if (isImageFile(attachment.fileUrl)) {
          return (
            <a key={attachment.id} href={url} target="_blank" rel="noreferrer" className="mb-1 block overflow-hidden rounded-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={name} loading="lazy" className="max-h-56 w-full object-cover" />
            </a>
          );
        }
        return (
          <a key={attachment.id} href={url} target="_blank" rel="noreferrer" className={`mb-1 flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs ${chip}`}>
            <FileText className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{name}</span>
          </a>
        );
      })}
    </div>
  );
}
