"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "@/components/providers/ThemeProvider";

export function FloatingHolo3D({ className = "" }) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const { currentThemeConfig } = useTheme();

  useEffect(() => {
    const handleMouseMove = (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 20;
      const y = (e.clientY / window.innerHeight - 0.5) * 20;
      setMousePos({ x, y });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const primary = currentThemeConfig?.colors?.primary || "#3B82F6";
  const accent = currentThemeConfig?.colors?.accent || "#00F2FE";

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none relative flex items-center justify-center ${className}`}
      style={{ perspective: "1000px" }}
    >
      <div
        className="relative h-64 w-64 transition-transform duration-300 ease-out"
        style={{
          transformStyle: "preserve-3d",
          transform: `rotateY(${mousePos.x}deg) rotateX(${-mousePos.y}deg)`,
        }}
      >
        {/* Outer Tech Ring */}
        <div
          className="absolute inset-0 rounded-full border-2 border-dashed opacity-40 transition-colors duration-500 animate-spin"
          style={{
            borderColor: primary,
            animationDuration: "35s",
          }}
        />

        {/* Middle Glowing Octagon / Ring */}
        <div
          className="absolute inset-4 rounded-full border border-solid opacity-60 transition-colors duration-500"
          style={{
            borderColor: accent,
            boxShadow: `0 0 25px ${currentThemeConfig?.colors?.glow || "rgba(59,130,246,0.3)"}`,
          }}
        />

        {/* Inner Laser Scanner Disc */}
        <div
          className="absolute inset-10 rounded-full border border-dotted opacity-50 animate-spin"
          style={{
            borderColor: primary,
            animationDirection: "reverse",
            animationDuration: "25s",
          }}
        />

        {/* Center Holographic Core */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="h-16 w-16 rounded-2xl border backdrop-blur-md flex items-center justify-center shadow-lg transition-all duration-500"
            style={{
              backgroundColor: "hsl(var(--card) / 0.8)",
              borderColor: primary,
              boxShadow: `0 0 30px ${currentThemeConfig?.colors?.glow || "rgba(59,130,246,0.4)"}`,
              transform: "translateZ(40px)",
            }}
          >
            <div
              className="h-6 w-6 rounded-lg animate-pulse"
              style={{ backgroundColor: primary }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
