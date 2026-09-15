"use client";

import { ReactNode, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, CreditCard, Menu, MessageSquareText, Package, Settings, ShoppingBag, UserCog, WalletCards, X } from "lucide-react";

const navigation = [
  { label: "Dashboard", href: "/seller/dashboard", icon: BarChart3 },
  { label: "Products", href: "/seller/products", icon: Package },
  { label: "Orders", href: "/seller/orders", icon: ShoppingBag },
  { label: "Wallet / Withdraw", href: "/seller/wallet", icon: WalletCards },
  { label: "Conversations", href: "/seller/conversations", icon: MessageSquareText },
  { label: "Profile & Password", href: "/seller/profile", icon: Settings },
];

function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();

  return (
    <>
      <aside className="hidden w-[260px] border-r border-slate-200 bg-[#f7f5f3] lg:flex lg:flex-col">
        <div className="flex items-center gap-3 border-b border-slate-200 px-6 py-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f0563f] text-xs font-bold text-white">W</div>
          <div className="text-lg font-semibold">WayFeir</div>
        </div>

        <nav className="flex-1 px-3 py-4">
          {navigation.map(({ label, href, icon: Icon }) => {
            const active = pathname === href;
            return (
              <a
                key={href}
                href={href}
                onClick={onClose}
                className={`group flex items-center gap-3 rounded-r-xl border-l-2 px-3 py-3 text-sm font-medium transition-colors ${
                  active ? "border-[#f0563f] bg-[#fdf2ef] text-[#f0563f]" : "border-transparent text-slate-600 hover:bg-white hover:text-slate-900"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </a>
            );
          })}
        </nav>
      </aside>

      {open && (
        <div className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden" onClick={onClose}>
          <div className="h-full w-[280px] bg-[#f7f5f3] p-3 shadow-xl" onClick={(event) => event.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between border-b border-slate-200 px-3 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f0563f] text-xs font-bold text-white">W</div>
                <span className="text-lg font-semibold text-slate-900">WayFeir</span>
              </div>
              <button onClick={onClose} className="rounded-lg p-2 text-slate-600 hover:bg-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <nav className="space-y-1">
              {navigation.map(({ label, href, icon: Icon }) => {
                const active = pathname === href;
                return (
                  <a
                    key={href}
                    href={href}
                    onClick={onClose}
                    className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                      active ? "bg-[#fdf2ef] text-[#f0563f]" : "text-slate-600 hover:bg-white hover:text-slate-900"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{label}</span>
                  </a>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}

export default function SellerLayout({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("wayfeir-user");
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-[#f6f5f3] text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <Sidebar open={mobileOpen} onClose={() => setMobileOpen(false)} />

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="flex h-20 items-center justify-between border-b border-slate-200 bg-[#f0563f] px-5 text-white shadow-sm sm:px-7">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setMobileOpen(true)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/30 bg-white/5 lg:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-sm font-bold">W</div>
                <span className="text-xl font-semibold tracking-tight">WayFeir</span>
              </div>
            </div>

            <div className="flex items-center gap-5 text-sm font-medium text-white/95">
              <button className="inline-flex items-center gap-2 rounded-md px-2 py-1.5 transition hover:bg-white/10">
                <UserCog className="h-4 w-4" />
                <span>SELLER</span>
              </button>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded-md px-2 py-1.5 transition hover:bg-white/10"
              >
                <CreditCard className="h-4 w-4" />
                <span>LOGOUT</span>
              </button>
            </div>
          </header>

          <main className="flex-1 p-5 sm:p-7">{children}</main>
        </div>
      </div>
    </div>
  );
}
