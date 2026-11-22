"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  MapPin,
  Filter,
  Layers,
  AlertTriangle,
  RefreshCw,
  Search,
} from "lucide-react";
import { useTheme } from "@/components/providers/ThemeProvider";
import { motion } from "framer-motion";
import { FadeInView } from "@/components/common/AnimationWrappers";

const PotholeMap = dynamic(() => import("@/components/maps/PotholeMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[620px] w-full items-center justify-center rounded-2xl border border-border bg-card text-xs font-semibold text-muted-foreground shadow-xs">
      Initializing OpenStreetMap GIS canvas...
    </div>
  ),
});

export default function GISMapPage() {
  const [points, setPoints] = useState([]);
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const { currentThemeConfig } = useTheme();

  const fetchPoints = async () => {
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";
      const q = severityFilter !== "ALL" ? `?severity=${severityFilter}` : "";
      const res = await fetch(`${apiUrl}/spatial/potholes${q}`);
      if (res.ok) {
        setPoints(await res.json());
      }
    } catch (e) {
      console.error("Failed to load map points:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPoints();
  }, [severityFilter]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-bold text-foreground mb-2">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span>GIS Geospatial Grid</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">
            Interactive Defect Heatmap
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Real-time geospatial visualization of detected potholes, severity classification, and spatial clusters.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.95 }}
            onClick={fetchPoints}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-xs font-bold text-foreground shadow-xs hover:bg-accent transition"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-primary" : ""}`} />
            <span>Refresh Heatmap</span>
          </motion.button>
        </div>
      </motion.div>

      {/* Filter and Legend Bar */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4 shadow-xs"
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-foreground mr-1">Severity Filter:</span>
          {["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"].map((s) => (
            <motion.button
              key={s}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setSeverityFilter(s)}
              className={`rounded-full px-3.5 py-1 text-xs font-bold transition-all ${
                severityFilter === s
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              {s}
            </motion.button>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-semibold text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: currentThemeConfig?.chart?.critical || "#EF4444" }}
            />
            <span>Critical</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: currentThemeConfig?.chart?.high || "#F36B21" }}
            />
            <span>High</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: currentThemeConfig?.chart?.medium || "#F59E0B" }}
            />
            <span>Medium</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: currentThemeConfig?.chart?.low || "#10B981" }}
            />
            <span>Low</span>
          </div>
        </div>
      </motion.div>

      {/* Map Container */}
      <FadeInView delay={0.2} className="glass-panel rounded-3xl border border-border p-2.5 shadow-2xl overflow-hidden">
        <div className="h-[640px] w-full">
          <PotholeMap points={points} />
        </div>
      </FadeInView>
    </div>
  );
}
