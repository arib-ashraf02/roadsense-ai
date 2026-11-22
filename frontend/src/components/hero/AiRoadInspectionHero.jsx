"use client";

import React, { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Crosshair,
  Layers,
  Activity,
  AlertTriangle,
  Eye,
  Camera,
  Maximize2,
  CheckCircle,
} from "lucide-react";
import { useTheme } from "@/components/providers/ThemeProvider";

const ROAD_SCENES = [
  {
    id: "delhi-pothole",
    name: "New Delhi Urban Corridor",
    subtitle: "Dwarka Sector 14 Roadway · Ward 14-B",
    image: "/images/indian_road_delhi_pothole.jpg",
    gps: { lat: "28.5921° N", lng: "77.0460° E", locationName: "New Delhi Sector 14" },
    defects: [
      {
        id: "d1",
        code: "D40",
        type: "Severe Pothole",
        confidence: 96.4,
        severity: "CRITICAL",
        severityColor: "#EF4444",
        coords: { top: "42%", left: "28%", width: "42%", height: "34%" },
        metrics: "Area: 0.94 m² · Depth: ~11.2 cm",
        clusterId: "Cluster #42 (15m radius)",
      },
      {
        id: "d2",
        code: "D00",
        type: "Longitudinal Crack",
        confidence: 89.2,
        severity: "HIGH",
        severityColor: "#F59E0B",
        coords: { top: "22%", left: "12%", width: "26%", height: "22%" },
        metrics: "Length: 2.1 m · Surface Fracture",
        clusterId: "Cluster #42 (15m radius)",
      },
      {
        id: "d3",
        code: "D20",
        type: "Alligator Cracking",
        confidence: 84.7,
        severity: "MEDIUM",
        severityColor: "#3B82F6",
        coords: { top: "68%", left: "62%", width: "30%", height: "24%" },
        metrics: "Area: 0.52 m² · Base Fatigue",
        clusterId: "Cluster #42 (15m radius)",
      },
    ],
  },
  {
    id: "mumbai-urban",
    name: "Mumbai Municipal Arterial",
    subtitle: "Andheri-Kurla Link Road · K-West Ward",
    image: "/images/mumbai_urban_road.jpg",
    gps: { lat: "19.0760° N", lng: "72.8777° E", locationName: "Mumbai K-West" },
    defects: [
      {
        id: "m1",
        code: "D40",
        type: "Asphalt Cavity",
        confidence: 94.1,
        severity: "CRITICAL",
        severityColor: "#EF4444",
        coords: { top: "54%", left: "34%", width: "36%", height: "28%" },
        metrics: "Traffic Hazard · High Impact",
        clusterId: "Cluster #19 (15m radius)",
      },
      {
        id: "m2",
        code: "D10",
        type: "Transverse Crack",
        confidence: 87.5,
        severity: "HIGH",
        severityColor: "#F59E0B",
        coords: { top: "36%", left: "18%", width: "28%", height: "20%" },
        metrics: "Width: 3.2 cm · Seal Required",
        clusterId: "Cluster #19 (15m radius)",
      },
    ],
  },
  {
    id: "damaged-asphalt",
    name: "Asphalt Surface Inspection",
    subtitle: "Transit Sector 8 · Heavy Vehicle Lane",
    image: "/images/damaged_asphalt_road.jpg",
    gps: { lat: "28.6139° N", lng: "77.2090° E", locationName: "Transit Corridor" },
    defects: [
      {
        id: "a1",
        code: "D40",
        type: "Pothole Formation",
        confidence: 95.8,
        severity: "CRITICAL",
        severityColor: "#EF4444",
        coords: { top: "38%", left: "26%", width: "44%", height: "36%" },
        metrics: "Area: 1.15 m² · Severe Cavitation",
        clusterId: "Cluster #08 (15m radius)",
      },
    ],
  },
];

