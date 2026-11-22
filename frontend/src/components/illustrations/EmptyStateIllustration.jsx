"use client";

import React from "react";

export function EmptyStateIllustration({
  className = "w-36 h-36 mx-auto",
  title = "No Records Found",
  subtitle = "Everything looks clean and resolved in this section.",
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8">
      <svg
        viewBox="0 0 160 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        <circle cx="80" cy="80" r="70" fill="hsl(var(--muted) / 0.5)" />
        <circle cx="80" cy="80" r="50" fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="2" />

        {/* Minimalist Clipboard / Road Pin */}
        <path
          d="M65 55 C65 50, 95 50, 95 55 L95 65 L65 65 Z"
          fill="hsl(var(--primary) / 0.15)"
          stroke="hsl(var(--primary))"
          strokeWidth="2"
        />
        <rect
          x="55"
          y="65"
          width="50"
          height="55"
          rx="6"
          fill="hsl(var(--card))"
          stroke="hsl(var(--border))"
          strokeWidth="2"
        />

        {/* Lines */}
        <line x1="68" y1="78" x2="92" y2="78" stroke="hsl(var(--muted-foreground))" strokeWidth="2" strokeLinecap="round" />
        <line x1="68" y1="88" x2="88" y2="88" stroke="hsl(var(--muted-foreground))" strokeWidth="2" strokeLinecap="round" />
        <line x1="68" y1="98" x2="80" y2="98" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" />

        {/* Sparkle */}
        <path
          d="M115 50 L118 42 L121 50 L129 53 L121 56 L118 64 L115 56 L107 53 Z"
          fill="hsl(var(--primary))"
        />
      </svg>
      {title && <h4 className="mt-4 text-base font-bold text-foreground">{title}</h4>}
      {subtitle && <p className="mt-1 text-xs text-muted-foreground max-w-sm">{subtitle}</p>}
    </div>
  );
}
