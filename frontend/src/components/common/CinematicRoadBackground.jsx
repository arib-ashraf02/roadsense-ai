"use client";

import React from "react";
import { useTheme } from "@/components/providers/ThemeProvider";

export function CinematicRoadBackground() {
  const { currentThemeConfig } = useTheme();
  const glow = currentThemeConfig?.colors?.glow || "rgba(56, 189, 248, 0.15)";
  const primary = currentThemeConfig?.colors?.primary || "#38BDF8";

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background transition-colors duration-500"
    >
      {/* Subtle Atmospheric Dark Glow Spheres */}
      <div
        className="absolute -top-[15%] left-1/2 -translate-x-1/2 w-[900px] h-[550px] rounded-full blur-[140px] opacity-25 transition-all duration-700"
        style={{
          background: `radial-gradient(circle, ${primary} 0%, ${glow} 60%, transparent 100%)`,
        }}
      />
      <div
        className="absolute top-[40%] -right-[10%] w-[650px] h-[450px] rounded-full blur-[130px] opacity-15 transition-all duration-700"
        style={{
          background: `radial-gradient(circle, ${primary} 0%, transparent 70%)`,
        }}
      />

      {/* Subtle Dark Vignette Border */}
      <div className="absolute inset-0 bg-radial-gradient from-transparent via-background/60 to-background opacity-90" />
    </div>
  );
}
