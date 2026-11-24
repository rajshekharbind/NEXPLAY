"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Film,
  Tv,
  Music,
  Sparkles,
  Headphones,
  Video,
  Radio,
  Compass,
  X,
  Search,
  ArrowRight,
  ExternalLink,
  Flame,
  Layers
} from "lucide-react";

interface EntertainmentMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ENTERTAINMENT_CATEGORIES = [
  {
    name: "Movies & OTT",
    subtitle: "Blockbusters, Bollywood & Hollywood cinema",
    href: "/search?type=MOVIE",
    icon: Film,
    badge: "MOVIES",
    gradient: "from-red-600/20 to-rose-600/10",
    border: "border-red-500/30",
    textColor: "text-red-400",
    iconBg: "bg-red-500/15"
  },
  {
    name: "Web Series",
    subtitle: "Binge-worthy originals, drama & thrillers",
    href: "/search?type=SERIES",
    icon: Tv,
    badge: "SERIES",
    gradient: "from-blue-600/20 to-cyan-600/10",
    border: "border-blue-500/30",
    textColor: "text-blue-400",
    iconBg: "bg-blue-500/15"
  },
  {
    name: "Music & Audio",
    subtitle: "Hi-Fi songs, playlists, lo-fi & podcasts",
    href: "/search?type=SONG",
    icon: Music,
    badge: "HI-FI",
    gradient: "from-emerald-600/20 to-teal-600/10",
    border: "border-emerald-500/30",
    textColor: "text-emerald-400",
    iconBg: "bg-emerald-500/15"
  },
  {
    name: "Anime Universe",
    subtitle: "Simulcasts, shonen, romance & movies",
    href: "/search?type=ANIME",
    icon: Sparkles,
    badge: "ANIME",
    gradient: "from-orange-600/20 to-amber-600/10",
    border: "border-orange-500/30",
    textColor: "text-orange-400",
    iconBg: "bg-orange-500/15"
  },
  {
    name: "Podcasts & Shows",
    subtitle: "Talk shows, tech, comedy & true crime",
    href: "/search?type=PODCAST",
    icon: Headphones,
    badge: "AUDIO",
    gradient: "from-cyan-600/20 to-blue-600/10",
    border: "border-cyan-500/30",
    textColor: "text-cyan-400",
    iconBg: "bg-cyan-500/15"
  },
  {
    name: "Videos & Creators",
    subtitle: "Trailers, esports, gaming & docuseries",
    href: "/search?type=VIDEO",
    icon: Video,
    badge: "VIDEO",
    gradient: "from-purple-600/20 to-pink-600/10",
    border: "border-purple-500/30",
    textColor: "text-purple-400",
    iconBg: "bg-purple-500/15"
  },
  {
    name: "Live TV & Sports",
    subtitle: "Live cricket, news & 24/7 channel streams",
    href: "/platforms?category=live_tv",
    icon: Radio,
    badge: "LIVE",
    gradient: "from-rose-600/20 to-red-600/10",
    border: "border-rose-500/30",
    textColor: "text-rose-400",
    iconBg: "bg-rose-500/15"
  },
  {
    name: "40+ Platform Directory",
    subtitle: "All verified streaming services & apps",
    href: "/platforms",
    icon: Compass,
    badge: "43 APPS",
    gradient: "from-indigo-600/20 to-violet-600/10",
    border: "border-indigo-500/30",
    textColor: "text-indigo-400",
    iconBg: "bg-indigo-500/15"
  }
];

const STREAMING_SHORTCUTS = [
  { name: "Netflix", bg: "bg-[#E50914]/15 border-[#E50914]/40 text-[#E50914]", slug: "netflix" },
  { name: "Spotify", bg: "bg-[#1DB954]/15 border-[#1DB954]/40 text-[#1DB954]", slug: "spotify" },
  { name: "Prime Video", bg: "bg-[#00A8E1]/15 border-[#00A8E1]/40 text-[#00A8E1]", slug: "prime-video" },
  { name: "Sony LIV", bg: "bg-[#0070D1]/15 border-[#0070D1]/40 text-[#0070D1]", slug: "sony-liv" },
  { name: "YouTube", bg: "bg-[#FF0033]/15 border-[#FF0033]/40 text-[#FF0033]", slug: "youtube" },
  { name: "Crunchyroll", bg: "bg-[#FF6600]/15 border-[#FF6600]/40 text-[#FF6600]", slug: "crunchyroll" },
  { name: "JioCinema", bg: "bg-[#E11D48]/15 border-[#E11D48]/40 text-[#E11D48]", slug: "jiocinema" },
  { name: "Hotstar", bg: "bg-[#FF9900]/15 border-[#FF9900]/40 text-[#FF9900]", slug: "disney-hotstar" },
];

