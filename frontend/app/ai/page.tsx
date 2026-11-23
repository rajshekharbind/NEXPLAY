"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Sparkles,
  Bot,
  Send,
  CornerDownLeft,
  Brain,
  Zap,
  Moon,
  Headphones,
  Flame,
  Star,
  ExternalLink,
  Bookmark,
  Check,
  RotateCcw,
  Clock,
  Compass,
  History,
  MessageSquare,
  ArrowRight,
  ShieldCheck,
  Tv,
  Film,
  Music,
  Video
} from "lucide-react";
import { useAuth } from "@/components/AuthContext";
import Card3D from "@/components/Card3D";
import {
  AIMoodItem,
  AIRecommendationItem,
  AIChatMessage,
  RecommendationHistoryItem
} from "@/types";
import {
  fetchAIMoods,
  sendAIChat,
  getAIRecommendations,
  fetchAIHistory,
  toggleWatchlist
} from "@/lib/api";

const MOOD_ICONS: Record<string, any> = {
  Brain,
  Zap,
  Moon,
  Sparkles,
  Headphones,
  Flame
};

interface ChatMessageWithRecs extends AIChatMessage {
  recommendations?: AIRecommendationItem[];
  suggested_followups?: string[];
  detected_mood?: string;
}

export default function AICopilotPage() {
  const { user, token, isAuthenticated } = useAuth();
  const [moods, setMoods] = useState<AIMoodItem[]>([]);
  const [activeMood, setActiveMood] = useState<string | null>(null);
  const [inputQuery, setInputQuery] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<ChatMessageWithRecs[]>([
    {
      role: "assistant",
      content:
        "Hello! I am your **NEXPLAY AI Entertainment Copilot**. Tell me your mood, favorite genres, actors, or runtime preferences, and I'll discover the perfect titles across 40+ streaming apps with official direct deep links.",
      suggested_followups: [
        "Find mind-bending sci-fi movies under 2 hours",
        "Top anime series with epic fight scenes",
        "Chill ambient lo-fi music for late night coding",
        "Prestige drama series with 9+ ratings"
      ]
    }
  ]);
  const [bookmarkedIds, setBookmarkedIds] = useState<Record<string, boolean>>({});
  const [historyItems, setHistoryItems] = useState<RecommendationHistoryItem[]>([]);
  const [activeTab, setActiveTab] = useState<"chat" | "history">("chat");
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [creditsRemaining, setCreditsRemaining] = useState<number>(user?.wallet?.balance_credits ?? 100);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMoods();
  }, []);

  useEffect(() => {
    if (user?.wallet?.balance_credits !== undefined) {
      setCreditsRemaining(user.wallet.balance_credits);
    }
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const loadMoods = async () => {
    const data = await fetchAIMoods();
    setMoods(data);
  };

  const loadHistory = async () => {
    if (!token) return;
    setLoadingHistory(true);
    const data = await fetchAIHistory(token, 20);
    setHistoryItems(data);
    setLoadingHistory(false);
  };

  const handleSendMessage = async (queryText?: string) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim() || isTyping) return;

    const userMessage: ChatMessageWithRecs = {
      role: "user",
      content: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputQuery("");
    setIsTyping(true);

    const historyForBackend = messages
      .concat(userMessage)
      .slice(-6)
      .map((m) => ({ role: m.role, content: m.content }));

    const response = await sendAIChat(
      {
        messages: historyForBackend,
        mood: activeMood || undefined
      },
      token || undefined
    );

    if (response) {
      if (response.credits_remaining !== undefined) {
        setCreditsRemaining(response.credits_remaining);
      }

      const assistantMessage: ChatMessageWithRecs = {
        role: "assistant",
        content: response.content,
        recommendations: response.recommendations,
        suggested_followups: response.suggested_followups,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } else {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I had trouble generating a recommendation. Please check your query and try again.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }
      ]);
    }
    setIsTyping(false);
  };

  const handleMoodSelect = (mood: AIMoodItem) => {
    if (activeMood === mood.id) {
      setActiveMood(null);
    } else {
      setActiveMood(mood.id);
      handleSendMessage(mood.sample_prompt);
    }
  };

  const handleBookmarkToggle = async (contentId: string) => {
    if (!token) {
      alert("Please sign in to bookmark titles to your private Watchlist.");
      return;
    }
    const res = await toggleWatchlist(token, contentId);
    if (res) {
      setBookmarkedIds((prev) => ({
        ...prev,
        [contentId]: res.action === "added"
      }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Copilot Ambient Header Banner */}
      <div className="relative rounded-3xl p-6 sm:p-8 overflow-hidden glass-panel border border-indigo-500/20 dark:border-indigo-500/30 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-gradient-to-br from-indigo-500/20 via-purple-500/15 to-pink-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-gradient-to-tr from-cyan-500/20 via-blue-500/15 to-transparent blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-600 dark:text-cyan-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 animate-pulse text-indigo-500 dark:text-cyan-400" />
              <span>Autonomous Entertainment Discovery</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
              AI Entertainment{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
                Copilot
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl font-medium">
              Natural language cross-catalog discovery across 40+ streaming destinations. Ask by mood, runtime, cast, or vibe with instant verified streaming links.
            </p>
          </div>

          {/* Credits and Quick Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/15 flex items-center justify-center text-indigo-500 dark:text-cyan-400">
                <Zap className="w-4 h-4 fill-current" />
              </div>
              <div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                  Credits Remaining
                </p>
                <p className="text-lg font-black text-slate-900 dark:text-slate-100">
                  {creditsRemaining} <span className="text-xs font-semibold text-slate-400">pts</span>
                </p>
              </div>
              <Link
                href="/billing"
                className="ml-2 text-xs font-bold text-indigo-600 dark:text-cyan-400 hover:underline"
              >
                + Top Up
              </Link>
            </div>

            {/* Toggle History Tab */}
            {isAuthenticated && (
              <button
                onClick={() => {
                  const nextTab = activeTab === "chat" ? "history" : "chat";
                  setActiveTab(nextTab);
                  if (nextTab === "history") loadHistory();
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border text-xs font-bold transition-all ${
                  activeTab === "history"
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                    : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:border-indigo-400"
                }`}
              >
                <History className="w-4 h-4" />
                <span>{activeTab === "history" ? "Back to Chat" : "AI Audit History"}</span>
              </button>
            )}
          </div>
        </div>

        {/* Vibe & Mood Carousel Pills */}
        <div className="relative z-10 mt-6 pt-6 border-t border-slate-200/60 dark:border-slate-800/60">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
            Instant Vibe Presets:
          </p>

          <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none">
            {moods.map((mood) => {
              const Icon = MOOD_ICONS[mood.icon] || Sparkles;
              const isSelected = activeMood === mood.id;
              return (
                <button
                  key={mood.id}
                  onClick={() => handleMoodSelect(mood)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-300 border ${
                    isSelected
                      ? "bg-gradient-to-r " + mood.gradient + " text-white border-transparent shadow-lg scale-105"
                      : "bg-white dark:bg-slate-900/90 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 hover:bg-slate-50 dark:hover:bg-slate-800/80"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{mood.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {activeTab === "chat" ? (
        /* Chat Stream & Interaction Container */
        <div className="space-y-4">
          <div className="rounded-3xl glass-panel border border-surface-border p-4 sm:p-6 min-h-[460px] flex flex-col justify-between space-y-6">
            {/* Messages Timeline */}
            <div className="space-y-6">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3 sm:gap-4 ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {msg.role === "assistant" && (
                    <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-600 p-[1.5px] shrink-0 mt-0.5 shadow-md">
                      <div className="w-full h-full rounded-[14px] bg-slate-900 flex items-center justify-center text-cyan-400">
                        <Bot className="w-4 h-4" />
                      </div>
                    </div>
                  )}

                  <div
                    className={`space-y-3 max-w-3xl ${
                      msg.role === "user" ? "items-end" : "items-start"
                    }`}
                  >
                    {/* Text Message Bubble */}
                    <div
                      className={`rounded-2xl px-4 sm:px-5 py-3.5 text-sm leading-relaxed ${
                        msg.role === "user"
                          ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium shadow-md rounded-tr-none ml-auto"
                          : "bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-tl-none shadow-sm"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>

                    {/* Content Recommendation Cards (if returned by Copilot) */}
                    {msg.recommendations && msg.recommendations.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                        {msg.recommendations.map((rec) => {
                          const isBookmarked = bookmarkedIds[rec.id];
                          return (
                            <Card3D key={rec.id} intensity={8} glowColor="rgba(99, 102, 241, 0.4)">
                              <div className="h-full flex flex-col justify-between rounded-2xl overflow-hidden bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 shadow-lg hover:border-indigo-500/50 transition-all duration-300">
                                {/* Thumbnail Poster & Badges */}
                                <div className="relative aspect-[16/9] w-full bg-slate-800 overflow-hidden">
                                  {rec.poster_url || rec.backdrop_url ? (
                                    <img
                                      src={rec.backdrop_url || rec.poster_url}
                                      alt={rec.title}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-500">
                                      <Film className="w-8 h-8" />
                                    </div>
                                  )}

                                  {/* Top Badges */}
                                  <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
                                    <span className="px-2 py-0.5 rounded-lg bg-black/75 backdrop-blur-md text-[10px] font-black uppercase tracking-wider text-cyan-300 border border-cyan-400/30">
                                      {rec.content_type}
                                    </span>
                                    <span className="px-2 py-0.5 rounded-lg bg-black/75 backdrop-blur-md text-[10px] font-black text-amber-400 border border-amber-400/30 flex items-center gap-1">
                                      <Star className="w-3 h-3 fill-amber-400" />
                                      {rec.rating}
                                    </span>
                                  </div>

                                  {/* AI Match Percentage Overlay */}
                                  <div className="absolute bottom-2 left-2">
                                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-600/90 backdrop-blur-md text-[10px] font-black text-white border border-indigo-400/40 shadow-sm">
                                      {rec.match_score}% Match
                                    </span>
                                  </div>
                                </div>

                                {/* Content Details */}
                                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                                  <div className="space-y-1.5">
                                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
                                      {rec.title}
                                    </h3>

                                    {/* Genres */}
                                    <div className="flex flex-wrap gap-1">
                                      {rec.genres.slice(0, 3).map((g) => (
                                        <span
                                          key={g}
                                          className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                                        >
                                          {g}
                                        </span>
                                      ))}
                                    </div>

                                    {/* AI Contextual Reasoning */}
                                    <div className="mt-2 p-2 rounded-xl bg-indigo-50/80 dark:bg-slate-800/60 border border-indigo-100 dark:border-indigo-500/20 text-xs text-slate-600 dark:text-slate-300 leading-snug">
                                      {rec.reasoning}
                                    </div>
                                  </div>

                                  {/* Streaming Launch Links & Watchlist Bookmark */}
                                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                                    <div className="flex flex-wrap gap-1.5">
                                      {rec.streaming_options.map((opt, i) => (
                                        <a
                                          key={i}
                                          href={opt.stream_url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-cyan-300 text-[11px] font-bold border border-indigo-500/25 transition-colors"
                                        >
                                          <span>{opt.platform_name}</span>
                                          <ExternalLink className="w-3 h-3" />
                                        </a>
                                      ))}
                                    </div>

                                    <button
                                      onClick={() => handleBookmarkToggle(rec.id)}
                                      className={`w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                                        isBookmarked
                                          ? "bg-emerald-500/15 text-emerald-500 dark:text-emerald-400 border-emerald-500/30"
                                          : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700"
                                      }`}
                                    >
                                      {isBookmarked ? (
                                        <>
                                          <Check className="w-3.5 h-3.5" />
                                          <span>In Watchlist</span>
                                        </>
                                      ) : (
                                        <>
                                          <Bookmark className="w-3.5 h-3.5" />
                                          <span>+ Add to Watchlist</span>
                                        </>
                                      )}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </Card3D>
                          );
                        })}
                      </div>
                    )}

                    {/* Suggested Follow-up Prompt Pills */}
                    {msg.suggested_followups && msg.suggested_followups.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {msg.suggested_followups.map((followup, fIdx) => (
                          <button
                            key={fIdx}
                            onClick={() => handleSendMessage(followup)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800/80 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-cyan-300 border border-slate-200 dark:border-slate-700/80 hover:border-indigo-400/50 transition-all text-left"
                          >
                            <span>{followup}</span>
                            <ArrowRight className="w-3 h-3 shrink-0" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-600 p-[1.5px] shrink-0">
                    <div className="w-full h-full rounded-[14px] bg-slate-900 flex items-center justify-center text-cyan-400">
                      <Bot className="w-4 h-4 animate-spin" />
                    </div>
                  </div>
                  <div className="px-4 py-3 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                    <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse delay-75" />
                    <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse delay-150" />
                    <span>NEXPLAY AI is searching cross-platform catalogs...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Natural Language Prompt Input Bar */}
            <div className="pt-4 border-t border-slate-200/60 dark:border-slate-800/60 space-y-3">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="relative flex items-center"
              >
                <input
                  type="text"
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  placeholder="Ask NEXPLAY AI: 'Find high-stakes sci-fi under 2 hrs on Prime', 'Chill songs on Spotify'..."
                  disabled={isTyping}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 rounded-2xl pl-4 pr-24 py-3.5 text-sm font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 dark:focus:border-cyan-400 focus:ring-2 focus:ring-indigo-500/20 dark:focus:ring-cyan-400/20 transition-all shadow-sm disabled:opacity-50"
                />

                <div className="absolute right-2 flex items-center gap-1.5">
                  <button
                    type="submit"
                    disabled={!inputQuery.trim() || isTyping}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-40 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
                  >
                    <span>Discover</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>

              {/* Sample Prompts */}
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                <span className="font-bold uppercase tracking-wider">Try asking:</span>
                {[
                  "Sci-fi thrillers on Netflix",
                  "Anime with god-tier animation",
                  "Deep sleep podcast episodes",
                  "Award winning drama series"
                ].map((sample, sIdx) => (
                  <button
                    key={sIdx}
                    type="button"
                    onClick={() => handleSendMessage(sample)}
                    className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-cyan-400 transition-colors"
                  >
                    "{sample}"
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Recommendation Audit History Tab */
        <div className="rounded-3xl glass-panel border border-surface-border p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-500 dark:text-cyan-400" />
                <span>Personal Recommendation Audit Ledger</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                All semantic recommendations generated for your account with reasoning and timestamps.
              </p>
            </div>

            <button
              onClick={loadHistory}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>

          {loadingHistory ? (
            <div className="py-12 text-center text-slate-400 font-medium">
              Loading recommendation history...
            </div>
          ) : historyItems.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <Bot className="w-10 h-10 mx-auto text-slate-400" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                No past recommendations recorded yet.
              </p>
              <button
                onClick={() => setActiveTab("chat")}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow"
              >
                Start AI Discovery
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {historyItems.map((hist) => (
                <div
                  key={hist.id}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                        {hist.content_type}
                      </span>
                      <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                        {hist.content_title}
                      </h4>
                    </div>

                    <span className="text-xs font-black px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/20">
                      Score: {hist.score}
                    </span>
                  </div>

                  {hist.reasoning && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80">
                      {hist.reasoning}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {hist.created_at ? new Date(hist.created_at).toLocaleDateString() : "Recent"}
                    </span>
                    <Link
                      href={`/search?q=${encodeURIComponent(hist.content_title)}`}
                      className="text-indigo-600 dark:text-cyan-400 font-bold hover:underline flex items-center gap-1"
                    >
                      <span>Find Providers</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
