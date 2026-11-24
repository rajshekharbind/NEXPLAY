import Link from "next/link";
import { Compass, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 space-y-6">
      <div className="relative">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-[#E50914] via-[#0070D1] to-[#1DB954] p-[2px] shadow-2xl flex items-center justify-center">
          <div className="w-full h-full rounded-[14px] bg-slate-900 flex items-center justify-center">
            <Compass className="w-10 h-10 text-cyan-400 animate-spin" style={{ animationDuration: "12s" }} />
          </div>
        </div>
      </div>

      <div className="space-y-2 max-w-md">
        <span className="text-xs uppercase tracking-widest font-black text-rose-500 bg-rose-500/10 border border-rose-500/20 px-3 py-1 rounded-full">
          404 Destination Not Found
        </span>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white pt-2">
          Lost in the Entertainment Multiverse?
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          The entertainment service or page you requested could not be located in the NEXPLAY directory.
        </p>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Link
          href="/"
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
        >
          <Home className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>
        <Link
          href="/platforms"
          className="px-5 py-2.5 rounded-xl bg-surface-card hover:bg-surface border border-surface-border text-foreground font-bold text-xs transition-all flex items-center gap-2"
        >
          <Compass className="w-3.5 h-3.5 text-cyan-400" />
          <span>Explore 40+ Platforms</span>
        </Link>
      </div>
    </div>
  );
}
