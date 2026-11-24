"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/AuthContext";
import Card3D from "@/components/Card3D";
import { PlaySquare, UserPlus, Lock, Mail, User, Sparkles, CheckCircle2, Globe } from "lucide-react";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [language, setLanguage] = useState("en");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    const res = await register({
      email,
      password,
      full_name: fullName,
      country_code: "IN",
      preferred_language: language,
    });
    setIsSubmitting(false);

    if (res.success) {
      router.push("/");
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-10 px-4">
      <Card3D glowColor="rgba(0, 168, 225, 0.45)" className="w-full max-w-lg">
        <div className="glass-card rounded-3xl p-8 sm:p-10 border border-surface-border shadow-2xl relative">
          {/* Header */}
          <div className="text-center space-y-2 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#E50914] via-[#0070D1] to-[#1DB954] p-[1.5px] mx-auto shadow-lg mb-3">
              <div className="w-full h-full rounded-[14px] bg-surface flex items-center justify-center">
                <PlaySquare className="w-6 h-6 text-indigo-500 dark:text-cyan-400" />
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              Create Your NEXPLAY Account
            </h1>
            <p className="text-xs text-foreground-muted">
              One account to discover, organize, and manage 40+ entertainment platforms
            </p>
          </div>

          {/* Bonus Badge */}
          <div className="p-3 mb-6 rounded-2xl bg-gradient-to-r from-indigo-500/15 via-cyan-500/15 to-purple-500/15 border border-indigo-500/30 flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
            <div className="text-xs">
              <span className="font-bold text-foreground">Welcome Bonus: </span>
              <span className="text-indigo-600 dark:text-cyan-300 font-extrabold">100 Free AI Credits</span>
              <span className="text-foreground-muted block text-[11px]">Included automatically upon registration</span>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3.5 mb-6 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-500 font-semibold text-center">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground-muted block">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Rahul Verma"
                  className="w-full bg-white dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 dark:focus:border-cyan-400 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground-muted block">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="rahul@example.com"
                  className="w-full bg-white dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 dark:focus:border-cyan-400 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground-muted block">Password (min 6 chars)</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 dark:focus:border-cyan-400 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground-muted block">Preferred Language</label>
                <div className="relative">
                  <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 dark:focus:border-cyan-400 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  >
                    <option value="en">English</option>
                    <option value="hi">Hindi (हिंदी)</option>
                    <option value="te">Telugu (తెలుగు)</option>
                    <option value="ta">Tamil (தமிழ்)</option>
                  </select>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-sm shadow-xl shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-70"
            >
              <UserPlus className="w-4 h-4" />
              <span>{isSubmitting ? "Creating Your Profile..." : "Complete Registration"}</span>
            </button>
          </form>

          {/* Footer Link */}
          <p className="text-center text-xs text-foreground-muted mt-6">
            Already have a NEXPLAY account?{" "}
            <Link href="/login" className="font-bold text-indigo-500 dark:text-cyan-400 hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </Card3D>
    </div>
  );
}
