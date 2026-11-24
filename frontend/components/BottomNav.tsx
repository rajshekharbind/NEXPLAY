"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Film, Search, Sparkles, Bookmark, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import EntertainmentMenuModal from "./EntertainmentMenuModal";

export default function BottomNav() {
  const pathname = usePathname();
  const [isEntertainmentMenuOpen, setIsEntertainmentMenuOpen] = useState(false);

  return (
    <>
      <nav 
        aria-label="Mobile Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/90 px-1 py-1.5 shadow-[0_-8px_25px_rgba(0,0,0,0.6)] select-none pb-[calc(env(safe-area-inset-bottom,0px)+6px)]"
      >
        <div className="grid grid-cols-6 items-center justify-items-center max-w-md mx-auto">
          {/* 1. Home */}
          <Link
            href="/"
            onClick={() => setIsEntertainmentMenuOpen(false)}
            className={cn(
              "flex flex-col items-center justify-center w-full py-1 rounded-xl transition-all duration-200 active:scale-90 focus:outline-none",
              pathname === "/" && !isEntertainmentMenuOpen ? "text-cyan-400" : "text-slate-400 hover:text-slate-200"
            )}
          >
            <div className="relative">
              <Home className={cn("w-5 h-5 transition-transform", pathname === "/" && !isEntertainmentMenuOpen ? "scale-110" : "")} />
              {pathname === "/" && !isEntertainmentMenuOpen && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#00A8E1]" />
              )}
            </div>
            <span className={cn(
              "text-[9px] tracking-tight mt-1 transition-colors font-semibold",
              pathname === "/" && !isEntertainmentMenuOpen ? "font-black text-cyan-400" : "text-slate-400"
            )}>
              Home
            </span>
          </Link>

          {/* 2. Entertainment Menu Trigger */}
          <button
            type="button"
            onClick={() => setIsEntertainmentMenuOpen((prev) => !prev)}
            className={cn(
              "flex flex-col items-center justify-center w-full py-1 rounded-xl transition-all duration-200 active:scale-90 focus:outline-none cursor-pointer",
              isEntertainmentMenuOpen ? "text-red-400" : "text-slate-400 hover:text-slate-200"
            )}
            aria-label="Open Entertainment Menu"
          >
            <div className="relative">
              <div className={cn(
                "w-7 h-7 rounded-lg flex items-center justify-center transition-all",
                isEntertainmentMenuOpen ? "bg-red-500/20 text-red-400 border border-red-500/40" : ""
              )}>
                <Film className={cn("w-5 h-5 transition-transform", isEntertainmentMenuOpen ? "scale-110 text-red-400" : "")} />
              </div>
              {isEntertainmentMenuOpen && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-red-400 shadow-[0_0_8px_#E50914]" />
              )}
            </div>
            <span className={cn(
              "text-[8.5px] tracking-tight mt-0.5 transition-colors font-bold truncate max-w-full px-0.5",
              isEntertainmentMenuOpen ? "font-black text-red-400" : "text-slate-400"
            )}>
              Entertainment
            </span>
          </button>

          {/* 3. Search */}
          <Link
            href="/search"
            onClick={() => setIsEntertainmentMenuOpen(false)}
            className={cn(
              "flex flex-col items-center justify-center w-full py-1 rounded-xl transition-all duration-200 active:scale-90 focus:outline-none",
              pathname === "/search" && !isEntertainmentMenuOpen ? "text-cyan-400" : "text-slate-400 hover:text-slate-200"
            )}
          >
            <div className="relative">
              <Search className={cn("w-5 h-5 transition-transform", pathname === "/search" && !isEntertainmentMenuOpen ? "scale-110" : "")} />
              {pathname === "/search" && !isEntertainmentMenuOpen && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#00A8E1]" />
              )}
            </div>
            <span className={cn(
              "text-[9px] tracking-tight mt-1 transition-colors font-semibold",
              pathname === "/search" && !isEntertainmentMenuOpen ? "font-black text-cyan-400" : "text-slate-400"
            )}>
              Search
            </span>
          </Link>

          {/* 4. AI Copilot (Special Center Action) */}
          <Link
            href="/ai"
            onClick={() => setIsEntertainmentMenuOpen(false)}
            className="flex flex-col items-center justify-center group relative -mt-3.5 focus:outline-none"
          >
            <div className={cn(
              "w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300 active:scale-90",
              pathname === "/ai" && !isEntertainmentMenuOpen
                ? "bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 shadow-purple-500/40 ring-2 ring-purple-400"
                : "bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-600 shadow-indigo-600/30 group-hover:scale-105"
            )}>
              <Sparkles className="w-5 h-5 text-white animate-pulse" />
            </div>
            <span className={cn(
              "text-[9px] font-black tracking-tight mt-1 transition-colors",
              pathname === "/ai" && !isEntertainmentMenuOpen ? "text-purple-400" : "text-slate-400"
            )}>
              AI Copilot
            </span>
          </Link>

          {/* 5. Watchlist */}
          <Link
            href="/watchlist"
            onClick={() => setIsEntertainmentMenuOpen(false)}
            className={cn(
              "flex flex-col items-center justify-center w-full py-1 rounded-xl transition-all duration-200 active:scale-90 focus:outline-none",
              pathname === "/watchlist" && !isEntertainmentMenuOpen ? "text-cyan-400" : "text-slate-400 hover:text-slate-200"
            )}
          >
            <div className="relative">
              <Bookmark className={cn("w-5 h-5 transition-transform", pathname === "/watchlist" && !isEntertainmentMenuOpen ? "scale-110" : "")} />
              {pathname === "/watchlist" && !isEntertainmentMenuOpen && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#00A8E1]" />
              )}
            </div>
            <span className={cn(
              "text-[9px] tracking-tight mt-1 transition-colors font-semibold",
              pathname === "/watchlist" && !isEntertainmentMenuOpen ? "font-black text-cyan-400" : "text-slate-400"
            )}>
              Watchlist
            </span>
          </Link>

          {/* 6. Wallet */}
          <Link
            href="/billing"
            onClick={() => setIsEntertainmentMenuOpen(false)}
            className={cn(
              "flex flex-col items-center justify-center w-full py-1 rounded-xl transition-all duration-200 active:scale-90 focus:outline-none",
              pathname === "/billing" && !isEntertainmentMenuOpen ? "text-cyan-400" : "text-slate-400 hover:text-slate-200"
            )}
          >
            <div className="relative">
              <CreditCard className={cn("w-5 h-5 transition-transform", pathname === "/billing" && !isEntertainmentMenuOpen ? "scale-110" : "")} />
              {pathname === "/billing" && !isEntertainmentMenuOpen && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#00A8E1]" />
              )}
            </div>
            <span className={cn(
              "text-[9px] tracking-tight mt-1 transition-colors font-semibold",
              pathname === "/billing" && !isEntertainmentMenuOpen ? "font-black text-cyan-400" : "text-slate-400"
            )}>
              Wallet
            </span>
          </Link>
        </div>
      </nav>

      {/* Interactive Mobile Entertainment Menu Modal */}
      <EntertainmentMenuModal 
        isOpen={isEntertainmentMenuOpen} 
        onClose={() => setIsEntertainmentMenuOpen(false)} 
      />
    </>
  );
}
