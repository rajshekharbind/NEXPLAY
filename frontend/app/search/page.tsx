"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  Filter,
  Film,
  Music,
  Video,
  Sparkles,
  Headphones,
  ExternalLink,
  Star,
  Clock,
  CheckCircle2,
  SlidersHorizontal,
  X,
  Play,
  Share2,
  Tv,
  Bookmark,
  Check
} from "lucide-react";
import Card3D from "@/components/Card3D";
import { useAuth } from "@/components/AuthContext";
import { toggleWatchlist, fetchWatchlists, API_BASE } from "@/lib/api";

interface StreamingOption {
  platform_name: string;
  platform_slug: string;
  platform_logo?: string;
  availability_type: string;
  pricing_details: string;
  stream_url: string;
}

interface ContentItem {
  id: string;
  title: string;
  slug: string;
  content_type: string;
  description?: string;
  poster_url?: string;
  backdrop_url?: string;
  release_date?: string;
  duration_minutes: number;
  rating: number;
  maturity_rating: string;
  original_language: string;
  view_count: number;
  is_featured: boolean;
  is_free: boolean;
  genres: string[];
  streaming_options: StreamingOption[];
}

interface GenreItem {
  id: string;
  name: string;
  slug: string;
  category_type: string;
}

const CATEGORY_TABS = [
  { label: "All Entertainment", value: "" },
  { label: "Movies", value: "MOVIE", icon: Film },
  { label: "Web Series", value: "SERIES", icon: Tv },
  { label: "Music & Songs", value: "SONG", icon: Music },
  { label: "Anime", value: "ANIME", icon: Sparkles },
  { label: "Podcasts & Audio", value: "PODCAST", icon: Headphones },
  { label: "Videos & Creators", value: "VIDEO", icon: Video },
];

