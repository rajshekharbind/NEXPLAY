"use client";

import React, { useRef, useState } from "react";

interface Card3DProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string; // Brand glow: e.g. "rgba(229, 9, 20, 0.4)" for Netflix
  brandGlowColor?: string;
  intensity?: number;
}

export default function Card3D({ children, className = "", glowColor, brandGlowColor, intensity = 10 }: Card3DProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [glarePosition, setGlarePosition] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);

  const activeGlow = glowColor || brandGlowColor;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // 3D tilt calculation calibrated by intensity
    const maxTilt = intensity || 10;
    const rotateX = ((y - centerY) / centerY) * -maxTilt;
    const rotateY = ((x - centerX) / centerX) * maxTilt;

    setRotation({ x: rotateX, y: rotateY });
    setGlarePosition({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
    });
  };

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotation({ x: 0, y: 0 });
  };

  const dynamicGlow = activeGlow && isHovered ? {
    boxShadow: `0 14px 40px -10px ${activeGlow}, 0 0 25px -5px ${activeGlow}`
  } : undefined;

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        perspective: "1000px",
      }}
      className="relative transition-transform duration-200"
    >
      <div
        style={{
          transform: isHovered
            ? `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) translateZ(12px) scale3d(1.02, 1.02, 1.02)`
            : "rotateX(0deg) rotateY(0deg) translateZ(0px) scale3d(1, 1, 1)",
          transformStyle: "preserve-3d",
          ...dynamicGlow
        }}
        className={`relative transition-all duration-200 ease-out overflow-hidden ${className}`}
      >
        {children}

        {/* 3D Dynamic Specular Glare */}
        {isHovered && (
          <div
            style={{
              background: `radial-gradient(circle at ${glarePosition.x}% ${glarePosition.y}%, rgba(255, 255, 255, 0.14) 0%, rgba(255, 255, 255, 0) 65%)`,
            }}
            className="pointer-events-none absolute inset-0 z-20 mix-blend-overlay transition-opacity duration-300"
          />
        )}
      </div>
    </div>
  );
}
