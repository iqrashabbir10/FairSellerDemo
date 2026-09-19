import { Check, CheckCheck } from "lucide-react";

export type MessageDeliveryStatus = "sent" | "delivered" | "read";

// WhatsApp-style ticks: single check = sent, double gray = delivered, double blue = read.
export function MessageStatusTicks({ status, className = "" }: { status: MessageDeliveryStatus; className?: string }) {
  if (status === "sent") return <Check className={`h-3.5 w-3.5 ${className}`} />;
  return <CheckCheck className={`h-3.5 w-3.5 ${status === "read" ? "text-sky-400" : ""} ${className}`} />;
}
