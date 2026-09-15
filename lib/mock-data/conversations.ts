export type Message = {
  id: string;
  sender: "customer" | "seller" | "admin";
  text: string;
  time: string;
};

export type ConversationThread = {
  id: string;
  participant: string;
  role: "customer" | "seller";
  preview: string;
  unread: number;
  updatedAt: string;
  messages: Message[];
};

export const conversations: ConversationThread[] = [
  {
    id: "conv-101",
    participant: "Layla Ahmed",
    role: "customer",
    preview: "Thanks for the quick update on my order.",
    unread: 2,
    updatedAt: "9:42 AM",
    messages: [
      { id: "m-1", sender: "customer", text: "Hi, I received my order but the lamp arrived damaged.", time: "9:12 AM" },
      { id: "m-2", sender: "admin", text: "We’ve alerted the seller and will help with a replacement.", time: "9:18 AM" },
      { id: "m-3", sender: "customer", text: "Thanks for the quick update on my order.", time: "9:42 AM" },
    ],
  },
  {
    id: "conv-102",
    participant: "Rami Haddad",
    role: "seller",
    preview: "The payout request was approved and sent for review.",
    unread: 1,
    updatedAt: "Yesterday",
    messages: [
      { id: "m-4", sender: "seller", text: "Can the payment be processed before Friday?", time: "Yesterday" },
      { id: "m-5", sender: "admin", text: "The payout request was approved and sent for review.", time: "Yesterday" },
    ],
  },
  {
    id: "conv-103",
    participant: "Nora Bell",
    role: "customer",
    preview: "I’m checking the status of my return.",
    unread: 0,
    updatedAt: "Mon",
    messages: [
      { id: "m-6", sender: "customer", text: "I’m checking the status of my return.", time: "Mon" },
      { id: "m-7", sender: "admin", text: "Your request is currently under review; we’ll update you within 24 hours.", time: "Mon" },
    ],
  },
];
