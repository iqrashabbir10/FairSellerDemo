import { AlertCircle, Check, CheckCheck, Clock } from "lucide-react";
import type { DeliveryStatus } from "@/lib/chat/useChatThread";

// WhatsApp-style receipts: clock = sending, one tick = sent (recipient offline), two grey ticks =
// delivered (recipient online), two coloured ticks = read (recipient opened the chat).
export function MessageStatusTicks({ status, className = "" }: { status: DeliveryStatus; className?: string }) {
  switch (status) {
    case "sending":
      return <Clock aria-label="Sending" className={`h-3.5 w-3.5 ${className}`} />;
    case "failed":
      return <AlertCircle aria-label="Failed to send" className="h-3.5 w-3.5 text-red-200" />;
    case "sent":
      return <Check aria-label="Sent" className={`h-3.5 w-3.5 ${className}`} />;
    case "delivered":
      return <CheckCheck aria-label="Delivered" className={`h-3.5 w-3.5 ${className}`} />;
    case "read":
      return <CheckCheck aria-label="Read" className="h-3.5 w-3.5 text-sky-300" />;
  }
}
