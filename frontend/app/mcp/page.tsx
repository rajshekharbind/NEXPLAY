"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Terminal,
  Play,
  Copy,
  Check,
  Code2,
  Cpu,
  Layers,
  Settings,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Search,
  Database,
  Compass,
  Bookmark,
  CreditCard,
  Zap,
  Info
} from "lucide-react";
import { MCPTool, MCPConfigResponse } from "@/types";
import { fetchMCPTools, executeMCPTool, fetchMCPConfig } from "@/lib/api";

const TOOL_SAMPLES: Record<string, Record<string, any>> = {
  nexplay_search_catalog: { query: "Interstellar", limit: 4 },
  nexplay_get_content_details: { slug_or_id: "interstellar" },
  nexplay_list_platforms: { category: "ott" },
  nexplay_get_platform_details: { platform_slug: "netflix" },
  nexplay_ai_recommend: { prompt: "mind-bending sci-fi under 2 hours", mood: "mind-bending", limit: 3 },
  nexplay_get_mood_presets: {},
  nexplay_get_featured_spotlight: { limit: 4 },
  nexplay_manage_watchlist: { action: "list" },
  nexplay_check_availability: { title_or_slug: "Interstellar" },
  nexplay_get_subscription_plans: {},
  nexplay_check_wallet_balance: {}
};

