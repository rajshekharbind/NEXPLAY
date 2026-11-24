"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  ExternalLink,
  Film,
  Music,
  Video,
  Play,
  CheckCircle2,
  TrendingUp,
  CreditCard,
  Bot,
  Activity,
  Layers,
  ArrowRight,
  Flame,
  Radio,
  Tv,
  Headphones,
  Bookmark,
  Star,
  Clock,
  Check,
  Compass,
  Sliders,
  LogIn
} from "lucide-react";
import { fetchHealth, fetchPlatforms, fetchCategories, fetchFeaturedContent, fetchWatchlists, toggleWatchlist } from "@/lib/api";
import { Platform, ContentItem, Watchlist, WatchlistItem } from "@/types";
import Card3D from "@/components/Card3D";
import { useAuth } from "@/components/AuthContext";
import { FALLBACK_PLATFORMS, FALLBACK_CATEGORIES } from "@/lib/constants";

function getBrandGlow(slug: string): string {
  if (slug.includes("netflix")) return "rgba(229, 9, 20, 0.5)";
  if (slug.includes("spotify")) return "rgba(29, 185, 84, 0.5)";
  if (slug.includes("youtube")) return "rgba(255, 0, 51, 0.5)";
  if (slug.includes("sony")) return "rgba(0, 112, 209, 0.5)";
  if (slug.includes("prime")) return "rgba(0, 168, 225, 0.5)";
  if (slug.includes("hotstar")) return "rgba(255, 153, 0, 0.5)";
  if (slug.includes("crunchyroll")) return "rgba(255, 102, 0, 0.5)";
  if (slug.includes("apple")) return "rgba(148, 163, 184, 0.4)";
  return "rgba(99, 102, 241, 0.45)";
}

function getBrandBadgeColor(slug: string): string {
  if (slug.includes("netflix")) return "text-[#E50914] bg-[#E50914]/10 border-[#E50914]/30";
  if (slug.includes("spotify")) return "text-[#1DB954] bg-[#1DB954]/10 border-[#1DB954]/30";
  if (slug.includes("youtube")) return "text-[#FF0033] bg-[#FF0033]/10 border-[#FF0033]/30";
  if (slug.includes("sony")) return "text-[#0070D1] bg-[#0070D1]/10 border-[#0070D1]/30";
  if (slug.includes("prime")) return "text-[#00A8E1] bg-[#00A8E1]/10 border-[#00A8E1]/30";
  if (slug.includes("hotstar")) return "text-[#FF9900] bg-[#FF9900]/10 border-[#FF9900]/30";
  if (slug.includes("crunchyroll")) return "text-[#FF6600] bg-[#FF6600]/10 border-[#FF6600]/30";
  return "text-indigo-400 bg-indigo-500/10 border-indigo-500/30";
}

