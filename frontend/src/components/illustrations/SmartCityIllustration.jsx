"use client";

import React from "react";
import { motion } from "framer-motion";

export function SmartCityIllustration({ className = "w-full h-auto" }) {
  return (
    <svg
      viewBox="0 0 460 280"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Background Soft Mesh */}
      <rect width="460" height="280" rx="24" fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="1" />

      {/* Grid Floor */}
      <g stroke="hsl(var(--border))" strokeWidth="1" opacity="0.6">
        <line x1="20" y1="230" x2="440" y2="230" />
        <line x1="40" y1="200" x2="420" y2="200" />
        <line x1="80" y1="170" x2="380" y2="170" />
      </g>

      {/* Isometric City Buildings */}
      {/* Building 1 (Left) */}
      <g transform="translate(60, 110)">
        <polygon points="0,50 30,35 60,50 30,65" fill="hsl(var(--muted))" />
        <polygon points="0,50 30,65 30,120 0,105" fill="hsl(var(--muted-foreground) / 0.15)" stroke="hsl(var(--border))" />
        <polygon points="30,65 60,50 60,105 30,120" fill="hsl(var(--muted-foreground) / 0.25)" stroke="hsl(var(--border))" />
      </g>

      {/* Building 2 (Center High Tower) */}
      <g transform="translate(190, 50)">
        <polygon points="0,40 40,20 80,40 40,60" fill="hsl(var(--primary) / 0.2)" stroke="hsl(var(--primary))" strokeWidth="1.5" />
        <polygon points="0,40 40,60 40,180 0,160" fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="1.5" />
        <polygon points="40,60 80,40 80,160 40,180" fill="hsl(var(--muted))" stroke="hsl(var(--border))" strokeWidth="1.5" />

        {/* Windows */}
        <line x1="15" y1="80" x2="15" y2="140" stroke="hsl(var(--primary))" strokeWidth="2" strokeDasharray="4 6" />
        <line x1="60" y1="80" x2="60" y2="140" stroke="hsl(var(--primary))" strokeWidth="2" strokeDasharray="4 6" />

        {/* Antenna Tower */}
        <line x1="40" y1="20" x2="40" y2="-10" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" />
        <circle cx="40" cy="-10" r="4" fill="hsl(var(--primary))" />
      </g>

      {/* Building 3 (Right) */}
      <g transform="translate(320, 100)">
        <polygon points="0,45 35,25 70,45 35,65" fill="hsl(var(--muted))" />
        <polygon points="0,45 35,65 35,130 0,110" fill="hsl(var(--muted-foreground) / 0.15)" stroke="hsl(var(--border))" />
        <polygon points="35,65 70,45 70,110 35,130" fill="hsl(var(--muted-foreground) / 0.25)" stroke="hsl(var(--border))" />
      </g>

      {/* Connected Smart Sensor Rays */}
      <motion.path
        d="M230 40 C 270 40, 310 90, 355 125"
        stroke="hsl(var(--primary))"
        strokeWidth="1.5"
        strokeDasharray="4 4"
        animate={{ strokeDashoffset: [0, -16] }}
        transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
      />
      <motion.path
        d="M230 40 C 180 40, 130 90, 90 135"
        stroke="hsl(var(--primary))"
        strokeWidth="1.5"
        strokeDasharray="4 4"
        animate={{ strokeDashoffset: [0, -16] }}
        transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
      />

      {/* Street Node Markers */}
      <g transform="translate(140, 205)">
        <circle cx="15" cy="15" r="8" fill="hsl(var(--card))" stroke="#10B981" strokeWidth="2" />
        <circle cx="15" cy="15" r="3" fill="#10B981" />
      </g>
      <g transform="translate(290, 205)">
        <circle cx="15" cy="15" r="8" fill="hsl(var(--card))" stroke="hsl(var(--primary))" strokeWidth="2" />
        <circle cx="15" cy="15" r="3" fill="hsl(var(--primary))" />
      </g>
    </svg>
  );
}