function getBrandBadge(slug: string): { glow: string; text: string; bg: string } {
  if (slug.includes("netflix")) return { glow: "#E50914", text: "text-red-500", bg: "bg-red-500/10 border-red-500/30" };
  if (slug.includes("spotify")) return { glow: "#1DB954", text: "text-emerald-500", bg: "bg-emerald-500/10 border-emerald-500/30" };
  if (slug.includes("youtube")) return { glow: "#FF0033", text: "text-rose-500", bg: "bg-rose-500/10 border-rose-500/30" };
  if (slug.includes("prime")) return { glow: "#00A8E1", text: "text-cyan-500", bg: "bg-cyan-500/10 border-cyan-500/30" };
  if (slug.includes("sony")) return { glow: "#0070D1", text: "text-blue-500", bg: "bg-blue-500/10 border-blue-500/30" };
  if (slug.includes("crunchyroll")) return { glow: "#FF6600", text: "text-orange-500", bg: "bg-orange-500/10 border-orange-500/30" };
  return { glow: "#6366F1", text: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/30" };
}

function SearchCatalogContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Search Parameters from URL
  const initialQuery = searchParams.get("q") || "";
  const initialType = searchParams.get("type") || "";
  const initialGenre = searchParams.get("genre") || "";
  const initialPlatform = searchParams.get("platform") || "";
  const initialIsFree = searchParams.get("is_free") === "true";

  // Component State
  const [query, setQuery] = useState(initialQuery);
  const [selectedType, setSelectedType] = useState(initialType);
  const [selectedGenre, setSelectedGenre] = useState(initialGenre);
  const [selectedPlatform, setSelectedPlatform] = useState(initialPlatform);
  const [isFreeOnly, setIsFreeOnly] = useState(initialIsFree);
  const [sortBy, setSortBy] = useState("rating");

  const [items, setItems] = useState<ContentItem[]>([]);
  const [genres, setGenres] = useState<GenreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeModalItem, setActiveModalItem] = useState<ContentItem | null>(null);

  const { user, token } = useAuth();
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  useEffect(() => {
    async function loadSaved() {
      if (!token) return;
      try {
        const lists = await fetchWatchlists(token);
        const saved = new Set<string>();
        lists.forEach((wl) => wl.items?.forEach((i) => saved.add(i.content_id)));
        setBookmarkedIds(saved);
      } catch (e) {
        // ignore
      }
    }
    loadSaved();
  }, [token]);

  const handleToggleBookmark = async (e: React.MouseEvent, item: ContentItem) => {
    e.stopPropagation();
    if (!token) {
      router.push("/login");
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
    } else if (res?.action === "removed") {
      showToast(`Removed "${item.title}" from Watchlist`);
    }
  };

  // Sync state with URL params if URL changes
  useEffect(() => {
    setQuery(searchParams.get("q") || "");
    setSelectedType(searchParams.get("type") || "");
    setSelectedGenre(searchParams.get("genre") || "");
    setSelectedPlatform(searchParams.get("platform") || "");
    setIsFreeOnly(searchParams.get("is_free") === "true");
  }, [searchParams]);

  // Fetch Genres for filter dropdown
  useEffect(() => {
    async function loadGenres() {
      try {
        const res = await fetch(`${API_BASE}/content/genres`);
        const json = await res.json();
        if (json.success && json.data) {
          setGenres(json.data);
        }
      } catch (e) {
        console.error("Failed to load genres:", e);
      }
    }
    loadGenres();
  }, []);

  // Fetch Content based on current filters
  useEffect(() => {
    async function loadContent() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (query.trim()) params.append("q", query.trim());
        if (selectedType) params.append("content_type", selectedType);
        if (selectedGenre) params.append("genre", selectedGenre);
        if (selectedPlatform) params.append("platform", selectedPlatform);
        if (isFreeOnly) params.append("is_free", "true");
        if (sortBy) params.append("sort_by", sortBy);
        params.append("limit", "36");

        const res = await fetch(`${API_BASE}/content/search?${params.toString()}`);
        const json = await res.json();
        if (json.success && json.data?.items) {
          setItems(json.data.items);
        }
      } catch (e) {
        console.error("Failed to fetch search results:", e);
      } finally {
        setLoading(false);
      }
    }

    loadContent();
  }, [query, selectedType, selectedGenre, selectedPlatform, isFreeOnly, sortBy]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUrl({ q: query, type: selectedType, genre: selectedGenre, platform: selectedPlatform, is_free: isFreeOnly });
  };

  const updateUrl = (updates: { q?: string; type?: string; genre?: string; platform?: string; is_free?: boolean }) => {
    const params = new URLSearchParams();
    const newQ = updates.q !== undefined ? updates.q : query;
    const newType = updates.type !== undefined ? updates.type : selectedType;
    const newGenre = updates.genre !== undefined ? updates.genre : selectedGenre;
    const newPlat = updates.platform !== undefined ? updates.platform : selectedPlatform;
    const newFree = updates.is_free !== undefined ? updates.is_free : isFreeOnly;

    if (newQ.trim()) params.append("q", newQ.trim());
    if (newType) params.append("type", newType);
    if (newGenre) params.append("genre", newGenre);
    if (newPlat) params.append("platform", newPlat);
    if (newFree) params.append("is_free", "true");

    router.push(`/search?${params.toString()}`);
  };

  const handleClearFilters = () => {
    setQuery("");
    setSelectedType("");
    setSelectedGenre("");
    setSelectedPlatform("");
    setIsFreeOnly(false);
    router.push("/search");
  };

  return (
    <div className="min-h-screen space-y-8 pb-20">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-2xl flex items-center gap-2 animate-slide-up border border-indigo-400/30">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Search Header Banner */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-indigo-500 dark:text-cyan-400 text-xs font-black uppercase tracking-wider">
          <Sparkles className="w-4 h-4" />
          <span>Unified Entertainment Search Engine</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-foreground">
          Discover Across 40+ Platforms
        </h1>
        <p className="text-sm text-foreground-muted max-w-2xl leading-relaxed">
          Search movies, web series, songs, anime, and podcasts. Find out exactly where each title is streaming, pricing options, and launch verified deep links with one click.
        </p>

        {/* Global Live Search Bar */}
        <form onSubmit={handleSearchSubmit} className="max-w-3xl relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search titles, actors, genres, or lo-fi beats (e.g. Interstellar, Panchayat, Demon Slayer)..."
            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 rounded-2xl pl-12 pr-28 py-3.5 text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 shadow-md transition-all"
          />
          <button
            type="submit"
            className="absolute right-3 top-1/2 -translate-y-1/2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-xs shadow transition-all hover:scale-105"
          >
            Search
          </button>
        </form>
      </div>

      {/* Category Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar -mx-3 px-3 sm:mx-0 sm:px-0 border-b border-surface-border">
        {CATEGORY_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = selectedType === tab.value;
          return (
            <button
              key={tab.label}
              onClick={() => {
                setSelectedType(tab.value);
                updateUrl({ type: tab.value });
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all ${
                isActive
                  ? "bg-gradient-to-r from-indigo-600 to-cyan-500 text-white shadow-md shadow-indigo-500/25"
                  : "bg-surface-card hover:bg-surface text-foreground-muted hover:text-foreground border border-surface-border"
              }`}
            >
              {Icon && <Icon className="w-3.5 h-3.5" />}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Filter Row: Genre, Platform, Free Only, Sort By */}
      <div className="glass-card p-4 rounded-2xl border border-surface-border flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Genre Filter Dropdown */}
          <select
            value={selectedGenre}
            onChange={(e) => {
              setSelectedGenre(e.target.value);
              updateUrl({ genre: e.target.value });
            }}
            className="bg-surface-card border border-surface-border rounded-xl px-3 py-2 font-bold text-foreground focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Genres</option>
            {genres.map((g) => (
              <option key={g.id} value={g.slug}>
                {g.name}
              </option>
            ))}
          </select>

          {/* Platform Filter Dropdown */}
          <select
            value={selectedPlatform}
            onChange={(e) => {
              setSelectedPlatform(e.target.value);
              updateUrl({ platform: e.target.value });
            }}
            className="bg-surface-card border border-surface-border rounded-xl px-3 py-2 font-bold text-foreground focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Platforms</option>
            <option value="netflix">Netflix</option>
            <option value="prime-video">Prime Video</option>
            <option value="spotify">Spotify</option>
            <option value="youtube">YouTube</option>
            <option value="crunchyroll">Crunchyroll</option>
            <option value="sony-liv">Sony LIV</option>
            <option value="apple-music">Apple Music</option>
          </select>

          {/* Free Only Toggle */}
          <button
            onClick={() => {
              const toggled = !isFreeOnly;
              setIsFreeOnly(toggled);
              updateUrl({ is_free: toggled });
            }}
            className={`px-3 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all border ${
              isFreeOnly
                ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/40"
                : "bg-surface-card text-foreground-muted border-surface-border hover:text-foreground"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Free to Stream</span>
          </button>

          {(query || selectedType || selectedGenre || selectedPlatform || isFreeOnly) && (
            <button
              onClick={handleClearFilters}
              className="px-3 py-2 rounded-xl text-rose-500 hover:bg-rose-500/10 font-bold transition-colors"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Sort Selector */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-semibold hidden sm:inline">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-surface-card border border-surface-border rounded-xl px-3 py-2 font-bold text-foreground focus:outline-none focus:border-indigo-500"
          >
            <option value="rating">Highest Rated</option>
            <option value="release_date">Newest Release</option>
            <option value="views">Most Popular</option>
            <option value="title">Alphabetical (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Results Count Header */}
      <div className="flex items-center justify-between text-xs text-foreground-muted">
        <span>
          Showing <strong className="text-foreground">{items.length}</strong> entertainment titles
          {query && <> matching &quot;<strong className="text-foreground">{query}</strong>&quot;</>}
        </span>
      </div>

      {/* Content Grid */}
      {loading ? (
        <div className="min-h-[40vh] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="glass-card rounded-2xl p-16 text-center border border-surface-border space-y-3">
          <p className="text-lg font-black text-foreground">No entertainment titles match your criteria.</p>
          <p className="text-xs text-foreground-muted">Try removing filters or searching for another title.</p>
          <button
            onClick={handleClearFilters}
            className="mt-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-md"
          >
            Explore All Catalog Titles
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {items.map((item) => {
            const primaryPlatform = item.streaming_options[0];
            const brand = primaryPlatform ? getBrandBadge(primaryPlatform.platform_slug) : { glow: "#6366F1", text: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/30" };

            return (
              <Card3D key={item.id} glowColor={brand.glow} className="h-full">
                <div className="glass-card rounded-2xl overflow-hidden border border-surface-border flex flex-col justify-between h-full group hover:border-slate-500/40 transition-all">
                  {/* Poster Thumbnail */}
                  <div
                    onClick={() => setActiveModalItem(item)}
                    className="relative aspect-video sm:aspect-[16/10] overflow-hidden cursor-pointer bg-slate-900"
                  >
                    {item.poster_url || item.backdrop_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.backdrop_url || item.poster_url}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-indigo-900 to-purple-900 font-black text-2xl text-white">
                        {item.title.slice(0, 2)}
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />

                    {/* Content Type Badge */}
                    <span className="absolute top-2.5 left-2.5 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-950/80 text-white border border-white/20 backdrop-blur-sm">
                      {item.content_type}
                    </span>

                    {/* Rating and Bookmark Badges */}
                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                      <button
                        onClick={(e) => handleToggleBookmark(e, item)}
                        className={`p-1.5 rounded-md border backdrop-blur-md transition-all shadow-sm ${
                          bookmarkedIds.has(item.id)
                            ? "bg-indigo-600 text-white border-indigo-400 scale-105"
                            : "bg-slate-950/80 text-white/80 hover:text-white border-white/20 hover:bg-slate-900"
                        }`}
                        title={bookmarkedIds.has(item.id) ? "Saved in Watchlist" : "Save to Watchlist"}
                      >
                        <Bookmark className={`w-3 h-3 ${bookmarkedIds.has(item.id) ? "fill-white" : ""}`} />
                      </button>
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-950/80 text-amber-400 border border-amber-400/30 backdrop-blur-sm text-[11px] font-black">
                        <Star className="w-3 h-3 fill-amber-400" />
                        <span>{item.rating.toFixed(1)}</span>
                      </div>
                    </div>

                    {/* Free or Duration Tag */}
                    <div className="absolute bottom-2 left-2.5 flex items-center gap-2 text-[10px] font-bold text-slate-300">
                      {item.is_free ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-500 text-slate-950 font-black">
                          FREE
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{item.duration_minutes > 0 ? `${item.duration_minutes}m` : "Series"}</span>
                        </span>
                      )}
                      <span>&middot;</span>
                      <span className="uppercase">{item.original_language}</span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <h3
                        onClick={() => setActiveModalItem(item)}
                        className="font-bold text-sm sm:text-base text-foreground group-hover:text-indigo-400 transition-colors line-clamp-1 cursor-pointer"
                      >
                        {item.title}
                      </h3>

                      {/* Genres Pills */}
                      <div className="flex flex-wrap gap-1">
                        {item.genres.slice(0, 3).map((g) => (
                          <span
                            key={g}
                            className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-surface border border-surface-border text-foreground-muted"
                          >
                            {g}
                          </span>
                        ))}
                      </div>

                      <p className="text-xs text-foreground-muted line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    {/* Streaming Platform Launch Buttons */}
                    <div className="pt-3 border-t border-surface-border space-y-2">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                        Available On:
                      </span>

                      {item.streaming_options.length === 0 ? (
                        <span className="text-xs text-slate-500 italic">Catalog listing</span>
                      ) : (
                        <div className="space-y-1.5">
                          {item.streaming_options.map((opt) => (
                            <a
                              key={opt.platform_slug}
                              href={opt.stream_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full py-2 px-3 rounded-xl bg-surface hover:bg-surface-card border border-surface-border hover:border-indigo-500/50 text-xs font-bold text-foreground flex items-center justify-between transition-all group/btn"
                            >
                              <div className="flex items-center gap-2">
                                <Play className="w-3 h-3 text-indigo-400 group-hover/btn:scale-110 transition-transform" />
                                <span>{opt.platform_name}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-slate-400 font-normal">
                                  {opt.pricing_details}
                                </span>
                                <ExternalLink className="w-3 h-3 text-slate-400" />
                              </div>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card3D>
            );
          })}
        </div>
      )}

      {/* Quick View Details Modal */}
      {activeModalItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card max-w-2xl w-full rounded-3xl border border-surface-border overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Backdrop Banner */}
            <div className="relative aspect-video w-full bg-slate-900">
              {activeModalItem.backdrop_url || activeModalItem.poster_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={activeModalItem.backdrop_url || activeModalItem.poster_url}
                  alt={activeModalItem.title}
                  className="w-full h-full object-cover"
                />
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
              <button
                onClick={() => setActiveModalItem(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-slate-950/80 text-white hover:bg-slate-900 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="absolute bottom-4 left-6 right-6 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-indigo-600 text-white">
                    {activeModalItem.content_type}
                  </span>
                  <div className="flex items-center gap-1 text-xs font-black text-amber-400">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>{activeModalItem.rating.toFixed(1)} / 10</span>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-2xl sm:text-3xl font-black text-white line-clamp-1">
                    {activeModalItem.title}
                  </h2>
                  <button
                    onClick={(e) => handleToggleBookmark(e, activeModalItem)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all shrink-0 ${
                      bookmarkedIds.has(activeModalItem.id)
                        ? "bg-indigo-600 text-white border-indigo-400 shadow-md"
                        : "bg-surface-card text-foreground hover:bg-surface border-surface-border"
                    }`}
                  >
                    <Bookmark className={`w-3.5 h-3.5 ${bookmarkedIds.has(activeModalItem.id) ? "fill-white" : ""}`} />
                    <span>{bookmarkedIds.has(activeModalItem.id) ? "Saved" : "Save"}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 overflow-y-auto">
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span>Release: {activeModalItem.release_date || "2024"}</span>
                <span>&middot;</span>
                <span>Duration: {activeModalItem.duration_minutes > 0 ? `${activeModalItem.duration_minutes} min` : "Episodes"}</span>
                <span>&middot;</span>
                <span>Maturity: {activeModalItem.maturity_rating}</span>
                <span>&middot;</span>
                <span>Language: {activeModalItem.original_language.toUpperCase()}</span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {activeModalItem.genres.map((g) => (
                  <span
                    key={g}
                    className="text-xs font-bold px-2.5 py-1 rounded-lg bg-surface border border-surface-border text-foreground"
                  >
                    {g}
                  </span>
                ))}
              </div>

              <p className="text-xs sm:text-sm text-foreground-muted leading-relaxed">
                {activeModalItem.description}
              </p>

              {/* Streaming Destinations */}
              <div className="pt-4 border-t border-surface-border space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Where to Watch & Listen:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {activeModalItem.streaming_options.map((opt) => (
                    <a
                      key={opt.platform_slug}
                      href={opt.stream_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 rounded-xl bg-surface-card hover:bg-surface border border-surface-border hover:border-indigo-500/50 flex items-center justify-between transition-all"
                    >
                      <div>
                        <div className="font-bold text-xs text-foreground flex items-center gap-1.5">
                          <span>{opt.platform_name}</span>
                          <ExternalLink className="w-3 h-3 text-indigo-400" />
                        </div>
                        <span className="text-[11px] text-slate-400">{opt.pricing_details}</span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                        LAUNCH
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <SearchCatalogContent />
    </Suspense>
  );
}
