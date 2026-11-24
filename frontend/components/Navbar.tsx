"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Search, 
  Compass, 
  Sparkles, 
  PlaySquare, 
  X, 
  LogIn, 
  UserPlus, 
  User, 
  LogOut, 
  ChevronDown, 
  Zap, 
  Sliders, 
  Bookmark,
  Menu,
  Film,
  Tv,
  Music,
  Headphones,
  Video,
  Bot,
  Terminal,
  Activity,
  CreditCard,
  Layers
} from "lucide-react";
import { useState } from "react";
import ThemeToggle from "./ThemeToggle";
import { useAuth } from "./AuthContext";
import EntertainmentMenuModal from "./EntertainmentMenuModal";

export default function Navbar() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showEntertainmentDropdown, setShowEntertainmentDropdown] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isEntertainmentModalOpen, setIsEntertainmentModalOpen] = useState(false);
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push("/search");
    }
    setIsMobileDrawerOpen(false);
  };

  const handleClear = () => {
    setSearchQuery("");
  };

  const handleLogout = () => {
    logout();
    setShowProfileMenu(false);
    setIsMobileDrawerOpen(false);
    router.push("/");
  };

  const userInitials = user?.profile?.full_name
    ? user.profile.full_name.slice(0, 2).toUpperCase()
    : user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : "NP";

  return (
    <header className="sticky top-0 z-50 w-full glass-panel border-b border-surface-border transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Mobile Hamburger Drawer Trigger (Left side on mobile) */}
        <button
          onClick={() => setIsMobileDrawerOpen(true)}
          className="p-2 -ml-1 rounded-xl text-slate-400 hover:text-foreground hover:bg-surface-elevated md:hidden transition-colors focus:outline-none"
          aria-label="Open Navigation Drawer"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Brand Logo with 3D Iridescent Streaming Mesh */}
        <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group shrink-0">
          <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-[#E50914] via-[#0070D1] to-[#1DB954] p-[1.5px] shadow-lg group-hover:scale-105 transition-transform duration-300">
            <div className="w-full h-full rounded-[10px] bg-surface flex items-center justify-center">
              <PlaySquare className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500 dark:text-cyan-400 group-hover:scale-110 transition-transform" />
            </div>
            {/* Ambient Brand Light Ring */}
            <span className="absolute -inset-1 rounded-xl bg-gradient-to-r from-red-600 via-blue-600 to-emerald-500 opacity-30 dark:opacity-45 blur-sm group-hover:opacity-75 transition-opacity -z-10" />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-lg sm:text-xl font-black tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-[#E50914] via-[#00A8E1] to-[#1DB954]">
                NEXPLAY
              </span>
              <span className="text-[8px] sm:text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-500/30">
                PRO
              </span>
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 hidden sm:inline-block -mt-1 font-semibold">
              Unified Entertainment Hub
            </span>
          </div>
        </Link>

        {/* Global Search Bar (Tablet / Laptop / Desktop) */}
        <div className="flex-1 max-w-lg hidden sm:block">
          <form onSubmit={handleSearchSubmit} className="relative group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 dark:text-slate-400 group-focus-within:text-indigo-600 dark:group-focus-within:text-cyan-400 transition-colors pointer-events-none" />
            
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search movies, songs, anime across 40+ platforms..."
              className="w-full bg-white dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700/80 rounded-xl pl-10 pr-16 py-2 text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 dark:focus:border-cyan-400 focus:ring-2 focus:ring-indigo-500/20 dark:focus:ring-cyan-400/20 transition-all shadow-sm"
            />

            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <kbd className="hidden md:inline-flex text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-mono">
                ↵
              </kbd>
            </div>
          </form>
        </div>

        {/* Action Controls, AI Credits, Auth & Dark/Light Toggle */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Mobile Entertainment Menu Trigger Button */}
          <button
            type="button"
            onClick={() => setIsEntertainmentModalOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 dark:text-red-400 text-xs font-bold sm:hidden active:scale-95 transition-all cursor-pointer"
            aria-label="Open Entertainment Menu"
          >
            <Film className="w-3.5 h-3.5 text-red-500" />
            <span>Menu</span>
          </button>

          {/* Desktop Entertainment Dropdown */}
          <div className="relative hidden md:block">
            <button
              type="button"
              onClick={() => setShowEntertainmentDropdown(!showEntertainmentDropdown)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
            >
              <Film className="w-3.5 h-3.5 text-red-500" />
              <span>Entertainment</span>
              <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${showEntertainmentDropdown ? "rotate-180" : ""}`} />
            </button>

            {showEntertainmentDropdown && (
              <div 
                className="absolute left-0 mt-2 w-72 rounded-2xl glass-panel border border-surface-border shadow-2xl p-2.5 space-y-1 z-50 animate-in fade-in zoom-in-95 duration-150"
                onMouseLeave={() => setShowEntertainmentDropdown(false)}
              >
                <div className="px-2 py-1.5 border-b border-surface-border flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Entertainment Categories
                  </span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                    40+ APPS
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-1 pt-1">
                  {[
                    { name: "Movies & OTT", href: "/search?type=MOVIE", icon: Film, color: "text-red-500", desc: "Blockbusters & cinema" },
                    { name: "Web Series", href: "/search?type=SERIES", icon: Tv, color: "text-blue-500", desc: "Binge-worthy shows" },
                    { name: "Music & Audio", href: "/search?type=SONG", icon: Music, color: "text-emerald-400", desc: "Songs & playlists" },
                    { name: "Anime Universe", href: "/search?type=ANIME", icon: Sparkles, color: "text-orange-400", desc: "Simulcasts & classics" },
                    { name: "Podcasts & Shows", href: "/search?type=PODCAST", icon: Headphones, color: "text-cyan-400", desc: "Talk shows & tech" },
                    { name: "Videos & Creators", href: "/search?type=VIDEO", icon: Video, color: "text-purple-400", desc: "Trailers & docuseries" },
                    { name: "40+ Platforms", href: "/platforms", icon: Compass, color: "text-indigo-400", desc: "All 43 destinations" },
                  ].map((cat) => {
                    const Icon = cat.icon;
                    return (
                      <Link
                        key={cat.name}
                        href={cat.href}
                        onClick={() => setShowEntertainmentDropdown(false)}
                        className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
                      >
                        <Icon className={`w-4 h-4 ${cat.color}`} />
                        <div className="flex-1">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-100 group-hover:text-cyan-400 transition-colors">
                            {cat.name}
                          </p>
                          <p className="text-[10px] text-slate-400">{cat.desc}</p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Quick Search Button on Mobile */}
          <Link
            href="/search"
            className="p-2 rounded-xl text-slate-400 hover:text-foreground sm:hidden"
            aria-label="Search"
          >
            <Search className="w-4 h-4 text-cyan-400" />
          </Link>

          <Link
            href="/search"
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-all"
          >
            <Search className="w-3.5 h-3.5 text-indigo-500 dark:text-cyan-400" />
            <span>Search</span>
          </Link>

          <Link
            href="/platforms"
            className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-all"
          >
            <Compass className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400" />
            <span>40+ Services</span>
          </Link>

          <Link
            href="/pricing"
            className="hidden lg:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-all"
          >
            <span>Pricing</span>
          </Link>

          {/* AI Copilot Quick Access Button */}
          <Link
            href="/ai"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs font-extrabold text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:brightness-110 shadow-sm transition-all"
            title="AI Entertainment Copilot"
          >
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span className="hidden sm:inline">AI Copilot</span>
          </Link>

          {/* AI Credit Wallet Badge - links to /billing */}
          <Link
            href={isAuthenticated ? "/billing" : "/pricing"}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-indigo-50 dark:bg-slate-900 border border-indigo-200 dark:border-indigo-500/30 text-xs shadow-sm hover:border-indigo-400 transition-all cursor-pointer group"
          >
            <Sparkles className="w-3 h-3 text-indigo-500 dark:text-indigo-400 animate-pulse group-hover:scale-110 transition-transform" />
            <span className="text-slate-600 dark:text-slate-400 font-medium hidden sm:inline">Credits:</span>
            <span className="text-indigo-600 dark:text-cyan-300 font-black text-xs">
              {user?.wallet?.balance_credits ?? 100}
            </span>
          </Link>

          {/* Dark / Light Mode Switcher */}
          <ThemeToggle />

          {/* User Auth Controls */}
          {isAuthenticated && user ? (
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-1.5 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none"
              >
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 p-[1.5px] cursor-pointer hover:scale-105 transition-transform shadow-sm">
                  <div className="w-full h-full rounded-[10px] bg-white dark:bg-slate-900 flex items-center justify-center text-[11px] font-black text-indigo-600 dark:text-indigo-400">
                    {userInitials}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 hidden sm:block" />
              </button>

              {/* Profile Dropdown Menu */}
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl glass-panel border border-surface-border shadow-2xl p-2 space-y-1 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="p-2.5 border-b border-surface-border">
                    <p className="text-xs font-bold text-foreground truncate">
                      {user.profile?.full_name || user.email}
                    </p>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 font-bold">
                      {user.role}
                    </span>
                  </div>

                  <Link
                    href="/watchlist"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-foreground-muted hover:text-foreground hover:bg-surface-card transition-colors"
                  >
                    <Bookmark className="w-3.5 h-3.5 text-indigo-400" />
                    <span>My Watchlist Queue</span>
                  </Link>

                  <Link
                    href="/profile"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-foreground-muted hover:text-foreground hover:bg-surface-card transition-colors"
                  >
                    <User className="w-3.5 h-3.5 text-cyan-400" />
                    <span>My Profile & Preferences</span>
                  </Link>

                  <Link
                    href="/billing"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-foreground-muted hover:text-foreground hover:bg-surface-card transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>AI Credits & Billing</span>
                  </Link>

                  <Link
                    href="/pricing"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-foreground-muted hover:text-foreground hover:bg-surface-card transition-colors"
                  >
                    <Zap className="w-3.5 h-3.5 text-red-500" />
                    <span>Upgrade Plan</span>
                  </Link>

                  {(user.role === "ADMIN" || user.role === "SUPER_ADMIN") && (
                    <Link
                      href="/admin/platforms"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-amber-500 dark:text-amber-400 hover:bg-amber-500/10 transition-colors"
                    >
                      <Sliders className="w-3.5 h-3.5 text-amber-500" />
                      <span>Admin Management</span>
                    </Link>
                  )}

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-500 hover:bg-rose-500/10 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Link
                href="/login"
                className="px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-xs shadow-md transition-all hover:scale-[1.02]"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Sign Up</span>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* SLIDE-OVER MOBILE DRAWER (For Smartphones & Android Devices) */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div 
            onClick={() => setIsMobileDrawerOpen(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
          />

          {/* Drawer Menu */}
          <div className="relative w-full max-w-xs bg-slate-950 border-r border-slate-800 h-full flex flex-col justify-between p-5 z-10 shadow-2xl overflow-y-auto">
            <div className="space-y-6">
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#E50914] via-[#0070D1] to-[#1DB954] p-[1px]">
                    <div className="w-full h-full rounded-[9px] bg-slate-950 flex items-center justify-center">
                      <PlaySquare className="w-4 h-4 text-cyan-400" />
                    </div>
                  </div>
                  <span className="font-black text-lg text-white">NEXPLAY</span>
                </div>
                <button 
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile Search */}
              <form onSubmit={handleSearchSubmit} className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search 40+ platforms..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </form>

              {/* Categories */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 px-2">
                  Entertainment
                </span>
                <nav className="space-y-1">
                  {[
                    { name: "Discover Hub", href: "/", icon: PlaySquare },
                    { name: "Movies & OTT", href: "/search?type=MOVIE", icon: Film, color: "text-red-500" },
                    { name: "Web Series", href: "/search?type=SERIES", icon: Tv, color: "text-blue-500" },
                    { name: "Music & Audio", href: "/search?type=SONG", icon: Music, color: "text-emerald-400" },
                    { name: "Anime Universe", href: "/search?type=ANIME", icon: Sparkles, color: "text-orange-400" },
                    { name: "Podcasts & Audio", href: "/search?type=PODCAST", icon: Headphones, color: "text-cyan-400" },
                    { name: "Videos & Creators", href: "/search?type=VIDEO", icon: Video, color: "text-rose-500" },
                    { name: "40+ Platform Directory", href: "/platforms", icon: Compass, color: "text-indigo-400" },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setIsMobileDrawerOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-900 transition-colors"
                      >
                        <Icon className={`w-4 h-4 ${item.color || "text-slate-400"}`} />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>

              {/* Tools & Hub */}
              <div className="space-y-1.5 pt-3 border-t border-slate-800/80">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 px-2">
                  Personal Hub
                </span>
                <nav className="space-y-1">
                  {[
                    { name: "AI Copilot", href: "/ai", icon: Bot, color: "text-purple-400" },
                    { name: "My Watchlist", href: "/watchlist", icon: Bookmark, color: "text-indigo-400" },
                    { name: "Wallet & Spending", href: "/billing", icon: CreditCard, color: "text-emerald-400" },
                    { name: "MCP Server Tools", href: "/mcp", icon: Terminal, color: "text-cyan-400" },
                    { name: "Automation & Sentinels", href: "/automation", icon: Activity, color: "text-amber-400" },
                    { name: "Subscription Plans", href: "/pricing", icon: Zap, color: "text-red-400" },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setIsMobileDrawerOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-900 transition-colors"
                      >
                        <Icon className={`w-4 h-4 ${item.color}`} />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>
            </div>

            {/* Drawer Footer (User Info & Actions) */}
            <div className="pt-4 border-t border-slate-800 space-y-3">
              {isAuthenticated && user ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-2">
                    <span className="text-xs font-bold text-white truncate max-w-[150px]">
                      {user.profile?.full_name || user.email}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 font-bold">
                      {user.wallet?.balance_credits ?? 100} credits
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/login"
                    onClick={() => setIsMobileDrawerOpen(false)}
                    className="py-2.5 rounded-xl text-center text-xs font-bold text-slate-300 bg-slate-900 hover:bg-slate-800 transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setIsMobileDrawerOpen(false)}
                    className="py-2.5 rounded-xl text-center text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-cyan-500 hover:opacity-95 shadow-md"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Interactive Entertainment Menu Modal (Mobile Bottom Sheet / Desktop Modal) */}
      <EntertainmentMenuModal 
        isOpen={isEntertainmentModalOpen} 
        onClose={() => setIsEntertainmentModalOpen(false)} 
      />
    </header>
  );
}
