"use client";

import { useAuth } from "@/components/AuthContext";
import Card3D from "@/components/Card3D";
import { User, Mail, Shield, Sparkles, Globe, Edit3, Bookmark, Compass, CheckCircle2, Film } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function ProfilePage() {
  const { user, token, refreshUser, isAuthenticated, isLoading } = useAuth();
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [language, setLanguage] = useState("en");
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    if (user?.profile) {
      setFullName(user.profile.full_name || "");
      setBio(user.profile.bio || "");
      setLanguage(user.profile.preferred_language || "en");
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-surface-card border border-surface-border flex items-center justify-center text-indigo-400">
          <User className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-foreground">Sign In to View Your Profile</h2>
        <p className="text-xs text-foreground-muted max-w-sm">
          Please sign in to access your entertainment profile, manage connected platforms, and view your AI credit balance.
        </p>
        <Link
          href="/login"
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 text-white font-bold text-xs shadow-lg"
        >
          Sign In Now
        </Link>
      </div>
    );
  }

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveMessage("");

    const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";
    try {
      const res = await fetch(`${API_BASE}/users/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          full_name: fullName,
          bio,
          preferred_language: language,
        }),
      });
      if (res.ok) {
        await refreshUser();
        setSaveMessage("Profile updated successfully!");
      }
    } catch (err) {
      console.error("Profile update error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 pb-20 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl glass-panel border border-surface-border shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#E50914] via-[#0070D1] to-[#1DB954] p-[2px] shadow-lg">
            <div className="w-full h-full rounded-[14px] bg-surface flex items-center justify-center font-black text-xl text-indigo-500 dark:text-cyan-400">
              {user.profile?.full_name ? user.profile.full_name.slice(0, 2).toUpperCase() : "NP"}
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-foreground">
                {user.profile?.full_name || "NEXPLAY Member"}
              </h1>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-500 dark:text-cyan-400 border border-indigo-500/30">
                {user.role}
              </span>
            </div>
            <p className="text-xs text-foreground-muted flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" />
              <span>{user.email}</span>
            </p>
          </div>
        </div>

        {/* AI Credit Wallet Badge Card */}
        <div className="flex items-center gap-4 px-5 py-3 rounded-2xl bg-gradient-to-r from-indigo-500/15 via-cyan-500/15 to-purple-500/15 border border-indigo-500/30">
          <Sparkles className="w-6 h-6 text-indigo-400 animate-pulse" />
          <div>
            <div className="text-[10px] font-bold text-foreground-muted uppercase tracking-wider">Credit Wallet</div>
            <div className="text-2xl font-black text-foreground">
              {user.wallet?.balance_credits ?? 100}{" "}
              <span className="text-xs font-semibold text-indigo-500 dark:text-cyan-300">Credits</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Profile Settings Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card3D>
            <div className="glass-card rounded-3xl p-6 sm:p-8 border border-surface-border space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-foreground flex items-center gap-2">
                    <Edit3 className="w-4 h-4 text-indigo-500 dark:text-cyan-400" />
                    <span>Profile Details</span>
                  </h2>
                  <p className="text-xs text-foreground-muted">Update your entertainment persona</p>
                </div>
              </div>

              {saveMessage && (
                <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-500 font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{saveMessage}</span>
                </div>
              )}

              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground-muted">Display Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700/80 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 dark:focus:border-cyan-400 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground-muted">Bio</label>
                  <textarea
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us what you love to watch or listen to..."
                    className="w-full bg-white dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700/80 rounded-xl p-3 text-sm font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 dark:focus:border-cyan-400 transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground-muted">Preferred Language</label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700/80 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 dark:focus:border-cyan-400 transition-all"
                    >
                      <option value="en">English</option>
                      <option value="hi">Hindi (हिंदी)</option>
                      <option value="te">Telugu (తెలుగు)</option>
                      <option value="ta">Tamil (தமிழ்)</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground-muted">Region</label>
                    <input
                      type="text"
                      disabled
                      value="India (IN)"
                      className="w-full bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-medium text-foreground-muted cursor-not-allowed"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 text-white font-bold text-xs shadow-md hover:from-indigo-500 hover:to-cyan-400 transition-all disabled:opacity-70"
                >
                  {isSaving ? "Saving Changes..." : "Save Profile Changes"}
                </button>
              </form>
            </div>
          </Card3D>
        </div>

        {/* Right Column: Quick Stats & Connected Hub */}
        <div className="space-y-6">
          <Card3D glowColor="rgba(29, 185, 84, 0.4)">
            <div className="glass-card rounded-3xl p-6 border border-surface-border space-y-4">
              <h3 className="text-base font-black text-foreground flex items-center gap-2">
                <Compass className="w-4 h-4 text-emerald-400" />
                <span>Entertainment Hub Status</span>
              </h3>
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface border border-surface-border">
                  <span className="text-foreground-muted">Active Plan</span>
                  <span className="font-extrabold text-foreground">Free Tier (₹0)</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface border border-surface-border">
                  <span className="text-foreground-muted">Watchlist Status</span>
                  <span className="font-extrabold text-indigo-400">Default List Active</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface border border-surface-border">
                  <span className="text-foreground-muted">AI Copilot</span>
                  <span className="font-extrabold text-emerald-400">Ready (100 Credits)</span>
                </div>
              </div>
              <Link
                href="/platforms"
                className="w-full py-2.5 rounded-xl bg-surface hover:bg-surface-card border border-surface-border text-foreground font-bold text-xs flex items-center justify-center gap-2 transition-colors mt-2"
              >
                <span>Browse 40+ Catalog Platforms</span>
              </Link>
            </div>
          </Card3D>
        </div>
      </div>
    </div>
  );
}
