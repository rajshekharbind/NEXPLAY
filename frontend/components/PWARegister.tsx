"use client";

import { useEffect } from "react";

export default function PWARegister() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("[NEXPLAY PWA] Service worker registered successfully:", reg.scope);
        })
        .catch((err) => {
          console.error("[NEXPLAY PWA] Service worker registration failed:", err);
        });
    }
  }, []);

  return null;
}
