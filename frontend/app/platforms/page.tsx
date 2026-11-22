"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ExternalLink, Compass, Search, Filter } from "lucide-react";
import Link from "next/link";
import Card3D from "@/components/Card3D";
import { FALLBACK_PLATFORMS, FALLBACK_CATEGORIES } from "@/lib/constants";
import { Platform, PlatformCategory } from "@/types";

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
  return "text-indigo-500 bg-indigo-500/10 border-indigo-500/30";
}

function PlatformsDirectoryContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const selectedCategory = searchParams.get("category") || "";
  const searchQuery = searchParams.get("search") || "";

  const [categories, setCategories] = useState<PlatformCategory[]>(FALLBACK_CATEGORIES);
  const [allPlatforms, setAllPlatforms] = useState<Platform[]>(FALLBACK_PLATFORMS);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [catRes, platRes] = await Promise.allSettled([
          fetch("http://localhost:8000/api/v1/platforms/categories").then((r) => r.json()),
          fetch("http://localhost:8000/api/v1/platforms/").then((r) => r.json()),
        ]);

        if (catRes.status === "fulfilled" && catRes.value?.success && catRes.value?.data?.length > 0) {
          setCategories(catRes.value.data);
        }
        if (platRes.status === "fulfilled" && platRes.value?.success && platRes.value?.data?.length > 0) {
          setAllPlatforms(platRes.value.data);
        }
      } catch (err) {
        console.error("Failed to load platforms from backend, using fallbacks:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Filter logic
  let filteredPlatforms = allPlatforms;

  if (selectedCategory) {
    const targetCat = categories.find((c) => c.slug.toLowerCase() === selectedCategory.toLowerCase());
    filteredPlatforms = filteredPlatforms.filter(
      (p) =>
        p.category_id === targetCat?.id ||
        (p.category_name && p.category_name.toLowerCase().includes(selectedCategory.toLowerCase()))
    );
  }

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    filteredPlatforms = filteredPlatforms.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.category_name && p.category_name.toLowerCase().includes(q))
    );
  }

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-indigo-500 dark:text-cyan-400 text-xs font-black uppercase tracking-wider">
          <Compass className="w-4 h-4" />
          <span>Universal Platform Directory</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-foreground">
          40+ Supported Entertainment Destinations
        </h1>
        <p className="text-sm text-foreground-muted max-w-2xl leading-relaxed">
          Filter and access verified streaming platforms across OTT, Music, Video, Anime, Podcasts, and Personal Media through authorized integrations and official deep links.
        </p>
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-b border-surface-border pb-4">
        <button
          onClick={() => {
            if (searchQuery) {
              router.push(`/platforms?search=${encodeURIComponent(searchQuery)}`);
            } else {
              router.push("/platforms");
            }
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            !selectedCategory
              ? "bg-gradient-to-r from-indigo-600 to-cyan-500 text-white shadow-md shadow-indigo-500/25"
              : "bg-surface-card hover:bg-surface text-foreground-muted hover:text-foreground border border-surface-border"
          }`}
        >
          All Services ({allPlatforms.length})
        </button>

        {categories.map((cat) => {
          const isActive = selectedCategory.toLowerCase() === cat.slug.toLowerCase();
          return (
            <button
              key={cat.id}
              onClick={() => {
                const url = searchQuery
                  ? `/platforms?category=${cat.slug}&search=${encodeURIComponent(searchQuery)}`
                  : `/platforms?category=${cat.slug}`;
                router.push(url);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? "bg-gradient-to-r from-indigo-600 to-cyan-500 text-white shadow-md shadow-indigo-500/25"
                  : "bg-surface-card hover:bg-surface text-foreground-muted hover:text-foreground border border-surface-border"
              }`}
            >
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* Active Search/Filter Bar Notification */}
      {(selectedCategory || searchQuery) && (
        <div className="flex items-center justify-between text-xs text-foreground-muted bg-surface-card px-4 py-2 rounded-xl border border-surface-border">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-indigo-400" />
            <span>
              Showing {filteredPlatforms.length} results
              {selectedCategory && (
                <> in category <strong className="text-foreground capitalize">{selectedCategory}</strong></>
              )}
              {searchQuery && (
                <> matching &quot;<strong className="text-foreground">{searchQuery}</strong>&quot;</>
              )}
            </span>
          </div>

          <button
            onClick={() => router.push("/platforms")}
            className="text-xs font-bold text-indigo-500 dark:text-cyan-400 hover:underline"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* 3D Platform Grid */}
      {filteredPlatforms.length === 0 ? (
        <div className="text-center py-16 space-y-3 glass-card rounded-2xl border border-surface-border">
          <p className="text-base font-bold text-foreground">No entertainment platforms match your criteria.</p>
          <p className="text-xs text-foreground-muted">Try clearing the search query or selecting a different category.</p>
          <button
            onClick={() => router.push("/platforms")}
            className="mt-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredPlatforms.map((platform) => {
            const glow = getBrandGlow(platform.slug);
            const badgeClass = getBrandBadgeColor(platform.slug);

            return (
              <Card3D key={platform.id} glowColor={glow} className="h-full">
                <div className="glass-card rounded-2xl p-5 h-full flex flex-col justify-between space-y-4 border border-surface-border">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm border shadow-sm ${badgeClass}`}>
                        {platform.name.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-surface-card border border-surface-border text-foreground-muted">
                        {platform.pricing_type}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-bold text-base text-foreground group-hover:text-indigo-400 transition-colors">
                        {platform.name}
                      </h3>
                      <span className="text-[11px] font-extrabold text-cyan-500 dark:text-cyan-400">
                        {platform.category_name}
                      </span>
                      <p className="text-xs text-foreground-muted line-clamp-3 mt-2 leading-relaxed">
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
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600/15 hover:bg-indigo-600 text-indigo-500 dark:text-cyan-300 hover:text-white text-xs font-bold transition-all border border-indigo-500/25"
                    >
                      <span>Open Service</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
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

export default function PlatformsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <PlatformsDirectoryContent />
    </Suspense>
  );
}
