"use client";

import React from "react";

export default function BackgroundAurora() {
  return (
    <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden select-none">
      {/* 3D Floating Streaming Aura Orbs */}

      {/* Netflix Crimson Aurora (Top Left / Center) */}
      <div
        className="absolute -top-[15%] left-[5%] w-[550px] h-[550px] rounded-full opacity-35 dark:opacity-40 blur-[130px] mix-blend-screen animate-aurora-slow"
        style={{
          background: "radial-gradient(circle, #E50914 0%, rgba(229, 9, 20, 0.4) 50%, transparent 75%)",
        }}
      />

      {/* Sony / PlayStation Electric Blue (Top Right) */}
      <div
        className="absolute top-[5%] -right-[10%] w-[600px] h-[600px] rounded-full opacity-30 dark:opacity-35 blur-[140px] mix-blend-screen animate-aurora-reverse"
        style={{
          background: "radial-gradient(circle, #0070D1 0%, #003791 45%, transparent 75%)",
        }}
      />

      {/* Spotify Emerald Glow (Center Left / Bottom) */}
      <div
        className="absolute top-[45%] -left-[10%] w-[500px] h-[500px] rounded-full opacity-25 dark:opacity-30 blur-[125px] mix-blend-screen animate-aurora-float"
        style={{
          background: "radial-gradient(circle, #1DB954 0%, rgba(29, 185, 84, 0.3) 50%, transparent 75%)",
        }}
      />

      {/* YouTube Crimson / Hotstar Sunset (Bottom Center / Right) */}
      <div
        className="absolute -bottom-[15%] right-[15%] w-[650px] h-[650px] rounded-full opacity-30 dark:opacity-35 blur-[150px] mix-blend-screen animate-aurora-slow"
        style={{
          background: "radial-gradient(circle, #FF0033 0%, #7928CA 45%, transparent 75%)",
        }}
      />

      {/* Prime Video Electric Cyan Accent (Center Floating) */}
      <div
        className="absolute top-[30%] left-[40%] w-[420px] h-[420px] rounded-full opacity-20 dark:opacity-25 blur-[110px] mix-blend-screen animate-aurora-reverse"
        style={{
          background: "radial-gradient(circle, #00A8E1 0%, rgba(0, 168, 225, 0.2) 60%, transparent 80%)",
        }}
      />

      {/* Subtle Cinematic Film Grain Overlay */}
      <div className="absolute inset-0 bg-noise opacity-[0.015] dark:opacity-[0.025]" />

      {/* Light Mode Pearlescent Veil */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-transparent to-white/80 dark:hidden" />
    </div>
  );
}