export default function EntertainmentMenuModal({ isOpen, onClose }: EntertainmentMenuModalProps) {
  const router = useRouter();

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end md:justify-center items-center">
      {/* Dimmed Blurred Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
      />

      {/* Slide-Up Bottom Sheet on Mobile / Centered Modal on Tablet & Desktop */}
      <div className="relative w-full md:max-w-2xl bg-slate-950 border-t md:border border-slate-800 rounded-t-[32px] md:rounded-[32px] max-h-[90vh] md:max-h-[85vh] flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.8)] z-10 overflow-hidden animate-in slide-in-from-bottom-10 md:zoom-in-95 duration-250">
        
        {/* Mobile Drag Indicator Bar */}
        <div className="w-full pt-3 pb-1 flex justify-center md:hidden cursor-pointer" onClick={onClose}>
          <div className="w-12 h-1.5 rounded-full bg-slate-700/80" />
        </div>

        {/* Modal Header */}
        <div className="px-5 py-3 sm:px-6 sm:py-4 flex items-center justify-between border-b border-slate-800/80 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#E50914] via-[#0070D1] to-[#1DB954] p-[1.5px] shadow-lg">
              <div className="w-full h-full rounded-[10px] bg-slate-950 flex items-center justify-center">
                <Layers className="w-4 h-4 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                  Entertainment Menu
                </h3>
                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                  40+ Platforms
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Select an entertainment destination or browse by media category
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
            aria-label="Close Entertainment Menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content - Scrollable */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-5 no-scrollbar pb-10 md:pb-6">
          
          {/* 1. Quick Entertainment Categories Grid */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>Entertainment Categories</span>
              </span>
              <span className="text-[10px] text-slate-500">Tap to browse titles</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {ENTERTAINMENT_CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                return (
                  <Link
                    key={cat.name}
                    href={cat.href}
                    onClick={onClose}
                    className={`flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r ${cat.gradient} border ${cat.border} hover:scale-[1.01] active:scale-[0.98] transition-all group`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl ${cat.iconBg} flex items-center justify-center shrink-0`}>
                        <Icon className={`w-5 h-5 ${cat.textColor}`} />
                      </div>
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <span className="text-xs sm:text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                            {cat.name}
                          </span>
                          <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border uppercase ${cat.textColor} ${cat.border}`}>
                            {cat.badge}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                          {cat.subtitle}
                        </p>
                      </div>
                    </div>

                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                  </Link>
                );
              })}
            </div>
          </div>

          {/* 2. Direct Streaming Platform Shortcuts */}
          <div className="space-y-2 pt-2 border-t border-slate-800/80">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-cyan-400" />
                <span>Direct Platform Hubs</span>
              </span>
              <Link
                href="/platforms"
                onClick={onClose}
                className="text-[10px] font-bold text-cyan-400 hover:underline"
              >
                View All 43 →
              </Link>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {STREAMING_SHORTCUTS.map((platform) => (
                <Link
                  key={platform.name}
                  href={`/platforms?search=${encodeURIComponent(platform.name)}`}
                  onClick={onClose}
                  className={`p-2 rounded-xl border text-center font-bold text-xs transition-all active:scale-95 hover:opacity-90 ${platform.bg}`}
                >
                  <span className="truncate block">{platform.name}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* 3. AI Copilot Discovery Shortcut Banner */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-950/50 via-indigo-950/40 to-slate-900 border border-purple-500/30 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                <Sparkles className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Can't decide what to watch?</p>
                <p className="text-[10px] text-purple-300">Ask the NEXPLAY AI Copilot for mood recommendations</p>
              </div>
            </div>
            <Link
              href="/ai"
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs shrink-0 shadow-md hover:scale-105 active:scale-95 transition-all"
            >
              Open AI
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
