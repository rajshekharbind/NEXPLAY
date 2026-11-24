"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, Search, Sparkles, Bookmark, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

const mobileNavItems = [
  { name: "Home", href: "/", icon: Home },
  { name: "Explore", href: "/platforms", icon: Compass },
  { name: "Search", href: "/search", icon: Search },
  { name: "AI Copilot", href: "/ai", icon: Sparkles, isSpecial: true },
  { name: "Watchlist", href: "/watchlist", icon: Bookmark },
  { name: "Wallet", href: "/billing", icon: CreditCard },
];

export default function BottomNav() {
  const pathname = usePathname();

  // Hide bottom nav on specific fullscreen pages if needed
  return (
    <nav 
      aria-label="Mobile Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/90 px-1 py-1.5 shadow-[0_-8px_25px_rgba(0,0,0,0.6)] select-none pb-[calc(env(safe-area-inset-bottom,0px)+6px)]"
    >
      <div className="grid grid-cols-6 items-center justify-items-center max-w-md mx-auto">
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          if (item.isSpecial) {
            return (
              <Link
                key={item.name}
                href={item.href}
                className="flex flex-col items-center justify-center group relative -mt-3.5 focus:outline-none"
              >
                <div className={cn(
                  "w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300 active:scale-90",
                  isActive
                    ? "bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 shadow-purple-500/40 ring-2 ring-purple-400"
                    : "bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-600 shadow-indigo-600/30 group-hover:scale-105"
                )}>
                  <Icon className="w-5 h-5 text-white animate-pulse" />
                </div>
                <span className={cn(
                  "text-[9px] font-black tracking-tight mt-1 transition-colors",
                  isActive ? "text-purple-400" : "text-slate-400"
                )}>
                  {item.name}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center w-full py-1 rounded-xl transition-all duration-200 active:scale-90 focus:outline-none",
                isActive ? "text-cyan-400" : "text-slate-400 hover:text-slate-200"
              )}
            >
              <div className="relative">
                <Icon className={cn("w-5 h-5 transition-transform", isActive ? "scale-110" : "")} />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#00A8E1]" />
                )}
              </div>
              <span className={cn(
                "text-[9px] tracking-tight mt-1 transition-colors font-semibold",
                isActive ? "font-black text-cyan-400" : "text-slate-400"
              )}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
