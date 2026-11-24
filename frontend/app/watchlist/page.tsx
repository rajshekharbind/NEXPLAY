"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Bookmark,
  Play,
  CheckCircle2,
  Clock,
  Check,
  Trash2,
  Plus,
  Star,
  ExternalLink,
  Film,
  Tv,
  Music,
  Sparkles,
  Headphones,
  SlidersHorizontal,
  ChevronDown,
  MessageSquare,
  AlertCircle,
  LogIn,
  Search
} from "lucide-react";
import { useAuth } from "@/components/AuthContext";
import Card3D from "@/components/Card3D";
import { Watchlist, WatchlistItem, WatchlistStatus, ContentType } from "@/types";
import { fetchWatchlists, createWatchlist, updateWatchlistItem, deleteWatchlistItem } from "@/lib/api";

const STATUS_FILTERS: { label: string; value: WatchlistStatus | "ALL"; icon: any; color: string }[] = [
  { label: "All Items", value: "ALL", icon: Bookmark, color: "text-foreground" },
  { label: "Planned", value: "PLANNED", icon: Clock, color: "text-amber-400" },
  { label: "Watching", value: "WATCHING", icon: Play, color: "text-indigo-400" },
  { label: "Completed", value: "COMPLETED", icon: CheckCircle2, color: "text-emerald-400" },
  { label: "Dropped", value: "DROPPED", icon: Trash2, color: "text-rose-400" },
];

