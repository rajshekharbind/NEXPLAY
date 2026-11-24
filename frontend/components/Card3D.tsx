"use client";

import React, { useRef, useState, useEffect } from "react";

interface Card3DProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string; // Brand glow: e.g. "rgba(229, 9, 20, 0.4)" for Netflix
  brandGlowColor?: string;
  intensity?: number;
}

export default function Card3D({ children, className = "", glowColor, brandGlowColor, intensity = 8 }: Card3DProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [glarePosition, setGlarePosition] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    // Detect touch-only mobile devices to avoid interfering with scrolling
    if (typeof window !== "undefined") {
      setIsTouchDevice(window.matchMedia("(hover: none)").matches);
    }
  }, []);

  const activeGlow = glowColor || brandGlowColor;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isTouchDevice || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // 3D tilt calculation calibrated by intensity
    const maxTilt = intensity || 8;
    const rotateX = ((y - centerY) / centerY) * -maxTilt;
    const rotateY = ((x - centerX) / centerX) * maxTilt;

    setRotation({ x: rotateX, y: rotateY });
    setGlarePosition({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
    });
  };

  const handleMouseEnter = () => {
    if (!isTouchDevice) setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotation({ x: 0, y: 0 });
  };

  const dynamicGlow = activeGlow && isHovered && !isTouchDevice ? {
    boxShadow: `0 14px 40px -10px ${activeGlow}, 0 0 25px -5px ${activeGlow}`
  } : undefined;

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        perspective: isTouchDevice ? "none" : "1000px",
        touchAction: "manipulation",
      }}
      className={`relative transition-all duration-200 ${className}`}
    >
      <div
        style={{
          transform: !isTouchDevice && isHovered
            ? `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) translateZ(10px)`
            : "none",
          transition: isHovered ? "transform 0.1s ease-out" : "transform 0.5s ease-out",
          transformStyle: isTouchDevice ? "flat" : "preserve-3d",
          ...dynamicGlow,
        }}
        className="w-full h-full rounded-2xl relative overflow-hidden active:scale-[0.99] transition-transform"
      >
        {children}

        {/* Dynamic Specular Glare (Desktop only) */}
        {!isTouchDevice && isHovered && (
          <div
            className="pointer-events-none absolute inset-0 z-20 mix-blend-overlay opacity-30 transition-opacity duration-300 rounded-2xl"
            style={{
              background: `radial-gradient(circle at ${glarePosition.x}% ${glarePosition.y}%, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 60%)`,
            }}
          />
        )}
      </div>
    </div>
  );
}