export default function HomePage() {
  const { user, token, isAuthenticated, login } = useAuth();

  const [health, setHealth] = useState<any>({
    status: "OPERATIONAL",
    database_status: "HEALTHY",
    platforms_loaded: 43
  });
  const [platforms, setPlatforms] = useState<Platform[]>(FALLBACK_PLATFORMS);
  const [categories, setCategories] = useState<any[]>(FALLBACK_CATEGORIES);
  const [featuredTitles, setFeaturedTitles] = useState<ContentItem[]>([]);
  const [userWatchlistItems, setUserWatchlistItems] = useState<WatchlistItem[]>([]);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    async function loadLiveData() {
      try {
        const [h, p, c, f] = await Promise.allSettled([
          fetchHealth(),
          fetchPlatforms(),
          fetchCategories(),
          fetchFeaturedContent(8)
        ]);
        if (h.status === "fulfilled" && h.value) setHealth(h.value);
        if (p.status === "fulfilled" && p.value && p.value.length > 0) setPlatforms(p.value);
        if (c.status === "fulfilled" && c.value && c.value.length > 0) setCategories(c.value);
        if (f.status === "fulfilled" && f.value && f.value.length > 0) setFeaturedTitles(f.value);
      } catch (e) {
        console.error("Home data fetch fallback:", e);
      }
    }
    loadLiveData();
  }, []);

  // Load User Watchlist if logged in
  useEffect(() => {
    async function loadUserQueue() {
      if (!token) return;
      try {
        const watchlists = await fetchWatchlists(token);
        if (watchlists.length > 0) {
          const defaultList = watchlists.find((w) => w.is_default) || watchlists[0];
          setUserWatchlistItems(defaultList.items || []);
          const ids = new Set<string>();
          watchlists.forEach((wl) => wl.items?.forEach((i) => ids.add(i.content_id)));
          setBookmarkedIds(ids);
        }
      } catch (err) {
        console.error("Error loading user queue:", err);
      }
    }
    loadUserQueue();
  }, [token]);

  const handleToggleBookmark = async (item: ContentItem) => {
    if (!token) {
      showToast("Please log in to save to your Watchlist");
      return;
    }
    const isSaved = bookmarkedIds.has(item.id);
    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      if (isSaved) next.delete(item.id);
      else next.add(item.id);
      return next;
    });

    const res = await toggleWatchlist(token, item.id);
    if (res?.action === "added") {
      showToast(`Added "${item.title}" to Watchlist`);
      if (res.item) {
        setUserWatchlistItems((prev) => [res.item!, ...prev]);
      }
    } else if (res?.action === "removed") {
      showToast(`Removed "${item.title}" from Watchlist`);
      setUserWatchlistItems((prev) => prev.filter((i) => i.content_id !== item.id));
    }
  };

  const handleDemoLogin = async () => {
    await login("admin@nexplay.com", "AdminMasterKey2026!");
    showToast("Signed in as Admin Demo User");
  };

  const spotlightTitle = featuredTitles[0] || {
    id: "interstellar",
    title: "Interstellar",
    description: "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival.",
    backdrop_url: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop",
    rating: 8.7,
    duration_minutes: 169,
    content_type: "MOVIE",
    maturity_rating: "PG-13",
    original_language: "en",
    genres: ["Sci-Fi", "Drama"],
    streaming_options: [
      { platform_name: "Prime Video", platform_slug: "prime-video", stream_url: "https://www.primevideo.com", pricing_details: "Included in Prime" }
    ]
  };

  const displayPlatforms = platforms.slice(0, 16);

  return (
    <div className="space-y-12 pb-20">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-2xl flex items-center gap-2 animate-slide-up border border-indigo-400/30">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Cinematic Live System Diagnostic Banner */}
      <div className="glass-panel rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 border border-surface-border shadow-lg transition-colors">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center">
            <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 animate-ping absolute" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 relative" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-foreground">
                NEXPLAY Engine: {health?.status || "OPERATIONAL"}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-500 dark:text-emerald-400 border border-emerald-500/25 font-bold">
                FastAPI + PostgreSQL Active
              </span>
            </div>
            <p className="text-xs text-foreground-muted">
              Database: <span className="text-emerald-500 dark:text-emerald-400 font-mono font-bold">{health?.database_status || "HEALTHY"}</span> • Loaded Platforms: <span className="text-indigo-500 dark:text-cyan-400 font-black">{health?.platforms_loaded || platforms.length || 43}</span> • Catalog Titles: <span className="text-indigo-400 font-black">{featuredTitles.length > 0 ? "12+ Live" : "12"}</span>
            </p>
          </div>
        </div>

        {/* Streaming Brands Ticker */}
        <div className="flex items-center gap-3 text-xs font-semibold text-foreground-muted">
          <span className="hidden lg:inline text-foreground font-bold">Streaming Matrix:</span>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-[#E50914]/10 text-[#E50914] border border-[#E50914]/20 text-[10px] font-black">NETFLIX</span>
            <span className="px-2 py-0.5 rounded-md bg-[#00A8E1]/10 text-[#00A8E1] border border-[#00A8E1]/20 text-[10px] font-black">PRIME</span>
            <span className="px-2 py-0.5 rounded-md bg-[#1DB954]/10 text-[#1DB954] border border-[#1DB954]/20 text-[10px] font-black">SPOTIFY</span>
            <span className="px-2 py-0.5 rounded-md bg-[#0070D1]/10 text-[#0070D1] border border-[#0070D1]/20 text-[10px] font-black">SONY</span>
            <span className="px-2 py-0.5 rounded-md bg-[#FF0033]/10 text-[#FF0033] border border-[#FF0033]/20 text-[10px] font-black">YOUTUBE</span>
          </div>
        </div>
      </div>

      {/* Mobile-First Interactive Entertainment Menu Bar */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <h2 className="text-xs font-black uppercase tracking-wider text-foreground flex items-center gap-1.5">
              <Film className="w-3.5 h-3.5 text-red-500" />
              <span>Entertainment Menu</span>
            </h2>
          </div>
          <Link
            href="/platforms"
            className="text-[11px] font-bold text-indigo-500 dark:text-cyan-400 hover:underline flex items-center gap-1"
          >
            <span>All 40+ Platforms</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Touch-Scrollable Horizontal Category Menu */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 -mx-3 px-3 sm:mx-0 sm:px-0">
          {[
            { label: "All Hub", href: "/", icon: Play, color: "text-white bg-gradient-to-r from-indigo-600 to-cyan-500 shadow-md shadow-indigo-500/20" },
            { label: "Movies & OTT", href: "/search?type=MOVIE", icon: Film, color: "text-red-500 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20" },
            { label: "Web Series", href: "/search?type=SERIES", icon: Tv, color: "text-blue-500 bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500/20" },
            { label: "Music & Songs", href: "/search?type=SONG", icon: Music, color: "text-emerald-500 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20" },
            { label: "Anime Universe", href: "/search?type=ANIME", icon: Sparkles, color: "text-orange-500 bg-orange-500/10 border border-orange-500/30 hover:bg-orange-500/20" },
            { label: "Podcasts & Audio", href: "/search?type=PODCAST", icon: Headphones, color: "text-cyan-500 bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20" },
            { label: "Videos & Creators", href: "/search?type=VIDEO", icon: Video, color: "text-purple-500 bg-purple-500/10 border border-purple-500/30 hover:bg-purple-500/20" },
            { label: "40+ Platforms", href: "/platforms", icon: Compass, color: "text-indigo-400 bg-indigo-500/10 border border-indigo-500/30 hover:bg-indigo-500/20" },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition-all active:scale-95 ${item.color}`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* 2. Spotlight Cinematic Hero Portal */}
      <section className="relative rounded-3xl overflow-hidden glass-panel border border-surface-border shadow-2xl min-h-[420px] flex items-center">
        {/* Dynamic Background Backdrop */}
        <div className="absolute inset-0">
          <img
            src={spotlightTitle.backdrop_url || "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop"}
            alt={spotlightTitle.title}
            className="w-full h-full object-cover opacity-20 dark:opacity-30 filter blur-sm scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        </div>

        <div className="relative z-10 max-w-3xl p-8 sm:p-12 lg:p-14 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-indigo-500/20 via-cyan-500/20 to-purple-500/20 border border-indigo-500/30 text-xs font-bold text-indigo-500 dark:text-cyan-300 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Featured Entertainment Spotlight</span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-xs font-black uppercase px-2.5 py-0.5 rounded-md bg-indigo-600 text-white">
                {spotlightTitle.content_type}
              </span>
              <div className="flex items-center gap-1 text-xs font-black text-amber-400">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                <span>{spotlightTitle.rating.toFixed(1)} / 10</span>
              </div>
              <span className="text-xs text-foreground-muted">
                {spotlightTitle.duration_minutes > 0 ? `${spotlightTitle.duration_minutes}m` : "Series"}
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-foreground leading-[1.1]">
              {spotlightTitle.title}
            </h1>
          </div>

          <p className="text-foreground-muted text-xs sm:text-sm leading-relaxed max-w-2xl line-clamp-3">
            {spotlightTitle.description}
          </p>

          {/* Interactive Action CTAs */}
          <div className="pt-2 flex flex-wrap items-center gap-4">
            {spotlightTitle.streaming_options && spotlightTitle.streaming_options.length > 0 ? (
              <a
                href={spotlightTitle.streaming_options[0].stream_url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-7 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-sm transition-all duration-300 shadow-xl hover:shadow-cyan-500/25 flex items-center gap-2 group hover:scale-[1.02]"
              >
                <Play className="w-4 h-4 fill-white group-hover:scale-110 transition-transform" />
                <span>Watch on {spotlightTitle.streaming_options[0].platform_name}</span>
                <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </a>
            ) : (
              <Link
                href="/search"
                className="px-7 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm flex items-center gap-2"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Explore Availability</span>
              </Link>
            )}

            <button
              onClick={() => handleToggleBookmark(spotlightTitle as ContentItem)}
              className={`px-6 py-3.5 rounded-2xl border text-sm font-bold flex items-center gap-2 transition-all hover:scale-[1.02] shadow-md ${
                bookmarkedIds.has(spotlightTitle.id)
                  ? "bg-indigo-600 text-white border-indigo-500"
                  : "glass-card text-foreground hover:bg-surface border-surface-border"
              }`}
            >
              <Bookmark className={`w-4 h-4 ${bookmarkedIds.has(spotlightTitle.id) ? "fill-white" : ""}`} />
              <span>{bookmarkedIds.has(spotlightTitle.id) ? "In Watchlist" : "Add to Watchlist"}</span>
            </button>
          </div>
        </div>

        {/* 3D Floating Brand Chips Preview */}
        <div className="hidden xl:block absolute right-10 top-1/2 -translate-y-1/2 pointer-events-none">
          <div className="relative w-72 h-72">
            <div className="absolute top-0 right-4 p-3 rounded-2xl glass-card border border-[#E50914]/40 shadow-xl animate-float-3d" style={{ animationDelay: "0s" }}>
              <div className="text-xs font-black text-[#E50914]">NETFLIX • 4K</div>
            </div>
            <div className="absolute top-20 left-0 p-3 rounded-2xl glass-card border border-[#1DB954]/40 shadow-xl animate-float-3d" style={{ animationDelay: "1.5s" }}>
              <div className="text-xs font-black text-[#1DB954]">SPOTIFY • Hi-Fi</div>
            </div>
            <div className="absolute bottom-16 right-8 p-3 rounded-2xl glass-card border border-[#00A8E1]/40 shadow-xl animate-float-3d" style={{ animationDelay: "3s" }}>
              <div className="text-xs font-black text-[#00A8E1]">PRIME VIDEO • HDR</div>
            </div>
            <div className="absolute bottom-0 left-6 p-3 rounded-2xl glass-card border border-[#0070D1]/40 shadow-xl animate-float-3d" style={{ animationDelay: "4.5s" }}>
              <div className="text-xs font-black text-[#0070D1]">SONY LIV • LIVE</div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Personalized Watchlist & Continue Watching Queue */}
      <section className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 text-indigo-500 dark:text-cyan-400 text-xs font-bold uppercase tracking-wider">
              <Bookmark className="w-4 h-4" />
              <span>Personalized Entertainment Queue</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground mt-0.5">
              My Watchlist & Queue
            </h2>
          </div>
          <Link
            href="/watchlist"
            className="text-xs font-bold text-indigo-500 dark:text-cyan-400 hover:underline flex items-center gap-1 group self-start sm:self-auto"
          >
            <span>Open Full Watchlist Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {isAuthenticated && userWatchlistItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {userWatchlistItems.slice(0, 4).map((item) => {
              const content = item.content;
              if (!content) return null;
              const primaryStream = content.streaming_options?.[0];

              return (
                <Card3D key={item.id} glowColor="rgba(99, 102, 241, 0.35)" className="h-full">
                  <div className="glass-card rounded-2xl overflow-hidden border border-surface-border p-4 flex flex-col justify-between h-full shadow-lg group">
                    <div className="space-y-3">
                      <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-900">
                        <img
                          src={content.backdrop_url || content.poster_url || "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop"}
                          alt={content.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <span className="absolute top-2 left-2 text-[9px] font-black px-2 py-0.5 rounded bg-black/70 text-white uppercase">
                          {item.status}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-foreground line-clamp-1 group-hover:text-indigo-400 transition-colors">
                          {content.title}
                        </h4>
                        <p className="text-[11px] text-foreground-muted line-clamp-2 mt-0.5">
                          {content.description}
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-surface-border/60 flex items-center justify-between">
                      <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
                        <Star className="w-3 h-3 fill-amber-400" />
                        {content.rating.toFixed(1)}
                      </span>
                      {primaryStream ? (
                        <a
                          href={primaryStream.stream_url}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/30 text-xs font-bold flex items-center gap-1 transition-all"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Watch</span>
                        </a>
                      ) : (
                        <Link href="/watchlist" className="text-xs text-indigo-400 font-bold">Details</Link>
                      )}
                    </div>
                  </div>
                </Card3D>
              );
            })}
          </div>
        ) : (
          <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-surface-border flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
            <div className="space-y-2 text-center sm:text-left">
              <h3 className="text-lg font-bold text-foreground">
                {isAuthenticated ? "Your Watchlist is empty" : "Sign in to track your entertainment queue"}
              </h3>
              <p className="text-xs text-foreground-muted max-w-xl">
                Bookmark what you want to watch across 40+ platforms. Keep track of status (Planned, Watching, Completed) and launch official streaming links in one click.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {isAuthenticated ? (
                <Link
                  href="/search"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Discover Titles to Add</span>
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Sign In</span>
                  </Link>
                  <button
                    onClick={handleDemoLogin}
                    className="px-4 py-2.5 rounded-xl glass-card hover:bg-surface border border-surface-border text-foreground font-bold text-xs flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span>1-Click Demo</span>
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </section>

      {/* 4. Trending & Spotlight Content across 40+ Services */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-xs font-bold text-[#E50914] uppercase tracking-widest flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5" />
              Unified Streaming Highlights
            </span>
            <h2 className="text-2xl font-black text-foreground mt-1">
              Trending Across Platforms
            </h2>
            <p className="text-xs text-foreground-muted mt-1">
              Top movies, web series, songs, anime, and podcasts available on verified streaming deep links.
            </p>
          </div>
          <Link
            href="/search"
            className="text-xs font-bold text-indigo-500 dark:text-cyan-400 hover:underline flex items-center gap-1 group self-start sm:self-auto"
          >
            <span>Search Entire Content Engine</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {featuredTitles.slice(0, 4).map((content) => {
            const primaryStream = content.streaming_options?.[0];

            return (
              <Card3D key={content.id} glowColor="rgba(99, 102, 241, 0.35)" className="h-full">
                <div className="glass-card rounded-2xl overflow-hidden border border-surface-border flex flex-col justify-between h-full shadow-lg group">
                  <div className="relative aspect-video overflow-hidden bg-slate-900">
                    <img
                      src={content.backdrop_url || content.poster_url || "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop"}
                      alt={content.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />

                    <span className="absolute top-2.5 left-2.5 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-950/80 text-white border border-white/20 backdrop-blur-sm">
                      {content.content_type}
                    </span>

                    <button
                      onClick={() => handleToggleBookmark(content)}
                      className={`absolute top-2.5 right-2.5 p-1.5 rounded-md border backdrop-blur-md transition-all shadow-sm ${
                        bookmarkedIds.has(content.id)
                          ? "bg-indigo-600 text-white border-indigo-400 scale-105"
                          : "bg-slate-950/80 text-white/80 hover:text-white border-white/20 hover:bg-slate-900"
                      }`}
                      title={bookmarkedIds.has(content.id) ? "Saved in Watchlist" : "Save to Watchlist"}
                    >
                      <Bookmark className={`w-3 h-3 ${bookmarkedIds.has(content.id) ? "fill-white" : ""}`} />
                    </button>

                    <div className="absolute bottom-2 left-2.5 flex items-center gap-2 text-[10px] font-bold text-slate-300">
                      <span className="flex items-center gap-1 text-amber-400 font-black">
                        <Star className="w-3 h-3 fill-amber-400" />
                        {content.rating.toFixed(1)}
                      </span>
                      <span>&middot;</span>
                      <span>{content.duration_minutes > 0 ? `${content.duration_minutes}m` : "Series"}</span>
                    </div>
                  </div>

                  <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-sm text-foreground group-hover:text-indigo-400 transition-colors line-clamp-1">
                        {content.title}
                      </h3>
                      <p className="text-xs text-foreground-muted line-clamp-2 mt-1">
                        {content.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-surface-border">
                      {primaryStream ? (
                        <a
                          href={primaryStream.stream_url}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all"
                        >
                          <Play className="w-3 h-3 fill-white" />
                          <span>Watch on {primaryStream.platform_name}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <Link
                          href={`/search?q=${encodeURIComponent(content.title)}`}
                          className="w-full py-2 px-3 rounded-xl bg-surface-card border border-surface-border text-foreground font-bold text-xs flex items-center justify-center gap-1.5"
                        >
                          <span>Explore Deep Links</span>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </Card3D>
            );
          })}
        </div>
      </section>

      {/* 5. 40+ Platforms Grid with 3D Tilt & Brand Auras */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 text-indigo-500 dark:text-cyan-400 text-xs font-bold uppercase tracking-wider">
              <TrendingUp className="w-4 h-4" />
              <span>Universal Directory</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground mt-0.5">
              40+ Entertainment Services
            </h2>
            <p className="text-xs text-foreground-muted mt-1">
              Hover over any platform card to experience interactive 3D physics and its signature brand aura.
            </p>
          </div>
          <Link
            href="/platforms"
            className="text-xs font-bold text-indigo-500 dark:text-cyan-400 hover:underline flex items-center gap-1 group self-start sm:self-auto"
          >
            <span>View All 43 Catalog Services</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* 3D Platform Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {displayPlatforms.map((platform) => {
            const glow = getBrandGlow(platform.slug);
            const badgeClass = getBrandBadgeColor(platform.slug);

            return (
              <Card3D key={platform.id} glowColor={glow} className="h-full">
                <div className="glass-card rounded-2xl p-5 h-full flex flex-col justify-between space-y-4 border border-surface-border transition-colors">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm border shadow-sm ${badgeClass}`}>
                        {platform.name.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface-card border border-surface-border text-foreground-muted">
                        {platform.pricing_type}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-bold text-sm sm:text-base text-foreground group-hover:text-indigo-400 transition-colors">
                        {platform.name}
                      </h3>
                      <p className="text-[11px] text-foreground-muted line-clamp-2 mt-1 leading-relaxed">
                        {platform.description}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-surface-border/60 flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-foreground-muted uppercase tracking-wider">
                      {platform.integration_type.replace("_", " ")}
                    </span>
                    <a
                      href={platform.official_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-bold text-cyan-500 dark:text-cyan-300 hover:text-cyan-400 transition-colors"
                    >
                      <span>Open</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </Card3D>
            );
          })}
        </div>
      </section>

      {/* 6. Pricing Architecture & AI Credits with 3D Depth */}
      <section id="plans" className="space-y-6">
        <div>
          <span className="text-xs font-bold text-cyan-500 dark:text-cyan-400 uppercase tracking-widest">
            Pricing & Subscription Architecture
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-foreground mt-1">
            NEXPLAY Plans & AI Credit Wallet
          </h2>
          <p className="text-xs text-foreground-muted mt-1">
            NEXPLAY billing covers AI Copilot queries, semantic search, and link health monitoring. (Third-party OTT subscriptions remain separate).
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Free Tier */}
          <Card3D>
            <div className="glass-card rounded-2xl p-6 flex flex-col justify-between space-y-6 h-full border border-surface-border">
              <div className="space-y-4">
                <div>
                  <span className="text-xs font-bold text-foreground-muted uppercase">Base Tier</span>
                  <h3 className="text-xl font-black text-foreground">Free</h3>
                  <div className="mt-2 text-3xl font-black text-foreground">₹0<span className="text-xs font-normal text-foreground-muted">/forever</span></div>
                </div>
                <ul className="space-y-2 text-xs text-foreground-muted">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> 40+ Platform Directory</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Universal Search & Links</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> 50 Monthly AI Credits</li>
                </ul>
              </div>
              <button className="w-full py-2.5 rounded-xl bg-surface-card hover:bg-surface-border text-foreground text-xs font-bold border border-surface-border transition-colors">
                Current Plan
              </button>
            </div>
          </Card3D>

          {/* Starter Tier */}
          <Card3D glowColor="rgba(99, 102, 241, 0.4)">
            <div className="glass-card rounded-2xl p-6 flex flex-col justify-between space-y-6 h-full border border-surface-border">
              <div className="space-y-4">
                <div>
                  <span className="text-xs font-bold text-indigo-400 uppercase">Individual</span>
                  <h3 className="text-xl font-black text-foreground">Starter</h3>
                  <div className="mt-2 text-3xl font-black text-foreground">₹49<span className="text-xs font-normal text-foreground-muted">/month</span></div>
                </div>
                <ul className="space-y-2 text-xs text-foreground-muted">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Personalized Dashboard</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Custom Watchlists</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> 250 Monthly AI Credits</li>
                </ul>
              </div>
              <Link href="/pricing" className="w-full py-2.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/30 text-xs font-bold transition-all text-center">
                Select Starter
              </Link>
            </div>
          </Card3D>

          {/* Plus Tier (Recommended) */}
          <Card3D glowColor="rgba(0, 168, 225, 0.5)">
            <div className="glass-card rounded-2xl p-6 flex flex-col justify-between space-y-6 h-full border-2 border-indigo-500/50 shadow-xl relative">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-400 uppercase">Recommended</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-black shadow-sm">
                    POPULAR
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-black text-foreground">Plus</h3>
                  <div className="mt-2 text-3xl font-black text-foreground">₹149<span className="text-xs font-normal text-foreground-muted">/month</span></div>
                </div>
                <ul className="space-y-2 text-xs text-foreground-muted">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> AI Copilot Assistant</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Usage & Cost Analytics</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> 750 Monthly AI Credits</li>
                </ul>
              </div>
              <Link href="/pricing" className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white text-xs font-bold shadow-md transition-all text-center">
                Upgrade to Plus
              </Link>
            </div>
          </Card3D>

          {/* Pro Tier */}
          <Card3D glowColor="rgba(229, 9, 20, 0.45)">
            <div className="glass-card rounded-2xl p-6 flex flex-col justify-between space-y-6 h-full border border-surface-border">
              <div className="space-y-4">
                <div>
                  <span className="text-xs font-bold text-rose-500 uppercase">Power Hub</span>
                  <h3 className="text-xl font-black text-foreground">Pro</h3>
                  <div className="mt-2 text-3xl font-black text-foreground">₹299<span className="text-xs font-normal text-foreground-muted">/month</span></div>
                </div>
                <ul className="space-y-2 text-xs text-foreground-muted">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> External MCP Server Access</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Playwright Health Checks</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> 2,000 Monthly AI Credits</li>
                </ul>
              </div>
              <Link href="/pricing" className="w-full py-2.5 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/30 text-xs font-bold transition-all text-center">
                Select Pro
              </Link>
            </div>
          </Card3D>
        </div>
      </section>
    </div>
  );
}
