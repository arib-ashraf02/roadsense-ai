"use client";

import React, { useEffect, useRef, useState } from "react";
import { useTheme } from "@/components/providers/ThemeProvider";

// ─── Helper: parse hex to [r,g,b] ────────────────────────────────────────────
function hexToRgb(hex) {
  const clean = hex.replace("#", "");
  const bigint = parseInt(clean, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
}

// ─── Particle system (floating upward dots) ───────────────────────────────────
function createParticle(width, height, primaryHex, accentHex) {
  return {
    x: Math.random() * width,
    y: height + Math.random() * 100,
    vx: (Math.random() - 0.5) * 0.3,
    vy: -(Math.random() * 0.4 + 0.15),
    radius: Math.random() * 1.2 + 0.4,
    color: Math.random() > 0.5 ? primaryHex : accentHex,
    alpha: Math.random() * 0.5 + 0.2,
    life: 0,
    maxLife: Math.random() * 500 + 300,
  };
}

// ─── Draw futuristic city skyline ─────────────────────────────────────────────
function drawCitySkyline(ctx, width, height, primaryHex, accentHex, t) {
  const { r: pr, g: pg, b: pb } = hexToRgb(primaryHex);
  const { r: ar, g: ag, b: ab } = hexToRgb(accentHex);

  const groundY = height * 0.72 + Math.sin(t * 0.0003) * 3;

  // Building definitions: [x%, width%, baseH%, windowRows, windowCols]
  const buildings = [
    // Far background (darkest, blurred feel)
    { x: 0.0,  w: 0.07, h: 0.38, layer: 0, antenna: false },
    { x: 0.05, w: 0.06, h: 0.44, layer: 0, antenna: true  },
    { x: 0.10, w: 0.09, h: 0.32, layer: 0, antenna: false },
    { x: 0.15, w: 0.07, h: 0.52, layer: 0, antenna: true  },
    { x: 0.20, w: 0.08, h: 0.40, layer: 0, antenna: false },
    { x: 0.26, w: 0.06, h: 0.35, layer: 0, antenna: false },
    { x: 0.30, w: 0.09, h: 0.55, layer: 0, antenna: true  },
    { x: 0.37, w: 0.07, h: 0.42, layer: 0, antenna: false },
    { x: 0.42, w: 0.06, h: 0.30, layer: 0, antenna: false },
    { x: 0.46, w: 0.08, h: 0.60, layer: 0, antenna: true  },
    { x: 0.52, w: 0.07, h: 0.38, layer: 0, antenna: false },
    { x: 0.57, w: 0.09, h: 0.46, layer: 0, antenna: false },
    { x: 0.64, w: 0.07, h: 0.52, layer: 0, antenna: true  },
    { x: 0.69, w: 0.08, h: 0.35, layer: 0, antenna: false },
    { x: 0.75, w: 0.09, h: 0.48, layer: 0, antenna: false },
    { x: 0.82, w: 0.07, h: 0.56, layer: 0, antenna: true  },
    { x: 0.87, w: 0.06, h: 0.40, layer: 0, antenna: false },
    { x: 0.91, w: 0.09, h: 0.33, layer: 0, antenna: false },
    { x: 0.95, w: 0.07, h: 0.44, layer: 0, antenna: true  },
    // Mid layer
    { x: 0.02, w: 0.08, h: 0.28, layer: 1, antenna: false },
    { x: 0.08, w: 0.07, h: 0.36, layer: 1, antenna: false },
    { x: 0.14, w: 0.09, h: 0.22, layer: 1, antenna: false },
    { x: 0.21, w: 0.10, h: 0.42, layer: 1, antenna: true  },
    { x: 0.30, w: 0.08, h: 0.30, layer: 1, antenna: false },
    { x: 0.37, w: 0.11, h: 0.46, layer: 1, antenna: true  },
    { x: 0.47, w: 0.09, h: 0.26, layer: 1, antenna: false },
    { x: 0.55, w: 0.08, h: 0.38, layer: 1, antenna: false },
    { x: 0.62, w: 0.10, h: 0.44, layer: 1, antenna: true  },
    { x: 0.71, w: 0.09, h: 0.28, layer: 1, antenna: false },
    { x: 0.79, w: 0.08, h: 0.36, layer: 1, antenna: false },
    { x: 0.87, w: 0.10, h: 0.42, layer: 1, antenna: true  },
    { x: 0.94, w: 0.08, h: 0.24, layer: 1, antenna: false },
    // Foreground (closest, most opaque)
    { x: 0.0,  w: 0.10, h: 0.20, layer: 2, antenna: false },
    { x: 0.08, w: 0.08, h: 0.26, layer: 2, antenna: false },
    { x: 0.14, w: 0.12, h: 0.32, layer: 2, antenna: true  },
    { x: 0.24, w: 0.09, h: 0.18, layer: 2, antenna: false },
    { x: 0.31, w: 0.11, h: 0.28, layer: 2, antenna: false },
    { x: 0.40, w: 0.10, h: 0.22, layer: 2, antenna: false },
    { x: 0.48, w: 0.12, h: 0.35, layer: 2, antenna: true  },
    { x: 0.58, w: 0.09, h: 0.20, layer: 2, antenna: false },
    { x: 0.66, w: 0.11, h: 0.30, layer: 2, antenna: false },
    { x: 0.75, w: 0.10, h: 0.24, layer: 2, antenna: false },
    { x: 0.83, w: 0.09, h: 0.28, layer: 2, antenna: true  },
    { x: 0.90, w: 0.12, h: 0.20, layer: 2, antenna: false },
  ];

  // Layer visual config
  const layerConfig = [
    { alphaBase: 0.045, alphaStroke: 0.09, windowAlpha: 0.25, blur: 0 },
    { alphaBase: 0.07,  alphaStroke: 0.14, windowAlpha: 0.40, blur: 0 },
    { alphaBase: 0.11,  alphaStroke: 0.20, windowAlpha: 0.55, blur: 0 },
  ];

  for (const b of buildings) {
    const cfg = layerConfig[b.layer];
    const bx = b.x * width;
    const bw = b.w * width;
    const bh = b.h * groundY;
    const by = groundY - bh;

    // Building fill
    ctx.fillStyle = `rgba(${pr}, ${pg}, ${pb}, ${cfg.alphaBase})`;
    ctx.strokeStyle = `rgba(${pr}, ${pg}, ${pb}, ${cfg.alphaStroke})`;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.rect(bx, by, bw, bh);
    ctx.fill();
    ctx.stroke();

    // Windows grid
    const cols = Math.max(1, Math.floor(bw / 8));
    const rows = Math.max(1, Math.floor(bh / 10));
    const wx = bw / (cols + 1);
    const wy = bh / (rows + 1);

    for (let r = 1; r <= rows; r++) {
      for (let c = 1; c <= cols; c++) {
        // Some windows flicker on/off slowly
        const flickerSeed = (b.x * 1000 + r * 17 + c * 31) % 1;
        const flickerPhase = (b.x * 500 + r * 11 + c * 23) * 0.001;
        const flickerAlpha =
          (Math.sin(t * 0.0004 + flickerPhase) * 0.3 + 0.7) * cfg.windowAlpha;
        // Randomly lit (70% chance)
        const lit = ((b.x * 999 + r * 7 + c * 13) % 10) > 2;
        if (!lit) continue;

        const useAccent = ((b.x * 500 + r * 5 + c * 9) % 10) < 2;
        const wr = useAccent
          ? { r: ar, g: ag, b: ab }
          : { r: pr, g: pg, b: pb };

        ctx.fillStyle = `rgba(${wr.r}, ${wr.g}, ${wr.b}, ${flickerAlpha})`;
        ctx.fillRect(bx + c * wx - 1.5, by + r * wy - 1.5, 3, 2.5);
      }
    }

    // Antenna / rooftop spire
    if (b.antenna) {
      const antennaH = bh * 0.12 + 6;
      const midX = bx + bw / 2;
      ctx.strokeStyle = `rgba(${ar}, ${ag}, ${ab}, ${cfg.alphaStroke * 1.5})`;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(midX, by);
      ctx.lineTo(midX, by - antennaH);
      ctx.stroke();

      // Blinking antenna light
      const blinkPhase = t * 0.002 + b.x * 10;
      const blinkAlpha = Math.max(0, Math.sin(blinkPhase)) * 0.8;
      ctx.fillStyle = `rgba(${ar}, ${ag}, ${ab}, ${blinkAlpha})`;
      ctx.beginPath();
      ctx.arc(midX, by - antennaH, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Ground horizon line
  const grad = ctx.createLinearGradient(0, groundY - 2, 0, groundY + 20);
  grad.addColorStop(0, `rgba(${pr}, ${pg}, ${pb}, 0.18)`);
  grad.addColorStop(1, "transparent");
  ctx.fillStyle = grad;
  ctx.fillRect(0, groundY - 2, width, 22);
}

// ─── Main Component ──────────────────────────────────────────────────────────
export function FuturisticBackground() {
  const canvasRef = useRef(null);
  const { currentThemeConfig } = useTheme();
  const rafRef = useRef(null);
  const particlesRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Respect prefers-reduced-motion
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const primaryHex = currentThemeConfig?.colors?.primary || "#3B82F6";
    const accentHex = currentThemeConfig?.colors?.accent || "#00F2FE";

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      particlesRef.current = [];
    };
    window.addEventListener("resize", handleResize);

    // Init particles
    const maxParticles = Math.min(Math.floor(width / 25), 60);
    particlesRef.current = Array.from({ length: maxParticles }, () =>
      createParticle(width, height, primaryHex, accentHex)
    );

    let t = 0;

    const draw = () => {
      t++;
      ctx.clearRect(0, 0, width, height);

      // ── 1. City skyline silhouette ──────────────────────────────────────
      drawCitySkyline(ctx, width, height, primaryHex, accentHex, t);

      // ── 2. Particle network ─────────────────────────────────────────────
      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life++;

        const lifeRatio = p.life / p.maxLife;
        const alpha = p.alpha * Math.sin(lifeRatio * Math.PI);

        if (p.life >= p.maxLife || p.y < -10) {
          particles[i] = createParticle(width, height, primaryHex, accentHex);
          continue;
        }

        const { r, g, b } = hexToRgb(p.color);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        ctx.fill();

        // Connect nearby particles with thin lines
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 90) {
            const lineAlpha = (1 - dist / 90) * alpha * 0.25;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${lineAlpha})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", handleResize);
    };
  }, [currentThemeConfig]);

  const primary = currentThemeConfig?.colors?.primary || "#3B82F6";
  const accent  = currentThemeConfig?.colors?.accent  || "#00F2FE";
  const auroraA = currentThemeConfig?.colors?.auroraA || "rgba(59,130,246,0.18)";
  const auroraB = currentThemeConfig?.colors?.auroraB || "rgba(0,242,254,0.12)";
  const glow    = currentThemeConfig?.colors?.glow    || "rgba(59,130,246,0.3)";
  const grid    = currentThemeConfig?.colors?.gridColor || "rgba(59,130,246,0.05)";

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[-1] overflow-hidden"
    >
      {/* ── Layer 0: deep background gradient ── */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 80% 60% at 50% 0%, ${auroraA} 0%, transparent 60%),
                       radial-gradient(ellipse 60% 40% at 90% 80%, ${auroraB} 0%, transparent 60%)`,
          transition: "background 0.6s ease",
        }}
      />

      {/* ── Layer 1: Aurora blob A — top-left ── */}
      <div
        className="absolute rounded-full blur-[160px]"
        style={{
          width: 700,
          height: 700,
          top: "-20%",
          left: "-10%",
          background: `radial-gradient(circle, ${auroraA} 0%, transparent 70%)`,
          animation: "aurora-drift 22s ease-in-out infinite",
          opacity: 0.9,
          transition: "background 0.6s ease",
        }}
      />

      {/* ── Layer 2: Aurora blob B — right ── */}
      <div
        className="absolute rounded-full blur-[150px]"
        style={{
          width: 600,
          height: 600,
          top: "30%",
          right: "-12%",
          background: `radial-gradient(circle, ${auroraB} 0%, transparent 70%)`,
          animation: "aurora-drift-alt 28s ease-in-out infinite",
          opacity: 0.8,
          transition: "background 0.6s ease",
        }}
      />

      {/* ── Layer 3: Aurora blob C — bottom center ── */}
      <div
        className="absolute rounded-full blur-[130px]"
        style={{
          width: 500,
          height: 500,
          bottom: "-15%",
          left: "30%",
          background: `radial-gradient(circle, ${glow} 0%, transparent 70%)`,
          animation: "aurora-drift 18s ease-in-out infinite reverse",
          opacity: 0.6,
          transition: "background 0.6s ease",
        }}
      />

      {/* ── Layer 4: Perspective grid ── */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(to right, ${grid} 1px, transparent 1px),
                            linear-gradient(to bottom, ${grid} 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
          animation: "grid-pulse 8s ease-in-out infinite",
          transition: "background-image 0.6s ease",
        }}
      />

      {/* ── Layer 5: Canvas (city silhouette + particles) ── */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
        style={{ opacity: 1 }}
      />

      {/* ── Layer 6: Vignette overlay — frames the content ── */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 100% 100% at 50% 50%, transparent 40%, hsl(var(--background) / 0.5) 100%)`,
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
