"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ShieldAlert, 
  Plus, 
  Search, 
  Activity, 
  ExternalLink, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Layers, 
  Sliders, 
  AlertTriangle,
  Radio,
  ArrowLeft,
  X,
  Server
} from "lucide-react";
import { useAuth } from "@/components/AuthContext";
import Card3D from "@/components/Card3D";
import { PlatformCategory } from "@/types";

interface AdminPlatform {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  logo_url?: string;
  banner_url?: string;
  official_url: string;
  description?: string;
  pricing_type: string;
  integration_type: string;
  supported_features: Record<string, any>;
  is_active: boolean;
  region_availability: string[];
  display_priority: number;
  category_name?: string;
}

interface AdminStats {
  total_platforms: number;
  active_platforms: number;
  total_categories: number;
  platforms_by_category: Record<string, number>;
  platforms_by_pricing: Record<string, number>;
  total_users: number;
  premium_users: number;
}

export default function AdminPlatformsPage() {
  const { user, token, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const [platforms, setPlatforms] = useState<AdminPlatform[]>([]);
  const [categories, setCategories] = useState<PlatformCategory[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loadingData, setLoadingData] = useState<boolean>(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Health check state
  const [healthChecking, setHealthChecking] = useState<string | null>(null);
  const [healthStatus, setHealthStatus] = useState<Record<string, { status: string; ms?: number }>>({});

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingPlatform, setEditingPlatform] = useState<AdminPlatform | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    category_id: "",
    official_url: "",
    logo_url: "",
    banner_url: "",
    description: "",
    pricing_type: "SUBSCRIPTION",
    integration_type: "OFFICIAL_LINK",
    display_priority: 50,
    is_active: true,
  });

  const isAdmin = user && (user.role === "ADMIN" || user.role === "SUPER_ADMIN");

  useEffect(() => {
    if (!isAdmin || !token) return;

    async function loadAdminData() {
      setLoadingData(true);
      try {
        const [platRes, catRes, statRes] = await Promise.all([
          fetch("http://localhost:8000/api/v1/admin/platforms", {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch("http://localhost:8000/api/v1/platforms/categories"),
          fetch("http://localhost:8000/api/v1/admin/stats", {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        const [platJson, catJson, statJson] = await Promise.all([
          platRes.json(),
          catRes.json(),
          statRes.json()
        ]);

        if (platJson.success) setPlatforms(platJson.data || []);
        if (catJson.success) setCategories(catJson.data || []);
        if (statJson.success) setStats(statJson.data || null);
      } catch (err) {
        console.error("Failed to load admin data", err);
      } finally {
        setLoadingData(false);
      }
    }

    loadAdminData();
  }, [token, isAdmin]);

  // Handle Health Probe
  const handleHealthProbe = async (platformId: string) => {
    setHealthChecking(platformId);
    try {
      const res = await fetch(`http://localhost:8000/api/v1/admin/platforms/${platformId}/health-check`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.data) {
        setHealthStatus((prev) => ({
          ...prev,
          [platformId]: {
            status: data.data.status,
            ms: data.data.response_time_ms
          }
        }));
        setMessage({ type: "success", text: data.message });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Health probe failed to reach backend." });
    } finally {
      setHealthChecking(null);
    }
  };

  // Handle Toggle Active/Deactivate
  const handleToggleActive = async (p: AdminPlatform) => {
    const updatedStatus = !p.is_active;
    try {
      const res = await fetch(`http://localhost:8000/api/v1/admin/platforms/${p.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ is_active: updatedStatus })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPlatforms((prev) =>
          prev.map((item) => (item.id === p.id ? { ...item, is_active: updatedStatus } : item))
        );
        setMessage({
          type: "success",
          text: `Platform '${p.name}' is now ${updatedStatus ? "ACTIVE" : "DEACTIVATED"}`
        });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Failed to update platform status." });
    }
  };

  // Handle Create Platform Submit
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.category_id) {
      setMessage({ type: "error", text: "Please select a category." });
      return;
    }

    try {
      const res = await fetch("http://localhost:8000/api/v1/admin/platforms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          display_priority: Number(formData.display_priority)
        })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setPlatforms((prev) => [data.data, ...prev]);
        setIsAddModalOpen(false);
        setMessage({ type: "success", text: data.message });
        // Reset form
        setFormData({
          name: "",
          slug: "",
          category_id: "",
          official_url: "",
          logo_url: "",
          banner_url: "",
          description: "",
          pricing_type: "SUBSCRIPTION",
          integration_type: "OFFICIAL_LINK",
          display_priority: 50,
          is_active: true,
        });
      } else {
        setMessage({ type: "error", text: data.detail || "Failed to create platform." });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Error submitting platform." });
    }
  };

  // Handle Edit Platform Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlatform) return;

    try {
      const res = await fetch(`http://localhost:8000/api/v1/admin/platforms/${editingPlatform.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editingPlatform.name,
          category_id: editingPlatform.category_id,
          official_url: editingPlatform.official_url,
          logo_url: editingPlatform.logo_url,
          description: editingPlatform.description,
          pricing_type: editingPlatform.pricing_type,
          integration_type: editingPlatform.integration_type,
          display_priority: Number(editingPlatform.display_priority),
          is_active: editingPlatform.is_active
        })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setPlatforms((prev) =>
          prev.map((item) => (item.id === editingPlatform.id ? data.data : item))
        );
        setEditingPlatform(null);
        setMessage({ type: "success", text: data.message });
      } else {
        setMessage({ type: "error", text: data.detail || "Failed to update platform." });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Error updating platform." });
    }
  };

  // RBAC Access Guard Screen
  if (!isLoading && !isAdmin) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="glass-card max-w-md w-full p-8 rounded-2xl border border-surface-border text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-500 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">Admin Privileges Required</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            The Platform Catalog & Admin Management suite is restricted to authorized operators with the <strong className="text-indigo-400">ADMIN</strong> or <strong className="text-indigo-400">SUPER_ADMIN</strong> role.
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <Link
              href="/login"
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-md"
            >
              Sign In with Admin Account
            </Link>
            <Link
              href="/platforms"
              className="text-xs text-slate-500 dark:text-slate-400 hover:underline"
            >
              Return to Public Platform Directory
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Filtered platforms
  const filtered = platforms.filter((p) => {
    const matchesSearch =
      searchQuery === "" ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      selectedCategory === "" || p.category_id === selectedCategory;

    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE" && p.is_active) ||
      (statusFilter === "INACTIVE" && !p.is_active);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Top Navigation & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-border pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link
              href="/platforms"
              className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-semibold transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Platforms</span>
            </Link>
            <span className="text-slate-400">/</span>
            <span className="text-xs font-bold text-indigo-500 dark:text-cyan-400 uppercase tracking-wider">
              Control Center
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Server className="w-8 h-8 text-indigo-500 dark:text-cyan-400" />
            <span>Platform Catalog & Admin Management</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Live database management for 40+ streaming, music, anime, and podcast services, integration tiers, and stream health.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Platform</span>
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl text-xs sm:text-sm font-semibold max-w-xl mx-auto flex items-center justify-between gap-3 ${
            message.type === "success"
              ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
              : "bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400"
          }`}
        >
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="p-1 hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Metrics Row */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-card p-4 rounded-xl border border-surface-border">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Total Platforms</span>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {stats.total_platforms}
            </div>
            <span className="text-[11px] text-emerald-500 font-semibold">{stats.active_platforms} Active Online</span>
          </div>

          <div className="glass-card p-4 rounded-xl border border-surface-border">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Categories</span>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {stats.total_categories}
            </div>
            <span className="text-[11px] text-indigo-400 font-semibold">OTT, Music, Video, Anime...</span>
          </div>

          <div className="glass-card p-4 rounded-xl border border-surface-border">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Registered Users</span>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {stats.total_users}
            </div>
            <span className="text-[11px] text-cyan-400 font-semibold">{stats.premium_users} Premium Tier</span>
          </div>

          <div className="glass-card p-4 rounded-xl border border-surface-border">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">System State</span>
            <div className="text-2xl font-black text-emerald-500 mt-1 flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
              <span>HEALTHY</span>
            </div>
            <span className="text-[11px] text-slate-400">Zero Unhandled Outages</span>
          </div>
        </div>
      )}

      {/* Search & Filter Controls */}
      <div className="glass-card p-4 rounded-xl border border-surface-border flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search platforms by name, slug, description..."
            className="w-full bg-surface-card border border-surface-border rounded-xl pl-9 pr-4 py-2 text-xs text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-surface-card border border-surface-border rounded-xl px-3 py-2 text-xs text-foreground font-semibold focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Categories ({platforms.length})</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Status Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-surface-card border border-surface-border rounded-xl px-3 py-2 text-xs text-foreground font-semibold focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Deactivated Only</option>
          </select>
        </div>
      </div>

      {/* Platforms Registry Table */}
      <div className="glass-card rounded-2xl border border-surface-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-surface-border bg-surface-card/60 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Platform</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Pricing Tier</th>
                <th className="py-3 px-3">Integration</th>
                <th className="py-3 px-3 text-center">Priority</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-right">Admin Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border/50 text-slate-700 dark:text-slate-300">
              {filtered.map((p) => {
                const probe = healthStatus[p.id];
                return (
                  <tr key={p.id} className="hover:bg-surface-card/40 transition-colors">
                    {/* Platform Info */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-surface-card border border-surface-border flex items-center justify-center font-bold text-xs text-indigo-500 shrink-0">
                          {p.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-foreground flex items-center gap-1.5">
                            <span>{p.name}</span>
                            <a
                              href={p.official_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-slate-400 hover:text-indigo-400"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono">/{p.slug}</span>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-3 font-semibold text-foreground">
                      {p.category_name || "Uncategorized"}
                    </td>

                    {/* Pricing */}
                    <td className="py-3.5 px-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                        {p.pricing_type}
                      </span>
                    </td>

                    {/* Integration */}
                    <td className="py-3.5 px-3 font-mono text-[11px]">
                      {p.integration_type.replace("_", " ")}
                    </td>

                    {/* Display Priority */}
                    <td className="py-3.5 px-3 text-center font-bold font-mono">
                      {p.display_priority}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-3 text-center">
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                          p.is_active
                            ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/30"
                            : "bg-slate-500/15 text-slate-400 border-slate-500/30"
                        }`}
                      >
                        {p.is_active ? "ACTIVE" : "INACTIVE"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Health Check Button */}
                        <button
                          onClick={() => handleHealthProbe(p.id)}
                          disabled={healthChecking === p.id}
                          title="Probe link availability and latency"
                          className="p-1.5 rounded-lg bg-surface-card hover:bg-surface border border-surface-border text-slate-400 hover:text-cyan-400 transition-colors"
                        >
                          <Activity className={`w-3.5 h-3.5 ${healthChecking === p.id ? "animate-spin text-cyan-400" : ""}`} />
                        </button>

                        {/* Edit Button */}
                        <button
                          onClick={() => setEditingPlatform(p)}
                          title="Edit platform details"
                          className="p-1.5 rounded-lg bg-surface-card hover:bg-surface border border-surface-border text-slate-400 hover:text-indigo-400 transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {/* Active Toggle / Soft-deactivate */}
                        <button
                          onClick={() => handleToggleActive(p)}
                          title={p.is_active ? "Deactivate platform" : "Activate platform"}
                          className={`p-1.5 rounded-lg border transition-colors ${
                            p.is_active
                              ? "bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border-rose-500/20"
                              : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border-emerald-500/20"
                          }`}
                        >
                          {p.is_active ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      {/* Health result notification line */}
                      {probe && (
                        <div className="text-[10px] text-right mt-1 font-mono">
                          <span className={probe.status === "OPERATIONAL" ? "text-emerald-500" : "text-amber-500"}>
                            {probe.status} ({probe.ms}ms)
                          </span>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Platform Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-lg w-full rounded-2xl border border-surface-border p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <h3 className="text-lg font-black text-foreground flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-500" />
                <span>Register New Entertainment Platform</span>
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Platform Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Mubi, Hoichoi, Lionsgate Play"
                  className="w-full bg-surface-card border border-surface-border rounded-xl px-3 py-2 text-foreground focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Category *</label>
                <select
                  required
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  className="w-full bg-surface-card border border-surface-border rounded-xl px-3 py-2 text-foreground focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Official Website URL *</label>
                <input
                  type="url"
                  required
                  value={formData.official_url}
                  onChange={(e) => setFormData({ ...formData, official_url: e.target.value })}
                  placeholder="https://platform.com"
                  className="w-full bg-surface-card border border-surface-border rounded-xl px-3 py-2 text-foreground focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Pricing Tier</label>
                  <select
                    value={formData.pricing_type}
                    onChange={(e) => setFormData({ ...formData, pricing_type: e.target.value })}
                    className="w-full bg-surface-card border border-surface-border rounded-xl px-3 py-2 text-foreground focus:outline-none focus:border-indigo-500"
                  >
                    <option value="FREE">FREE</option>
                    <option value="PAID">PAID</option>
                    <option value="FREEMIUM">FREEMIUM</option>
                    <option value="SUBSCRIPTION">SUBSCRIPTION</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Integration Tier</label>
                  <select
                    value={formData.integration_type}
                    onChange={(e) => setFormData({ ...formData, integration_type: e.target.value })}
                    className="w-full bg-surface-card border border-surface-border rounded-xl px-3 py-2 text-foreground focus:outline-none focus:border-indigo-500"
                  >
                    <option value="OFFICIAL_LINK">OFFICIAL LINK</option>
                    <option value="OFFICIAL_API">OFFICIAL API</option>
                    <option value="OAUTH">OAUTH</option>
                    <option value="PARTNER">PARTNER</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Display Priority (0-100)</label>
                  <input
                    type="number"
                    value={formData.display_priority}
                    onChange={(e) => setFormData({ ...formData, display_priority: Number(e.target.value) })}
                    className="w-full bg-surface-card border border-surface-border rounded-xl px-3 py-2 text-foreground focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Custom Slug (optional)</label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="auto-derived if empty"
                    className="w-full bg-surface-card border border-surface-border rounded-xl px-3 py-2 text-foreground focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Summary of movies, music, or anime provided..."
                  className="w-full bg-surface-card border border-surface-border rounded-xl px-3 py-2 text-foreground focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-3 border-t border-surface-border flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-foreground font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-md transition-all"
                >
                  Save Platform
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Platform Modal */}
      {editingPlatform && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-lg w-full rounded-2xl border border-surface-border p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <h3 className="text-lg font-black text-foreground flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-indigo-500" />
                <span>Edit {editingPlatform.name}</span>
              </h3>
              <button onClick={() => setEditingPlatform(null)} className="text-slate-400 hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Platform Name</label>
                <input
                  type="text"
                  required
                  value={editingPlatform.name}
                  onChange={(e) => setEditingPlatform({ ...editingPlatform, name: e.target.value })}
                  className="w-full bg-surface-card border border-surface-border rounded-xl px-3 py-2 text-foreground focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Official URL</label>
                <input
                  type="url"
                  required
                  value={editingPlatform.official_url}
                  onChange={(e) => setEditingPlatform({ ...editingPlatform, official_url: e.target.value })}
                  className="w-full bg-surface-card border border-surface-border rounded-xl px-3 py-2 text-foreground focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Pricing Tier</label>
                  <select
                    value={editingPlatform.pricing_type}
                    onChange={(e) => setEditingPlatform({ ...editingPlatform, pricing_type: e.target.value })}
                    className="w-full bg-surface-card border border-surface-border rounded-xl px-3 py-2 text-foreground focus:outline-none focus:border-indigo-500"
                  >
                    <option value="FREE">FREE</option>
                    <option value="PAID">PAID</option>
                    <option value="FREEMIUM">FREEMIUM</option>
                    <option value="SUBSCRIPTION">SUBSCRIPTION</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Display Priority</label>
                  <input
                    type="number"
                    value={editingPlatform.display_priority}
                    onChange={(e) => setEditingPlatform({ ...editingPlatform, display_priority: Number(e.target.value) })}
                    className="w-full bg-surface-card border border-surface-border rounded-xl px-3 py-2 text-foreground focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editingPlatform.description || ""}
                  onChange={(e) => setEditingPlatform({ ...editingPlatform, description: e.target.value })}
                  className="w-full bg-surface-card border border-surface-border rounded-xl px-3 py-2 text-foreground focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="editIsActive"
                  checked={editingPlatform.is_active}
                  onChange={(e) => setEditingPlatform({ ...editingPlatform, is_active: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="editIsActive" className="text-slate-300 font-semibold cursor-pointer">
                  Platform is Active & Visible in Discovery
                </label>
              </div>

              <div className="pt-3 border-t border-surface-border flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingPlatform(null)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-foreground font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-md transition-all"
                >
                  Update Platform
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
