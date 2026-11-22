"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Search,
  Tv,
  Film,
  Music,
  Video,
  Sparkles,
  Headphones,
  HardDrive,
  Compass,
  Bookmark,
  CreditCard,
  ShieldCheck,
  Bot,
  Flame,
  Terminal,
  Activity
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigationItems = [
  { name: "Discover Hub", href: "/", icon: Home },
  { name: "Search Catalog", href: "/search", icon: Search, badge: "LIVE" },
  { name: "Platforms (40+)", href: "/platforms", icon: Compass, badge: "43" },
  { name: "Movies & OTT", href: "/search?type=MOVIE", icon: Film, brandColor: "text-red-500" },
  { name: "Web Series", href: "/search?type=SERIES", icon: Tv, brandColor: "text-blue-500" },
  { name: "Music & Audio", href: "/search?type=SONG", icon: Music, brandColor: "text-emerald-400" },
  { name: "Anime Universe", href: "/search?type=ANIME", icon: Sparkles, brandColor: "text-orange-400" },
  { name: "Podcasts & Audio", href: "/search?type=PODCAST", icon: Headphones, brandColor: "text-cyan-400" },
  { name: "Videos & Creators", href: "/search?type=VIDEO", icon: Video, brandColor: "text-rose-500" },
];

const userItems = [
  { name: "AI Copilot", href: "/ai", icon: Bot, badge: "AI" },
  { name: "My Watchlist", href: "/watchlist", icon: Bookmark, badge: "QUEUE" },
  { name: "MCP Server Tools", href: "/mcp", icon: Terminal, badge: "11" },
  { name: "Automation & Health", href: "/automation", icon: Activity, badge: "LIVE" },
  { name: "Plans & Wallet", href: "/billing", icon: CreditCard },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 hidden md:flex flex-col border-r border-surface-border bg-surface/30 p-4 space-y-6 transition-colors duration-300">
      <div>
        <p className="px-3 text-[11px] font-bold text-foreground-muted uppercase tracking-wider mb-2">
          Entertainment Categories
        </p>
        <nav className="space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200",
                  isActive
                    ? "bg-gradient-to-r from-indigo-600/20 to-cyan-600/10 text-indigo-400 dark:text-cyan-300 border border-indigo-500/30 shadow-sm"
                    : "text-foreground-muted hover:text-foreground hover:bg-surface-card/60"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className={cn("w-4 h-4", item.brandColor || (isActive ? "text-indigo-400" : "text-foreground-muted"))} />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-indigo-500/15 text-indigo-400 border border-indigo-500/25">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <div>
        <p className="px-3 text-[11px] font-bold text-foreground-muted uppercase tracking-wider mb-2">
          Personal Hub
        </p>
        <nav className="space-y-1">
          {userItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold text-foreground-muted hover:text-foreground hover:bg-surface-card/60 transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 text-foreground-muted" />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-cyan-500/15 text-cyan-400 border border-cyan-500/25">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto pt-4 border-t border-surface-border">
        {/* Streaming Brands Badge Bar */}
        <div className="p-3 rounded-2xl bg-gradient-to-br from-surface-card to-surface border border-surface-border space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-red-500" />
              Connected Ecosystem
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <div className="flex items-center justify-between gap-1 pt-1 opacity-80">
            <span className="text-[10px] font-bold text-[#E50914]">NETFLIX</span>
            <span className="text-[10px] font-bold text-[#00A8E1]">PRIME</span>
            <span className="text-[10px] font-bold text-[#1DB954]">SPOTIFY</span>
            <span className="text-[10px] font-bold text-[#0070D1]">SONY</span>
          </div>
          <p className="text-[10px] text-foreground-muted leading-tight pt-1">
            Official deep links & authorized API integrations.
          </p>
        </div>
      </div>
    </aside>
  );
}