const CATEGORY_MAP: Record<string, { label: string; color: string }> = {
  nexplay_search_catalog: { label: "Catalog", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  nexplay_get_content_details: { label: "Catalog", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  nexplay_list_platforms: { label: "Platforms", color: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" },
  nexplay_get_platform_details: { label: "Platforms", color: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" },
  nexplay_ai_recommend: { label: "AI & Discovery", color: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
  nexplay_get_mood_presets: { label: "AI & Discovery", color: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
  nexplay_get_featured_spotlight: { label: "Spotlight", color: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  nexplay_manage_watchlist: { label: "Watchlist", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  nexplay_check_availability: { label: "Availability", color: "bg-rose-500/10 text-rose-400 border-rose-500/20" },
  nexplay_get_subscription_plans: { label: "Billing", color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" },
  nexplay_check_wallet_balance: { label: "Billing", color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" }
};

export default function MCPPlaygroundPage() {
  const [tools, setTools] = useState<MCPTool[]>([]);
  const [selectedTool, setSelectedTool] = useState<MCPTool | null>(null);
  const [argumentsJson, setArgumentsJson] = useState<string>("{}");
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [configData, setConfigData] = useState<MCPConfigResponse | null>(null);
  const [activeTab, setActiveTab] = useState<"runner" | "setup">("runner");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState("");

  useEffect(() => {
    loadTools();
    loadConfig();
  }, []);

  const loadTools = async () => {
    const list = await fetchMCPTools();
    setTools(list);
    if (list.length > 0) {
      handleSelectTool(list[0]);
    }
  };

  const loadConfig = async () => {
    const cfg = await fetchMCPConfig();
    setConfigData(cfg);
  };

  const handleSelectTool = (tool: MCPTool) => {
    setSelectedTool(tool);
    const sample = TOOL_SAMPLES[tool.name] || {};
    setArgumentsJson(JSON.stringify(sample, null, 2));
    setExecutionResult(null);
  };

  const handleExecute = async () => {
    if (!selectedTool) return;
    setIsExecuting(true);
    try {
      const parsedArgs = JSON.parse(argumentsJson || "{}");
      const res = await executeMCPTool(selectedTool.name, parsedArgs);
      setExecutionResult(res);
    } catch (err: any) {
      setExecutionResult({
        isError: true,
        content: [{ type: "text", text: `Error: ${err.message || "Failed to execute"}` }]
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const filteredTools = tools.filter((t) =>
    t.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
    t.description.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative rounded-3xl p-6 sm:p-8 overflow-hidden glass-panel border border-cyan-500/20 dark:border-cyan-500/30 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-gradient-to-br from-cyan-500/20 via-blue-500/15 to-indigo-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-600 dark:text-cyan-300 text-xs font-bold uppercase tracking-wider">
              <Cpu className="w-3.5 h-3.5 text-cyan-500 animate-pulse" />
              <span>Model Context Protocol • 2024-11-05 Spec</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
              NEXPLAY{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500">
                MCP Server
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl font-medium">
              Standardized Model Context Protocol server exposing 11 native entertainment discovery tools to external AI clients like Claude Desktop, Cursor, and Antigravity.
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
            <button
              onClick={() => setActiveTab("runner")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === "runner"
                  ? "bg-cyan-600 text-white shadow-md"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Terminal className="w-4 h-4" />
              <span>Tool Inspector & Live Runner</span>
            </button>
            <button
              onClick={() => setActiveTab("setup")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === "setup"
                  ? "bg-cyan-600 text-white shadow-md"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Client Setup Guide</span>
            </button>
          </div>
        </div>
      </div>

      {activeTab === "runner" ? (
        /* Split Two-Column Tool Inspector */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Registered Tools List */}
          <div className="lg:col-span-4 rounded-3xl glass-panel border border-surface-border p-4 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-surface-border">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Native Tools ({tools.length})
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                JSON-RPC 2.0
              </span>
            </div>

            {/* Quick Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Filter tools..."
                className="w-full bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-cyan-400"
              />
            </div>

            {/* Tools List */}
            <div className="space-y-1.5 max-h-[620px] overflow-y-auto pr-1">
              {filteredTools.map((t) => {
                const isSelected = selectedTool?.name === t.name;
                const cat = CATEGORY_MAP[t.name] || { label: "General", color: "bg-slate-500/10 text-slate-400 border-slate-500/20" };
                return (
                  <button
                    key={t.name}
                    onClick={() => handleSelectTool(t)}
                    className={`w-full text-left p-3 rounded-2xl transition-all border ${
                      isSelected
                        ? "bg-cyan-500/10 border-cyan-500/40 shadow-sm"
                        : "bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                        {t.name}
                      </span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase shrink-0 ${cat.color}`}>
                        {cat.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                      {t.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Tool Executor & Live Output Inspector */}
          <div className="lg:col-span-8 rounded-3xl glass-panel border border-surface-border p-6 space-y-6">
            {selectedTool ? (
              <div className="space-y-6">
                {/* Tool Metadata */}
                <div className="space-y-2 pb-4 border-b border-surface-border">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-xl font-black font-mono text-cyan-600 dark:text-cyan-400">
                      {selectedTool.name}
                    </h2>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      Required: {(selectedTool.inputSchema.required || []).join(", ") || "None"}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {selectedTool.description}
                  </p>
                </div>

                {/* Input Schema and Execution Form */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <Code2 className="w-3.5 h-3.5" />
                      <span>Input Arguments (JSON)</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => {
                        const sample = TOOL_SAMPLES[selectedTool.name] || {};
                        setArgumentsJson(JSON.stringify(sample, null, 2));
                      }}
                      className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:underline"
                    >
                      Reset to Sample
                    </button>
                  </div>

                  <div className="relative rounded-2xl overflow-hidden border border-slate-300 dark:border-slate-700/80 bg-slate-950 font-mono text-xs">
                    <textarea
                      value={argumentsJson}
                      onChange={(e) => setArgumentsJson(e.target.value)}
                      rows={5}
                      className="w-full bg-transparent p-4 text-emerald-400 focus:outline-none resize-none leading-relaxed"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={handleExecute}
                      disabled={isExecuting}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-black shadow-lg hover:shadow-cyan-500/25 transition-all disabled:opacity-50 cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>{isExecuting ? "Executing via MCP..." : "Run Tool via MCP"}</span>
                    </button>
                  </div>
                </div>

                {/* Live Output Window */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5" />
                      <span>MCP Response Output</span>
                    </span>

                    {executionResult && (
                      <button
                        onClick={() => handleCopy(JSON.stringify(executionResult, null, 2), "output")}
                        className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                      >
                        {copiedKey === "output" ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Output</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  <div className="rounded-2xl p-4 bg-slate-950 border border-slate-800 text-xs font-mono min-h-[220px] max-h-[380px] overflow-y-auto">
                    {executionResult ? (
                      <pre className="text-slate-200 whitespace-pre-wrap leading-relaxed">
                        {JSON.stringify(executionResult, null, 2)}
                      </pre>
                    ) : (
                      <div className="h-full py-16 flex flex-col items-center justify-center text-slate-500 space-y-2">
                        <Terminal className="w-6 h-6 opacity-40" />
                        <p>Click "Run Tool via MCP" above to execute and inspect live output.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-24 text-center text-slate-400 font-medium">
                Select a tool from the left to inspect its schema and execute.
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Setup Guide & Configuration Snippets */
        <div className="rounded-3xl glass-panel border border-surface-border p-6 sm:p-8 space-y-8">
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
              Connect NEXPLAY MCP to AI Assistants
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Easily connect Claude Desktop, Cursor, or any MCP-compliant AI client to discover movies, stream links, and manage your watchlists.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Claude Desktop Config */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-500 font-black">
                    C
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      Claude Desktop
                    </h3>
                    <p className="text-[11px] text-slate-400">claude_desktop_config.json</p>
                  </div>
                </div>

                <button
                  onClick={() =>
                    handleCopy(
                      JSON.stringify(configData?.claude_desktop || {}, null, 2),
                      "claude"
                    )
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  {copiedKey === "claude" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === "claude" ? "Copied" : "Copy Config"}</span>
                </button>
              </div>

              <pre className="p-4 rounded-xl bg-slate-950 text-emerald-400 font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800">
                {JSON.stringify(configData?.claude_desktop || {}, null, 2)}
              </pre>

              <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
                Paste into <code>%APPDATA%\Claude\claude_desktop_config.json</code> (Windows) and restart Claude Desktop.
              </p>
            </div>

            {/* Cursor IDE Config */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/15 flex items-center justify-center text-cyan-400 font-black">
                    ⌨
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      Cursor IDE
                    </h3>
                    <p className="text-[11px] text-slate-400">Features &gt; MCP Servers</p>
                  </div>
                </div>

                <button
                  onClick={() =>
                    handleCopy(
                      JSON.stringify(configData?.cursor || {}, null, 2),
                      "cursor"
                    )
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  {copiedKey === "cursor" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === "cursor" ? "Copied" : "Copy Config"}</span>
                </button>
              </div>

              <pre className="p-4 rounded-xl bg-slate-950 text-emerald-400 font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800">
                {JSON.stringify(configData?.cursor || {}, null, 2)}
              </pre>

              <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
                In Cursor Settings, navigate to <strong>Features &gt; MCP</strong>, click <strong>Add New MCP Server</strong>, and enter command.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
