import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        surface: "var(--surface)",
        "surface-card": "var(--surface-card)",
        "surface-border": "var(--surface-border)",
        foreground: "var(--foreground)",
        "foreground-muted": "var(--foreground-muted)",

        // Iconic Entertainment Brand Accents
        brand: {
          netflix: "#E50914",
          spotify: "#1DB954",
          youtube: "#FF0033",
          sony: "#0070D1",
          sonyDark: "#003791",
          prime: "#00A8E1",
          hotstar: "#FF9900",
          crunchyroll: "#FF6600",
          apple: "#94A3B8",
          plex: "#E5A00D",
        },

        primary: {
          DEFAULT: "#6366F1",
          hover: "#4F46E5",
          foreground: "#FFFFFF",
        },
        accent: {
          cyan: "#06B6D4",
          violet: "#8B5CF6",
          rose: "#F43F5E",
          amber: "#F59E0B",
          emerald: "#10B981",
        },
      },
      keyframes: {
        "aurora-slow": {
          "0%, 100%": { transform: "translate3d(0, 0, 0) scale(1)" },
          "50%": { transform: "translate3d(40px, 60px, 0) scale(1.12)" },
        },
        "aurora-reverse": {
          "0%, 100%": { transform: "translate3d(0, 0, 0) scale(1)" },
          "50%": { transform: "translate3d(-50px, -40px, 0) scale(0.92)" },
        },
        "aurora-float": {
          "0%, 100%": { transform: "translate3d(0, 0, 0) scale(1)" },
          "33%": { transform: "translate3d(30px, -40px, 0) scale(1.08)" },
          "66%": { transform: "translate3d(-40px, 30px, 0) scale(0.95)" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "0.6", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.05)" },
        },
        "float-3d": {
          "0%, 100%": { transform: "translateY(0px) rotateX(0deg)" },
          "50%": { transform: "translateY(-8px) rotateX(2deg)" },
        }
      },
      animation: {
        "aurora-slow": "aurora-slow 18s ease-in-out infinite",
        "aurora-reverse": "aurora-reverse 22s ease-in-out infinite",
        "aurora-float": "aurora-float 26s ease-in-out infinite",
        "pulse-glow": "pulse-glow 4s ease-in-out infinite",
        "float-3d": "float-3d 6s ease-in-out infinite",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
