"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/AuthContext";
import Card3D from "@/components/Card3D";
import { PlaySquare, LogIn, Lock, Mail, ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    const res = await login(email, password);
    setIsSubmitting(false);

    if (res.success) {
      router.push("/");
    } else {
      setError(res.message);
    }
  };

  const handleQuickDemo = () => {
    setEmail("demo@nexplay.com");
    setPassword("DemoPassword123!");
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-10 px-4">
      <Card3D glowColor="rgba(99, 102, 241, 0.45)" className="w-full max-w-md">
        <div className="glass-card rounded-3xl p-8 sm:p-10 border border-surface-border shadow-2xl relative">
          {/* Header */}
          <div className="text-center space-y-2 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#E50914] via-[#0070D1] to-[#1DB954] p-[1.5px] mx-auto shadow-lg mb-3">
              <div className="w-full h-full rounded-[14px] bg-surface flex items-center justify-center">
                <PlaySquare className="w-6 h-6 text-indigo-500 dark:text-cyan-400" />
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              Welcome Back
            </h1>
            <p className="text-xs text-foreground-muted">
              Access 40+ entertainment platforms with your NEXPLAY profile
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3.5 mb-6 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-500 font-semibold text-center animate-shake">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground-muted block">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full bg-white dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 dark:focus:border-cyan-400 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground-muted">Password</label>
                <a href="#" className="text-[11px] font-semibold text-indigo-500 dark:text-cyan-400 hover:underline">
                  Forgot?
                </a>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 dark:focus:border-cyan-400 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-70"
            >
              <LogIn className="w-4 h-4" />
              <span>{isSubmitting ? "Authenticating..." : "Sign In to NEXPLAY"}</span>
            </button>
          </form>

          {/* Quick Demo Pre-fill */}
          <div className="mt-4 pt-4 border-t border-surface-border">
            <button
              type="button"
              onClick={handleQuickDemo}
              className="w-full py-2 px-3 rounded-xl bg-surface-card hover:bg-surface border border-surface-border text-xs font-semibold text-foreground-muted hover:text-foreground flex items-center justify-center gap-1.5 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Fill Quick Demo Credentials</span>
            </button>
          </div>

          {/* Footer Link */}
          <p className="text-center text-xs text-foreground-muted mt-6">
            Don&apos;t have an account yet?{" "}
            <Link href="/register" className="font-bold text-indigo-500 dark:text-cyan-400 hover:underline">
              Create Free Account
            </Link>
          </p>
        </div>
      </Card3D>
    </div>
  );
}
