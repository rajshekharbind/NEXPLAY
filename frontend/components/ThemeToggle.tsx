"use client";

import { useTheme } from "./ThemeProvider";
import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-9 h-9 rounded-xl bg-surface/50 border border-surface-border" />
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle Theme"
      className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 bg-surface/80 hover:bg-surface border border-surface-border text-slate-300 hover:text-white shadow-sm hover:shadow-md hover:border-indigo-500/40 group overflow-hidden"
    >
      <div className="relative w-4 h-4 flex items-center justify-center">
        {isDark ? (
          <Sun className="w-4 h-4 text-amber-400 group-hover:rotate-45 group-hover:scale-110 transition-transform duration-300" />
        ) : (
          <Moon className="w-4 h-4 text-indigo-500 group-hover:-rotate-12 group-hover:scale-110 transition-transform duration-300" />
        )}
      </div>
    </button>
  );
}
