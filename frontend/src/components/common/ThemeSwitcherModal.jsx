"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Palette, Check, Sparkles, X, CheckCircle2 } from "lucide-react";
import { useTheme } from "@/components/providers/ThemeProvider";

export function ThemeSwitcherModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const { theme, setTheme, themes, currentThemeConfig } = useTheme();

  // Track client mount to avoid hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Scroll-lock when modal open
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  // Escape key close
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && isOpen) setIsOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen]);

  const handleApply = (themeId) => {
    setTheme(themeId);
  };

  // ── SSR placeholder — avoids browser extension hydration mismatch ──────────
  if (!isMounted) {
    return (
      <div
        suppressHydrationWarning
        aria-hidden="true"
        className="flex items-center gap-2 rounded-full border border-border bg-card/80 px-3.5 py-1.5 text-xs font-semibold text-foreground shadow-xs backdrop-blur-md"
      >
        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: "#3B82F6", boxShadow: "0 0 10px #3B82F6" }}
        />
        <span className="hidden sm:inline-block">Midnight Blue</span>
        <Palette className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
    );
  }

  const activeColor = currentThemeConfig?.colors?.primary || "#3B82F6";
  const activeName  = currentThemeConfig?.name || "Midnight Blue";
  const activeGlow  = currentThemeConfig?.colors?.glow || "rgba(59,130,246,0.35)";

  return (
    <>
      {/* ── Trigger button ─────────────────────────────────────────────── */}
      <button
        type="button"
        suppressHydrationWarning
        onClick={() => setIsOpen(true)}
        className="group relative flex items-center gap-2 rounded-full border border-border bg-card/80 px-3.5 py-1.5 text-xs font-semibold text-foreground shadow-xs backdrop-blur-md transition-all duration-200 hover:border-primary/60 hover:bg-accent/40"
        title="Customize Visual Theme"
      >
        <span
          className="h-2.5 w-2.5 rounded-full transition-transform duration-200 group-hover:scale-125"
          style={{
            backgroundColor: activeColor,
            boxShadow: `0 0 10px ${activeColor}`,
          }}
        />
        <span className="hidden sm:inline-block">{activeName}</span>
        <Palette className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
      </button>

      {/* ── Modal (Portaled to body to escape parent stacking contexts) ── */}
      {isMounted &&
        createPortal(
          <AnimatePresence>
            {isOpen && (
              <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 overflow-hidden">
                {/* Backdrop */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  onClick={() => setIsOpen(false)}
                  className="absolute inset-0 bg-black/75 backdrop-blur-sm"
                />

                {/* Panel */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 16 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 16 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="relative z-10 flex flex-col w-full max-w-2xl rounded-3xl border border-border bg-card shadow-2xl overflow-hidden"
                  style={{
                    maxHeight: "calc(100dvh - 2rem)",
                    boxShadow: `0 0 60px -12px ${activeGlow}, 0 24px 48px -12px rgba(0,0,0,0.6)`,
                  }}
                >
              {/* Header */}
              <div className="shrink-0 flex items-center justify-between border-b border-border px-5 py-4 sm:px-6">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border"
                    style={{
                      backgroundColor: `${activeColor}18`,
                      borderColor: `${activeColor}40`,
                      color: activeColor,
                    }}
                  >
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-extrabold text-foreground">
                      Platform Visual Theme
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Choose a theme — applies instantly &amp; persists.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="ml-4 shrink-0 rounded-full p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                  title="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Scrollable grid */}
              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {themes.map((t) => {
                    const isSelected = theme === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => handleApply(t.id)}
                        className="relative flex flex-col text-left rounded-2xl border-2 overflow-hidden transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        style={{
                          borderColor: isSelected ? t.colors.primary : t.colors.border,
                          backgroundColor: isSelected
                            ? `${t.colors.primary}14`
                            : t.preview.cardPreview,
                          boxShadow: isSelected
                            ? `0 0 24px -4px ${t.colors.glow}, inset 0 1px 0 ${t.colors.primary}20`
                            : "none",
                        }}
                      >
                        {/* Mini UI preview */}
                        <div
                          className="relative p-3 pb-2"
                          style={{ backgroundColor: t.preview.bgPreview }}
                        >
                          {/* Mock navbar */}
                          <div
                            className="flex items-center gap-1.5 mb-2 px-2 py-1 rounded-lg"
                            style={{ backgroundColor: t.preview.cardPreview }}
                          >
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: t.colors.primary }}
                            />
                            <span
                              className="h-1.5 w-12 rounded-full opacity-70"
                              style={{ backgroundColor: t.preview.textPreview }}
                            />
                            <div className="ml-auto flex gap-1">
                              <span className="h-1.5 w-5 rounded-full opacity-40" style={{ backgroundColor: t.preview.textPreview }} />
                              <span
                                className="h-1.5 w-6 rounded-full"
                                style={{ backgroundColor: t.colors.primary }}
                              />
                            </div>
                          </div>

                          {/* Mock content cards */}
                          <div className="grid grid-cols-2 gap-1.5">
                            {[0, 1].map((idx) => (
                              <div
                                key={idx}
                                className="rounded-lg p-2"
                                style={{
                                  backgroundColor: t.preview.cardPreview,
                                  border: `1px solid ${t.colors.border}`,
                                }}
                              >
                                <div
                                  className="h-1.5 w-8 rounded-full mb-1"
                                  style={{ backgroundColor: idx === 0 ? t.colors.primary : t.colors.accent, opacity: 0.9 }}
                                />
                                <div
                                  className="h-1 w-full rounded-full opacity-40"
                                  style={{ backgroundColor: t.preview.textPreview }}
                                />
                                <div
                                  className="h-1 w-3/4 rounded-full opacity-25 mt-0.5"
                                  style={{ backgroundColor: t.preview.textPreview }}
                                />
                              </div>
                            ))}
                          </div>

                          {/* Active checkmark */}
                          {isSelected && (
                            <div
                              className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full text-white shadow"
                              style={{ backgroundColor: t.colors.primary }}
                            >
                              <Check className="h-3 w-3" />
                            </div>
                          )}
                        </div>

                        {/* Info footer */}
                        <div className="flex items-center justify-between gap-2 px-3 py-2.5">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span
                                className="text-xs font-extrabold"
                                style={{ color: t.preview.textPreview }}
                              >
                                {t.name}
                              </span>
                              {t.isDefault && (
                                <span
                                  className="rounded-full px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide"
                                  style={{
                                    backgroundColor: `${t.colors.primary}25`,
                                    color: t.colors.primary,
                                  }}
                                >
                                  Default
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] opacity-60" style={{ color: t.preview.textPreview }}>
                              {t.subtitle}
                            </p>
                          </div>

                          {/* Swatches */}
                          <div className="flex items-center gap-1 shrink-0">
                            {t.preview.swatches.slice(0, 3).map((color, idx) => (
                              <span
                                key={idx}
                                className="h-3 w-3 rounded-full border border-white/10"
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Active bar */}
                        {isSelected && (
                          <div
                            className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-2xl"
                            style={{ backgroundColor: t.colors.primary }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Footer */}
              <div className="shrink-0 flex items-center justify-between gap-3 border-t border-border px-5 py-3.5 sm:px-6">
                <p className="text-[11px] text-muted-foreground hidden sm:block">
                  Saved to localStorage — restored automatically on reload.
                </p>
                <div className="flex items-center gap-2 ml-auto">
                  {isOpen && (
                    <span className="text-[11px] text-muted-foreground sm:hidden">
                      Active:{" "}
                      <strong className="text-foreground">{activeName}</strong>
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="inline-flex items-center gap-1.5 rounded-full px-5 py-1.5 text-xs font-bold text-primary-foreground shadow-sm transition hover:opacity-90 active:scale-95"
                    style={{ backgroundColor: activeColor }}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Done
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>,
      document.body
    )}
    </>
  );
}