export function AiRoadInspectionHero({ className = "" }) {
  const { currentThemeConfig } = useTheme();
  const [selectedSceneIndex, setSelectedSceneIndex] = useState(0);
  const [showBoxes, setShowBoxes] = useState(true);
  const [showGpsPins, setShowGpsPins] = useState(true);
  const [activeDefectId, setActiveDefectId] = useState(null);

  const scene = ROAD_SCENES[selectedSceneIndex];
  const primaryColor = currentThemeConfig?.colors?.primary || "#38BDF8";
  const accentColor = currentThemeConfig?.colors?.accent || "#00F2FE";
  const glowColor = currentThemeConfig?.colors?.glow || "rgba(56, 189, 248, 0.35)";

  return (
    <div
      className={`relative rounded-3xl border border-border bg-card/90 shadow-2xl backdrop-blur-xl overflow-hidden transition-all duration-300 ${className}`}
      style={{
        boxShadow: `0 0 45px -10px ${glowColor}`,
      }}
    >
      {/* Top HUD Telemetry Bar */}
      <div className="flex items-center justify-between border-b border-border/80 bg-background/80 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span
              className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
              style={{ backgroundColor: accentColor }}
            />
            <span
              className="relative inline-flex rounded-full h-2.5 w-2.5"
              style={{ backgroundColor: accentColor }}
            />
          </span>
          <div className="flex flex-col">
            <span className="text-[11px] font-black tracking-wider uppercase text-foreground flex items-center gap-1.5">
              <span>LIVE AI DETECTION</span>
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-muted text-muted-foreground">
                YOLOv8-RDD
              </span>
            </span>
            <span className="text-[10px] text-muted-foreground font-medium truncate max-w-[190px] sm:max-w-none">
              {scene.subtitle}
            </span>
          </div>
        </div>

        {/* View Controls */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowBoxes((v) => !v)}
            title={showBoxes ? "Hide Detection Boxes" : "Show Detection Boxes"}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
              showBoxes
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            <Crosshair className="h-3 w-3" />
            <span className="hidden sm:inline">Boxes</span>
          </button>

          <button
            type="button"
            onClick={() => setShowGpsPins((v) => !v)}
            title={showGpsPins ? "Hide GPS Pins" : "Show GPS Pins"}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
              showGpsPins
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            <MapPin className="h-3 w-3" />
            <span className="hidden sm:inline">GPS</span>
          </button>
        </div>
      </div>

      {/* Main Viewport with Authentic Road Photo */}
      <div className="relative aspect-[4/3] sm:aspect-[16/11] w-full overflow-hidden bg-black/80 select-none">
        {/* Road Photograph */}
        <AnimatePresence mode="wait">
          <motion.div
            key={scene.id}
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0"
          >
            <Image
              src={scene.image}
              alt={scene.name}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover object-center"
            />
          </motion.div>
        </AnimatePresence>

        {/* Cinematic Vignette Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30 pointer-events-none" />

        {/* Laser Scanning Line Animation */}
        <motion.div
          animate={{ y: ["0%", "100%", "0%"] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: "linear" }}
          className="absolute left-0 right-0 h-[2px] pointer-events-none z-20"
          style={{
            background: `linear-gradient(90deg, transparent 0%, ${accentColor} 50%, transparent 100%)`,
            boxShadow: `0 0 12px 2px ${accentColor}`,
          }}
        />

        {/* Subtle AI Pothole Detection Bounding Boxes */}
        {showBoxes && (
          <div className="absolute inset-0 pointer-events-auto">
            {scene.defects.map((defect) => {
              const isHovered = activeDefectId === defect.id;
              return (
                <div
                  key={defect.id}
                  onMouseEnter={() => setActiveDefectId(defect.id)}
                  onMouseLeave={() => setActiveDefectId(null)}
                  className="absolute cursor-pointer transition-all duration-200 group"
                  style={{
                    top: defect.coords.top,
                    left: defect.coords.left,
                    width: defect.coords.width,
                    height: defect.coords.height,
                  }}
                >
                  {/* Bounding Box Border with Corner Brackets */}
                  <div
                    className={`absolute inset-0 rounded-sm border-2 transition-all duration-200 ${
                      isHovered ? "border-solid shadow-lg" : "border-dashed opacity-85"
                    }`}
                    style={{
                      borderColor: defect.severityColor,
                      backgroundColor: isHovered
                        ? `${defect.severityColor}22`
                        : `${defect.severityColor}0D`,
                      boxShadow: isHovered
                        ? `0 0 18px 2px ${defect.severityColor}88`
                        : `0 0 8px 1px ${defect.severityColor}44`,
                    }}
                  >
                    {/* High-tech Corner Brackets */}
                    <span
                      className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-l-2"
                      style={{ borderColor: defect.severityColor }}
                    />
                    <span
                      className="absolute -top-1 -right-1 w-2.5 h-2.5 border-t-2 border-r-2"
                      style={{ borderColor: defect.severityColor }}
                    />
                    <span
                      className="absolute -bottom-1 -left-1 w-2.5 h-2.5 border-b-2 border-l-2"
                      style={{ borderColor: defect.severityColor }}
                    />
                    <span
                      className="absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b-2 border-r-2"
                      style={{ borderColor: defect.severityColor }}
                    />
                  </div>

                  {/* Top Detection Tag Pill */}
                  <div
                    className="absolute -top-6 left-0 inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-black text-white shadow-md z-30 tracking-wide backdrop-blur-sm"
                    style={{ backgroundColor: defect.severityColor }}
                  >
                    <AlertTriangle className="h-2.5 w-2.5" />
                    <span>{defect.code}: {defect.type}</span>
                    <span className="bg-black/40 px-1 rounded text-[9px] font-bold">
                      {defect.confidence}%
                    </span>
                  </div>

                  {/* Extended Metrics Card on Hover */}
                  <AnimatePresence>
                    {isHovered && (
                      <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        className="absolute -bottom-14 left-0 z-40 rounded-lg border border-border/80 bg-background/95 p-2 shadow-xl backdrop-blur-md text-[10px] space-y-0.5 whitespace-nowrap"
                      >
                        <div className="font-extrabold text-foreground flex items-center justify-between gap-3">
                          <span>{defect.metrics}</span>
                          <span
                            className="font-black px-1.5 py-0.5 rounded text-[9px] text-white"
                            style={{ backgroundColor: defect.severityColor }}
                          >
                            {defect.severity}
                          </span>
                        </div>
                        <div className="text-muted-foreground flex items-center gap-1 text-[9px]">
                          <Layers className="h-2.5 w-2.5" />
                          <span>{defect.clusterId}</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}

        {/* Subtle GPS Location Markers on Road */}
        {showGpsPins && (
          <div className="absolute inset-0 pointer-events-none">
            {/* Primary Road Pin */}
            <div
              className="absolute pointer-events-auto cursor-pointer"
              style={{ bottom: "24%", left: "54%" }}
            >
              {/* Radar Pulse Ring */}
              <span
                className="absolute -inset-2.5 rounded-full animate-ping opacity-60"
                style={{ backgroundColor: primaryColor }}
              />
              <span
                className="absolute -inset-1 rounded-full opacity-40 animate-pulse"
                style={{ backgroundColor: primaryColor }}
              />

              {/* Pin Icon */}
              <div
                className="relative flex h-7 w-7 items-center justify-center rounded-full text-white shadow-lg"
                style={{
                  backgroundColor: primaryColor,
                  boxShadow: `0 0 15px ${glowColor}`,
                }}
              >
                <MapPin className="h-4 w-4" />
              </div>

              {/* Location Badge */}
              <div className="absolute -top-7 -left-12 rounded-full border border-border/80 bg-background/90 px-2.5 py-0.5 text-[9px] font-bold text-foreground shadow-md backdrop-blur-md whitespace-nowrap flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>{scene.gps.lat}, {scene.gps.lng}</span>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Corner HUD Telemetry Overlay */}
        <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between pointer-events-none z-20">
          <div className="rounded-lg bg-black/60 px-2.5 py-1 text-[10px] font-semibold text-white/90 backdrop-blur-md flex items-center gap-2 border border-white/10">
            <Activity className="h-3 w-3 text-emerald-400" />
            <span>Infra Camera 0{selectedSceneIndex + 1}</span>
            <span className="text-white/40">|</span>
            <span className="font-mono text-emerald-300">28.4 FPS</span>
          </div>

          <div className="rounded-lg bg-black/60 px-2.5 py-1 text-[10px] font-semibold text-white/90 backdrop-blur-md border border-white/10">
            <span className="text-white/60">DBSCAN:</span> <span className="text-amber-300 font-mono">15m Radius</span>
          </div>
        </div>
      </div>

      {/* Scene Selector Strip */}
      <div className="border-t border-border/80 bg-background/60 p-2.5 flex items-center justify-between gap-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-1 hidden sm:inline">
          Live Feeds:
        </span>
        <div className="flex items-center gap-1.5 flex-1 justify-end">
          {ROAD_SCENES.map((s, idx) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSelectedSceneIndex(idx)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                selectedSceneIndex === idx
                  ? "bg-card text-foreground border border-border shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <Camera className="h-3 w-3" />
              <span>{idx === 0 ? "Delhi Road" : idx === 1 ? "Mumbai Ward" : "Asphalt Core"}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