export default function WatchlistPage() {
  const { user, token, isAuthenticated, isLoading: authLoading, login } = useAuth();
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [activeWatchlistId, setActiveWatchlistId] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<WatchlistStatus | "ALL">("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [notesInput, setNotesInput] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    if (token) {
      loadWatchlists();
    } else {
      setLoading(false);
    }
  }, [token]);

  async function loadWatchlists() {
    if (!token) return;
    setLoading(true);
    try {
      const data = await fetchWatchlists(token);
      setWatchlists(data);
      if (data.length > 0 && !activeWatchlistId) {
        const defaultList = data.find((w) => w.is_default) || data[0];
        setActiveWatchlistId(defaultList.id);
      }
    } catch (err) {
      console.error("Watchlists load error:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleCreateWatchlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newListName.trim()) return;
    const res = await createWatchlist(token, newListName.trim());
    if (res) {
      setWatchlists((prev) => [...prev, res]);
      setActiveWatchlistId(res.id);
      setNewListName("");
      setIsCreatingList(false);
      showToast(`Created watchlist "${res.name}"`);
    }
  };

  const handleStatusChange = async (itemId: string, newStatus: WatchlistStatus) => {
    if (!token) return;
    // Optimistic update
    setWatchlists((prev) =>
      prev.map((wl) => ({
        ...wl,
        items: wl.items.map((item) => (item.id === itemId ? { ...item, status: newStatus } : item)),
      }))
    );
    const updated = await updateWatchlistItem(token, itemId, { status: newStatus });
    if (updated) {
      showToast(`Status updated to ${newStatus}`);
    }
  };

  const handleRatingChange = async (itemId: string, rating: number) => {
    if (!token) return;
    setWatchlists((prev) =>
      prev.map((wl) => ({
        ...wl,
        items: wl.items.map((item) => (item.id === itemId ? { ...item, personal_rating: rating } : item)),
      }))
    );
    await updateWatchlistItem(token, itemId, { personal_rating: rating });
    showToast(`Rated ${rating}/10`);
  };

  const handleSaveNotes = async (itemId: string) => {
    if (!token) return;
    setWatchlists((prev) =>
      prev.map((wl) => ({
        ...wl,
        items: wl.items.map((item) => (item.id === itemId ? { ...item, notes: notesInput } : item)),
      }))
    );
    await updateWatchlistItem(token, itemId, { notes: notesInput });
    setEditingNotesId(null);
    showToast("Notes saved");
  };

  const handleDeleteItem = async (itemId: string, title?: string) => {
    if (!token) return;
    setWatchlists((prev) =>
      prev.map((wl) => ({
        ...wl,
        items: wl.items.filter((item) => item.id !== itemId),
        items_count: Math.max(0, wl.items.length - 1),
      }))
    );
    const ok = await deleteWatchlistItem(token, itemId);
    if (ok) {
      showToast(`Removed ${title || "item"} from watchlist`);
    }
  };

  const handleDemoLogin = async () => {
    await login("admin@nexplay.com", "AdminMasterKey2026!");
  };

  // Auth Guard
  if (!authLoading && !isAuthenticated) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center py-12 px-4">
        <Card3D glowColor="rgba(99, 102, 241, 0.45)" className="w-full max-w-lg">
          <div className="glass-card rounded-3xl p-8 sm:p-10 border border-surface-border text-center space-y-6 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#E50914] via-[#0070D1] to-[#1DB954] p-[1.5px] mx-auto shadow-xl">
              <div className="w-full h-full rounded-[14px] bg-surface flex items-center justify-center">
                <Bookmark className="w-8 h-8 text-indigo-500 dark:text-cyan-400" />
              </div>
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-black text-foreground">
                Your Private Watchlist
              </h1>
              <p className="text-xs sm:text-sm text-foreground-muted leading-relaxed">
                Save movies, series, anime, songs, and podcasts from 40+ platforms into a single unified queue. Track what you're planning, watching, and completed.
              </p>
            </div>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/login"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In to NEXPLAY</span>
              </Link>
              <button
                onClick={handleDemoLogin}
                className="w-full sm:w-auto px-6 py-3 rounded-xl glass-card hover:bg-surface border border-surface-border text-foreground font-bold text-xs flex items-center justify-center gap-2 transition-all"
              >
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>1-Click Demo Login</span>
              </button>
            </div>
          </div>
        </Card3D>
      </div>
    );
  }

  const activeWatchlist = watchlists.find((w) => w.id === activeWatchlistId) || watchlists[0];
  const items = activeWatchlist?.items || [];

  // Filter items
  const filteredItems = items.filter((item) => {
    if (statusFilter !== "ALL" && item.status !== statusFilter) return false;
    if (typeFilter !== "ALL" && item.content?.content_type !== typeFilter) return false;
    return true;
  });

  return (
    <div className="space-y-8 pb-20 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-2xl flex items-center gap-2 animate-slide-up border border-indigo-400/30">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & Watchlist Selector */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-surface-border shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-500 dark:text-cyan-400 uppercase tracking-wider">
              <Bookmark className="w-4 h-4" />
              <span>Unified Private Queue</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-foreground tracking-tight">
              {activeWatchlist?.name || "My Watchlist"}
            </h1>
            <p className="text-xs text-foreground-muted">
              Organize your entertainment destinations, track watching progress, and launch direct platform streams.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsCreatingList(!isCreatingList)}
              className="px-4 py-2 rounded-xl bg-surface-card hover:bg-surface border border-surface-border text-foreground font-bold text-xs flex items-center gap-2 transition-all shadow-sm"
            >
              <Plus className="w-4 h-4 text-indigo-400" />
              <span>New List</span>
            </button>
            <Link
              href="/search"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md"
            >
              <Search className="w-4 h-4" />
              <span>Add Titles</span>
            </Link>
          </div>
        </div>

        {/* Create List Input Modal / Drawer */}
        {isCreatingList && (
          <form onSubmit={handleCreateWatchlist} className="p-4 rounded-2xl bg-surface-card/60 border border-surface-border flex flex-col sm:flex-row items-center gap-3 animate-fade-in">
            <input
              type="text"
              placeholder="e.g. Weekend Anime Binge, Late Night Movies..."
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-surface border border-surface-border text-xs text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-indigo-500"
              autoFocus
            />
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-500 transition-colors"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => setIsCreatingList(false)}
                className="px-3 py-2.5 rounded-xl bg-surface text-foreground-muted hover:text-foreground font-bold text-xs"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Watchlist Tabs */}
        {watchlists.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {watchlists.map((wl) => (
              <button
                key={wl.id}
                onClick={() => setActiveWatchlistId(wl.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                  activeWatchlistId === wl.id
                    ? "bg-gradient-to-r from-indigo-600/20 to-cyan-600/10 text-indigo-400 dark:text-cyan-300 border-indigo-500/40 shadow-sm"
                    : "glass-card text-foreground-muted hover:text-foreground border-surface-border"
                }`}
              >
                {wl.name} ({wl.items?.length || 0})
              </button>
            ))}
          </div>
        )}

        {/* Status Filter Navigation (Horizontal swipeable on mobile) */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-2 border-t border-surface-border/50 -mx-3 px-3 sm:mx-0 sm:px-0 sm:flex-wrap">
          {STATUS_FILTERS.map((tab) => {
            const Icon = tab.icon;
            const count =
              tab.value === "ALL"
                ? items.length
                : items.filter((i) => i.status === tab.value).length;
            const isSelected = statusFilter === tab.value;

            return (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border shrink-0 ${
                  isSelected
                    ? "bg-indigo-600 text-white border-indigo-500 shadow-md scale-105"
                    : "bg-surface-card/60 text-foreground-muted hover:text-foreground hover:bg-surface border-surface-border"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? "text-white" : tab.color}`} />
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? "bg-white/20 text-white" : "bg-surface border border-surface-border text-foreground-muted"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Items Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-72 rounded-2xl glass-card border border-surface-border animate-pulse bg-surface-card/40" />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-3xl glass-panel border border-surface-border p-12 text-center space-y-4 shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-surface-card flex items-center justify-center mx-auto border border-surface-border text-foreground-muted">
            <Bookmark className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-foreground">
            No titles in this section
          </h3>
          <p className="text-xs text-foreground-muted max-w-md mx-auto">
            {statusFilter === "ALL"
              ? "Your watchlist is empty. Search across 40+ entertainment destinations to bookmark movies, anime, series, and songs."
              : `No titles are currently marked as '${statusFilter}'. Update an item's status or add more from the catalog.`}
          </p>
          <div className="pt-2">
            <Link
              href="/search"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Explore Content Catalog</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map((item) => {
            const content = item.content;
            if (!content) return null;

            return (
              <Card3D key={item.id} glowColor="rgba(99, 102, 241, 0.35)" className="h-full">
                <div className="glass-card rounded-2xl overflow-hidden border border-surface-border flex flex-col justify-between h-full shadow-lg group">
                  {/* Poster & Badges */}
                  <div className="relative aspect-[16/10] overflow-hidden bg-surface">
                    <img
                      src={content.poster_url || "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop"}
                      alt={content.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

                    {/* Content Type Badge */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-white border border-white/20">
                        {content.content_type}
                      </span>
                    </div>

                    {/* Remove Action */}
                    <button
                      onClick={() => handleDeleteItem(item.id, content.title)}
                      className="absolute top-3 right-3 w-7 h-7 rounded-lg bg-black/60 backdrop-blur-md hover:bg-rose-600 text-white/80 hover:text-white flex items-center justify-center transition-colors shadow-sm"
                      title="Remove from watchlist"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Bottom Metadata inside Poster */}
                    <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[11px] text-white/90 font-semibold">
                      <span className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        {content.rating.toFixed(1)}
                      </span>
                      <span>{content.duration_minutes}m</span>
                      <span className="px-1.5 py-0.5 rounded bg-white/20 text-[9px] uppercase font-bold">
                        {content.maturity_rating}
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-1.5">
                      <h3 className="font-bold text-sm text-foreground line-clamp-1 group-hover:text-indigo-400 transition-colors">
                        {content.title}
                      </h3>
                      <p className="text-[11px] text-foreground-muted line-clamp-2">
                        {content.description || "No description provided."}
                      </p>
                    </div>

                    {/* Status & Rating Selector */}
                    <div className="space-y-2 pt-2 border-t border-surface-border/50">
                      <div className="flex items-center justify-between gap-2">
                        {/* Status Select */}
                        <div className="relative flex-1">
                          <select
                            value={item.status}
                            onChange={(e) => handleStatusChange(item.id, e.target.value as WatchlistStatus)}
                            className="w-full text-[11px] font-bold px-2.5 py-1.5 rounded-lg bg-surface-card border border-surface-border text-foreground focus:outline-none focus:border-indigo-500 appearance-none cursor-pointer"
                          >
                            <option value="PLANNED">Planned</option>
                            <option value="WATCHING">Watching</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="DROPPED">Dropped</option>
                          </select>
                          <ChevronDown className="w-3 h-3 text-foreground-muted absolute right-2 top-2.5 pointer-events-none" />
                        </div>

                        {/* Personal Rating */}
                        <div className="flex items-center gap-1 bg-surface-card px-2 py-1.5 rounded-lg border border-surface-border">
                          <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />
                          <select
                            value={item.personal_rating || 0}
                            onChange={(e) => handleRatingChange(item.id, parseFloat(e.target.value))}
                            className="text-[11px] font-bold bg-transparent text-foreground focus:outline-none cursor-pointer"
                          >
                            <option value="0">Score</option>
                            {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((n) => (
                              <option key={n} value={n}>{n}/10</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Notes Section */}
                      {editingNotesId === item.id ? (
                        <div className="space-y-1.5 pt-1">
                          <textarea
                            value={notesInput}
                            onChange={(e) => setNotesInput(e.target.value)}
                            placeholder="Add your thoughts or favorite episode..."
                            className="w-full p-2 text-xs rounded-lg bg-surface border border-surface-border text-foreground focus:outline-none focus:border-indigo-500"
                            rows={2}
                          />
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setEditingNotesId(null)}
                              className="px-2 py-1 rounded text-[10px] text-foreground-muted hover:text-foreground"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleSaveNotes(item.id)}
                              className="px-2 py-1 rounded bg-indigo-600 text-white text-[10px] font-bold"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingNotesId(item.id);
                            setNotesInput(item.notes || "");
                          }}
                          className="w-full text-left text-[11px] text-foreground-muted hover:text-foreground flex items-center gap-1.5 py-1 px-1 rounded hover:bg-surface transition-colors"
                        >
                          <MessageSquare className="w-3 h-3 text-indigo-400 shrink-0" />
                          <span className="truncate italic">
                            {item.notes ? `"${item.notes}"` : "+ Add private note"}
                          </span>
                        </button>
                      )}
                    </div>

                    {/* Deep-Link Launch Button */}
                    {content.streaming_options && content.streaming_options.length > 0 ? (
                      <a
                        href={content.streaming_options[0].stream_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md group/btn transition-all"
                      >
                        <Play className="w-3.5 h-3.5 fill-white" />
                        <span>Watch on {content.streaming_options[0].platform_name}</span>
                        <ExternalLink className="w-3 h-3 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                      </a>
                    ) : (
                      <div className="w-full py-2 px-3 rounded-xl bg-surface-card border border-surface-border text-foreground-muted font-bold text-xs text-center">
                        Availability Checking
                      </div>
                    )}
                  </div>
                </div>
              </Card3D>
            );
          })}
        </div>
      )}
    </div>
  );
}
