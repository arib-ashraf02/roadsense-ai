"use client";

import React from "react";
import { motion } from "framer-motion";

export function HeroRoadIllustration({ className = "w-full h-auto" }) {
  return (
    <svg
      viewBox="0 0 540 380"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Background Soft Glow */}
      <defs>
        <radialGradient id="heroGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.12" />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="roadGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(var(--foreground))" stopOpacity="0.04" />
          <stop offset="100%" stopColor="hsl(var(--foreground))" stopOpacity="0.08" />
        </linearGradient>
      </defs>

      <circle cx="270" cy="190" r="180" fill="url(#heroGlow)" />

      {/* Isometric Grid Floor Lines */}
      <g stroke="hsl(var(--border))" strokeWidth="1" strokeDasharray="3 3">
        <line x1="60" y1="200" x2="480" y2="200" />
        <line x1="100" y1="260" x2="440" y2="260" />
        <line x1="140" y1="140" x2="400" y2="140" />
        <line x1="120" y1="120" x2="270" y2="330" />
        <line x1="420" y1="120" x2="270" y2="330" />
      </g>

      {/* Main Perspective Road Ribbon */}
      <path
        d="M170 330 L240 100 L300 100 L370 330 Z"
        fill="url(#roadGrad)"
        stroke="hsl(var(--foreground))"
        strokeWidth="2"
      />

      {/* Road Center Dashes */}
      <motion.line
        x1="270"
        y1="110"
        x2="270"
        y2="320"
        stroke="hsl(var(--primary))"
        strokeWidth="3"
        strokeDasharray="16 12"
        animate={{ strokeDashoffset: [0, -56] }}
        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
      />

      {/* AI Scanner Horizon Sweep */}
      <motion.g
        animate={{ y: [0, 80, 0] }}
        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
      >
        <line
          x1="180"
          y1="170"
          x2="360"
          y2="170"
          stroke="hsl(var(--primary))"
          strokeWidth="2"
          strokeOpacity="0.8"
        />
        <polygon
          points="180,170 360,170 330,195 210,195"
          fill="hsl(var(--primary))"
          fillOpacity="0.12"
        />
      </motion.g>

      {/* Detected Pothole Bounding Box & Target */}
      <g transform="translate(230, 220)">
        {/* Pothole Crater */}
        <ellipse
          cx="40"
          cy="25"
          rx="32"
          ry="15"
          fill="hsl(var(--foreground))"
          fillOpacity="0.1"
          stroke="hsl(var(--primary))"
          strokeWidth="2"
        />
        <ellipse
          cx="40"
          cy="26"
          rx="22"
          ry="9"
          fill="hsl(var(--primary))"
          fillOpacity="0.25"
        />

        {/* Bounding Box Corners */}
        <path
          d="M0 5 L0 0 L15 0"
          stroke="hsl(var(--primary))"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M65 0 L80 0 L80 5"
          stroke="hsl(var(--primary))"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M0 45 L0 50 L15 50"
          stroke="hsl(var(--primary))"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M65 50 L80 50 L80 45"
          stroke="hsl(var(--primary))"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Floating Confidence Badge */}
        <g transform="translate(85, -5)">
          <rect
            width="68"
            height="22"
            rx="11"
            fill="hsl(var(--card))"
            stroke="hsl(var(--border))"
            strokeWidth="1.5"
          />
          <circle cx="10" cy="11" r="3.5" fill="hsl(var(--primary))" />
          <text
            x="20"
            y="14"
            fill="hsl(var(--foreground))"
            fontSize="9"
            fontWeight="700"
            fontFamily="sans-serif"
          >
            96.4% CONF
          </text>
        </g>
      </g>

      {/* Municipal Telemetry Tower / Sat Link */}
      <g transform="translate(70, 70)">
        <circle
          cx="30"
          cy="30"
          r="26"
          fill="hsl(var(--card))"
          stroke="hsl(var(--border))"
          strokeWidth="1.5"
        />
        <path
          d="M30 18 L30 42 M20 25 L40 25 M24 35 L36 35"
          stroke="hsl(var(--primary))"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <motion.circle
          cx="30"
          cy="18"
          r="4"
          fill="hsl(var(--primary))"
          animate={{ scale: [1, 1.4, 1], opacity: [0.8, 1, 0.8] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        />
      </g>

      {/* GPS Coordinate Floating Pill */}
      <g transform="translate(360, 80)">
        <rect
          width="120"
          height="32"
          rx="16"
          fill="hsl(var(--card))"
          stroke="hsl(var(--border))"
          strokeWidth="1.5"
        />
        <circle cx="18" cy="16" r="5" fill="#10B981" />
        <text
          x="32"
          y="16"
          fill="hsl(var(--foreground))"
          fontSize="9"
          fontWeight="700"
          fontFamily="sans-serif"
          dominantBaseline="middle"
        >
          GPS RTK LOCKED
        </text>
      </g>
    </svg>
  );
}
