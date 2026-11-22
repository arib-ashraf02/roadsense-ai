"use client";

import React from "react";
import { motion } from "framer-motion";

export function AiPotholeIllustration({ className = "w-full h-auto" }) {
  return (
    <svg
      viewBox="0 0 400 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect
        width="400"
        height="300"
        rx="24"
        fill="hsl(var(--card))"
        stroke="hsl(var(--border))"
        strokeWidth="1.5"
      />

      {/* Frame Corner Guides */}
      <path d="M20 35 L20 20 L35 20" stroke="hsl(var(--muted-foreground))" strokeWidth="2" strokeLinecap="round" />
      <path d="M380 35 L380 20 L365 20" stroke="hsl(var(--muted-foreground))" strokeWidth="2" strokeLinecap="round" />
      <path d="M20 265 L20 280 L35 280" stroke="hsl(var(--muted-foreground))" strokeWidth="2" strokeLinecap="round" />
      <path d="M380 265 L380 280 L365 280" stroke="hsl(var(--muted-foreground))" strokeWidth="2" strokeLinecap="round" />

      {/* Road Texture Canvas */}
      <rect x="40" y="40" width="320" height="220" rx="16" fill="hsl(var(--muted) / 0.4)" />

      {/* Asphalt Surface Grit Dots */}
      <circle cx="80" cy="80" r="1.5" fill="hsl(var(--muted-foreground))" opacity="0.4" />
      <circle cx="150" cy="65" r="1" fill="hsl(var(--muted-foreground))" opacity="0.3" />
      <circle cx="280" cy="90" r="1.5" fill="hsl(var(--muted-foreground))" opacity="0.4" />
      <circle cx="110" cy="210" r="1" fill="hsl(var(--muted-foreground))" opacity="0.3" />
      <circle cx="310" cy="220" r="1.5" fill="hsl(var(--muted-foreground))" opacity="0.4" />

      {/* Centered Pothole Defect Contour */}
      <g transform="translate(130, 95)">
        {/* Outer Fault Edge */}
        <path
          d="M10 40 Q25 15 65 20 T125 45 T110 85 T50 90 T10 40 Z"
          fill="hsl(var(--foreground) / 0.08)"
          stroke="hsl(var(--primary))"
          strokeWidth="2"
          strokeLinejoin="round"
        />

        {/* Deep Core Cavity */}
        <path
          d="M28 42 Q40 28 72 32 T102 52 T88 78 T42 80 T28 42 Z"
          fill="hsl(var(--primary) / 0.18)"
        />

        {/* AI Depth Vector Contours */}
        <line x1="40" y1="35" x2="65" y2="60" stroke="hsl(var(--primary))" strokeWidth="1" strokeDasharray="2 2" />
        <line x1="85" y1="35" x2="70" y2="65" stroke="hsl(var(--primary))" strokeWidth="1" strokeDasharray="2 2" />

        {/* Depth Marker */}
        <circle cx="70" cy="62" r="3" fill="hsl(var(--primary))" />
        <text
          x="75"
          y="65"
          fill="hsl(var(--primary))"
          fontSize="9"
          fontWeight="bold"
          fontFamily="sans-serif"
        >
          ~6.8cm
        </text>
      </g>

      {/* Detection Box HUD */}
      <rect
        x="120"
        y="80"
        width="160"
        height="120"
        rx="8"
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth="1.5"
        strokeDasharray="4 4"
      />

      {/* Top Banner Tag */}
      <g transform="translate(120, 56)">
        <rect width="110" height="20" rx="4" fill="hsl(var(--primary))" />
        <text
          x="8"
          y="14"
          fill="hsl(var(--primary-foreground))"
          fontSize="10"
          fontWeight="700"
          fontFamily="sans-serif"
        >
          YOLOv8 — SEVERE
        </text>
      </g>

      {/* Floating Status Badge Bottom */}
      <g transform="translate(200, 215)">
        <rect
          width="145"
          height="28"
          rx="14"
          fill="hsl(var(--card))"
          stroke="hsl(var(--border))"
          strokeWidth="1.5"
        />
        <circle cx="16" cy="14" r="4" fill="#EF4444" />
        <text
          x="28"
          y="17"
          fill="hsl(var(--foreground))"
          fontSize="10"
          fontWeight="600"
          fontFamily="sans-serif"
        >
          HAZARD LEVEL: HIGH
        </text>
      </g>
    </svg>
  );
}
