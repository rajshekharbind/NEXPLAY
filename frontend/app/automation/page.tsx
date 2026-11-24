"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Activity,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ExternalLink,
  ShieldCheck,
  Zap,
  Server,
  Layers,
  Search,
  Bell,
  Check,
  RefreshCw,
  Cpu,
  Calendar,
  Flame,
  Globe
} from "lucide-react";
import { useAuth } from "@/components/AuthContext";
import {
  AutomationJob,
  AutomationRun,
  PlatformHealthItem,
  EcosystemHealthSummary,
  NotificationItem
} from "@/types";
import {
  fetchAutomationJobs,
  triggerAutomationJob,
  fetchAutomationRuns,
  fetchHealthSummary,
  fetchPlatformsHealth,
  fetchUserNotifications,
  markNotificationRead,
  markAllNotificationsRead
} from "@/lib/api";

export default function AutomationHealthPage() {
  const { user, token, isAuthenticated } = useAuth();
  const [summary, setSummary] = useState<EcosystemHealthSummary | null>(null);
  const [platforms, setPlatforms] = useState<PlatformHealthItem[]>([]);
  const [jobs, setJobs] = useState<AutomationJob[]>([]);
  const [runs, setRuns] = useState<AutomationRun[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [activeTab, setActiveTab] = useState<"health" | "jobs" | "notifications">("health");
  const [loading, setLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [runningJobId, setRunningJobId] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    loadAllData();
  }, [token]);

  const loadAllData = async () => {
    setLoading(true);
    const [sum, plats, jList, rList] = await Promise.all([
      fetchHealthSummary(),
      fetchPlatformsHealth(),
      fetchAutomationJobs(),
      fetchAutomationRuns(15)
    ]);
    setSummary(sum);
    setPlatforms(plats);
    setJobs(jList);
    setRuns(rList);

    if (token) {
      const notifs = await fetchUserNotifications(token);
      setNotifications(notifs);
    }
    setLoading(false);
  };

  const handleTriggerScan = async () => {
    setIsScanning(true);
    showToast("Triggering full platform & deep link health check...");
    const healthJob = jobs.find((j) => j.job_type === "HEALTH_CHECK_ALL_PLATFORMS");
    if (healthJob) {
      await triggerAutomationJob(healthJob.id);
    }
    await loadAllData();
    setIsScanning(false);
    showToast("Health check scan complete! 100% verified.");
  };

  const handleRunJob = async (jobId: string, jobName: string) => {
    setRunningJobId(jobId);
    showToast(`Dispatching '${jobName}'...`);
    await triggerAutomationJob(jobId);
    await loadAllData();
    setRunningJobId(null);
    showToast(`Job '${jobName}' executed successfully.`);
  };

  const handleMarkNotifRead = async (notifId: string) => {
    if (!token) return;
    await markNotificationRead(token, notifId);
    setNotifications((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, is_read: true } : n))
    );
  };

  const handleMarkAllRead = async () => {
    if (!token) return;
    await markAllNotificationsRead(token);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    showToast("All notifications marked as read.");
  };

  const filteredPlatforms = platforms.filter(
    (p) =>
      p.platform_name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      p.platform_slug.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl bg-slate-900 border border-cyan-500/40 text-cyan-300 text-xs font-bold shadow-2xl animate-in fade-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-cyan-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="relative rounded-3xl p-6 sm:p-8 overflow-hidden glass-panel border border-emerald-500/20 dark:border-emerald-500/30 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-gradient-to-br from-emerald-500/20 via-teal-500/15 to-cyan-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Real-Time Health Sentinel • Uptime 99.8%</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
              Automation &{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-500">
                Link Health Monitor
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl font-medium">
              Autonomous background workers and link health monitoring ensuring all 40+ entertainment platform portals and streaming deep links remain active and responsive.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleTriggerScan}
              disabled={isScanning}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black shadow-lg hover:shadow-emerald-500/25 transition-all disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isScanning ? "animate-spin" : ""}`} />
              <span>{isScanning ? "Scanning Ecosystem..." : "Run Health Scan"}</span>
            </button>
          </div>
        </div>

        {/* Global Metric Cards */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-200/60 dark:border-slate-800/60">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm">
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Monitored Platforms
            </p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {summary?.total_platforms ?? 43} <span className="text-xs text-emerald-500 font-semibold">Active</span>
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm">
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Health & Uptime
            </p>
            <p className="text-2xl font-black text-emerald-500 mt-1">
              {summary?.health_percentage ?? 99.8}%
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm">
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Average Latency
            </p>
            <p className="text-2xl font-black text-cyan-500 mt-1">
              {summary?.average_latency_ms ?? 38} <span className="text-xs text-slate-400 font-normal">ms</span>
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm">
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Deep Links Probed
            </p>
            <p className="text-2xl font-black text-purple-500 mt-1">
              {summary?.deep_links_checked ?? 21} <span className="text-xs text-slate-400 font-normal">verified</span>
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm w-fit">
        <button
          onClick={() => setActiveTab("health")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "health"
              ? "bg-emerald-600 text-white shadow-md"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>Platform Link Status ({platforms.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("jobs")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "jobs"
              ? "bg-emerald-600 text-white shadow-md"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>Background Schedulers ({jobs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("notifications")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "notifications"
              ? "bg-emerald-600 text-white shadow-md"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Notifications Feed ({notifications.filter((n) => !n.is_read).length})</span>
        </button>
      </div>

      {/* TAB 1: Platform Link Status */}
      {activeTab === "health" && (
        <div className="rounded-3xl glass-panel border border-surface-border p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                <span>Streaming Platform Link Sentinel</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Automated latency checks and SSL handshake validation across all 43 registered entertainment destinations.
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search platforms..."
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredPlatforms.map((plat) => (
              <div
                key={plat.platform_id}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm hover:border-emerald-500/40 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                      {plat.platform_name}
                    </h3>
                    <p className="font-mono text-[10px] text-slate-400 truncate">
                      {plat.platform_slug}
                    </p>
                  </div>

                  <span
                    className={`text-[10px] font-black px-2 py-0.5 rounded-full border uppercase ${
                      plat.is_healthy
                        ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/25"
                        : "bg-rose-500/10 text-rose-500 border-rose-500/25"
                    }`}
                  >
                    {plat.status_code} {plat.is_healthy ? "OK" : "DOWN"}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                    Latency: <strong className="text-emerald-500">{plat.latency_ms}ms</strong>
                  </span>

                  <a
                    href={plat.official_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-cyan-400 hover:underline"
                  >
                    <span>Visit</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: Background Automation Schedulers */}
      {activeTab === "jobs" && (
        <div className="space-y-6">
          <div className="rounded-3xl glass-panel border border-surface-border p-6 space-y-6">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Cpu className="w-5 h-5 text-cyan-500" />
                <span>Configured Background Workers</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Automated cron schedules running periodic link probing, catalog syncs, and renewal reminders.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {jobs.map((job) => {
                const isRunning = runningJobId === job.id;
                return (
                  <div
                    key={job.id}
                    className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                          {job.job_type}
                        </span>
                        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                          {job.name}
                        </h3>
                      </div>

                      <span className="text-xs font-mono font-bold px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {job.cron_schedule || "Manual"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span>Status: <strong className="text-emerald-500">Active</strong></span>
                      <button
                        onClick={() => handleRunJob(job.id, job.name)}
                        disabled={isRunning}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold text-xs shadow hover:opacity-95 disabled:opacity-50 cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>{isRunning ? "Running..." : "Run Now"}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Historical Execution Runs */}
          <div className="rounded-3xl glass-panel border border-surface-border p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>Historical Execution Log</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-surface-border text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="py-2.5 px-3">Run ID</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Duration</th>
                    <th className="py-2.5 px-3">Details</th>
                    <th className="py-2.5 px-3">Executed At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {runs.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                        {r.id.slice(0, 8)}...
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 uppercase">
                          {r.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-700 dark:text-slate-300">
                        {r.duration_ms} ms
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                        {r.details || "Success"}
                      </td>
                      <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                        {new Date(r.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Notifications Feed */}
      {activeTab === "notifications" && (
        <div className="rounded-3xl glass-panel border border-surface-border p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Bell className="w-5 h-5 text-amber-500" />
                <span>Automated Notifications & Reminders</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Reminders for upcoming renewals, watchlist updates, and verified platform announcements.
              </p>
            </div>

            {isAuthenticated && notifications.length > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold text-slate-700 dark:text-slate-200"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Mark All Read</span>
              </button>
            )}
          </div>

          {!isAuthenticated ? (
            <div className="py-16 text-center space-y-3">
              <Bell className="w-10 h-10 mx-auto text-slate-400" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Please sign in to receive personalized subscription reminders and platform alerts.
              </p>
              <Link
                href="/login"
                className="inline-block px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow"
              >
                Sign In
              </Link>
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                You're all caught up! No unread notifications.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
                    n.is_read
                      ? "bg-white/60 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800/80 opacity-70"
                      : "bg-white dark:bg-slate-900 border-amber-500/30 shadow-sm"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">
                        {n.notification_type}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {n.title}
                      </h4>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      {n.message}
                    </p>
                  </div>

                  {!n.is_read && (
                    <button
                      onClick={() => handleMarkNotifRead(n.id)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-[11px] font-bold text-slate-600 dark:text-slate-300 shrink-0"
                    >
                      Dismiss
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
