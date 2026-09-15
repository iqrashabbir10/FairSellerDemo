import { SendHorizontal } from "lucide-react";

const threads = [
  { id: 1, name: "Support Team", preview: "Your account verification is under review.", unread: 1 },
  { id: 2, name: "Layla Ahmed", preview: "Thanks for the quick update on my order.", unread: 0 },
];

const messages = [
  { sender: "seller", text: "Hi, I’m checking the payout timeline.", time: "9:12 AM" },
  { sender: "admin", text: "Your payout request is currently in review.", time: "9:18 AM" },
];

export default function SellerConversationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-slate-500">Inbox</p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Conversations</h1>
      </div>

      <div className="grid min-h-[640px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:grid-cols-[320px_1fr]">
        <aside className="border-b border-slate-200 bg-slate-50 lg:border-b-0 lg:border-r">
          <div className="border-b border-slate-200 px-4 py-3 text-sm font-medium text-slate-700">Recent messages</div>
          <div className="space-y-2 p-3">
            {threads.map((thread) => (
              <button key={thread.id} className={`w-full rounded-xl border p-3 text-left ${thread.id === 1 ? "border-[#f0563f] bg-white shadow-sm" : "border-transparent bg-transparent hover:bg-white"}`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="font-medium text-slate-800">{thread.name}</div>
                  {thread.unread > 0 && <span className="rounded-full bg-[#f0563f] px-1.5 py-0.5 text-[10px] font-semibold text-white">{thread.unread}</span>}
                </div>
                <div className="mt-2 text-sm text-slate-600">{thread.preview}</div>
              </button>
            ))}
          </div>
        </aside>

        <section className="flex min-h-[500px] flex-col">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Support Team</h2>
              <p className="text-xs text-slate-500">Admin</p>
            </div>
            <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">Now</span>
          </div>

          <div className="flex flex-1 flex-col gap-4 bg-[#fcfbfa] p-5">
            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.sender === "admin" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${message.sender === "admin" ? "bg-[#f0563f] text-white" : "bg-white text-slate-700 ring-1 ring-slate-200"}`}>
                  {message.text}
                  <div className={`mt-1 text-[10px] ${message.sender === "admin" ? "text-white/80" : "text-slate-400"}`}>{message.time}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-200 p-4">
            <div className="flex gap-3">
              <input className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-[#f0563f] focus:bg-white" placeholder="Type a message" />
              <button className="inline-flex items-center gap-2 rounded-xl bg-[#f0563f] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#dc4b34]">
                <SendHorizontal className="h-4 w-4" />
                Send
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
