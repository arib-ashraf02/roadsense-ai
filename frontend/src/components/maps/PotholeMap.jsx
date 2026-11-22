"use client";

import React, { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useTheme } from "@/components/providers/ThemeProvider";
import { Layers, Eye, Compass, ShieldAlert, Sparkles, Navigation } from "lucide-react";

// Component to dynamically fit map bounds to points
function AutoFitBounds({ points }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !points || points.length === 0) return;
    try {
      const validPoints = points.filter(
        (p) => p && !isNaN(Number(p.latitude)) && !isNaN(Number(p.longitude))
      );
      if (validPoints.length > 0) {
        const bounds = validPoints.map((p) => [Number(p.latitude), Number(p.longitude)]);
        if (bounds.length === 1) {
          map.setView(bounds[0], 14, { animate: true });
        } else {
          map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15, animate: true });
        }
      }
    } catch (e) {
      // Fallback silently if map is still sizing
    }
  }, [map, points]);

  return null;
}

export default function PotholeMap({
  points = [],
  center = [28.6139, 77.2090],
  zoom = 12,
  showControls = true,
}) {
  const [mounted, setMounted] = useState(false);
  const [mapStyle, setMapStyle] = useState("cyber-dark"); // 'cyber-dark' | 'standard'
  const { currentThemeConfig } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const severityColors = useMemo(
    () => ({
      CRITICAL: currentThemeConfig?.chart?.critical || "#EF4444",
      HIGH: currentThemeConfig?.chart?.high || "#F59E0B",
      MEDIUM: currentThemeConfig?.chart?.medium || "#3B82F6",
      LOW: currentThemeConfig?.chart?.low || "#10B981",
    }),
    [currentThemeConfig]
  );

  // Free, official, public OpenStreetMap tile provider (Zero API key required)
  const osmTileUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

  if (!mounted) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-card text-xs font-semibold text-muted-foreground">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 animate-spin text-primary" />
          <span>Loading OpenStreetMap GIS geospatial canvas...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl border border-border shadow-xs">
      {/* Map Style & Layer Toggle Control */}
      {showControls && (
        <div className="absolute right-3 top-3 z-[1000] flex items-center gap-1.5 rounded-full border border-border bg-card/90 p-1 shadow-md backdrop-blur-md">
          <button
            type="button"
            onClick={() => setMapStyle("cyber-dark")}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold transition-all ${
              mapStyle === "cyber-dark"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
            title="Night Matrix Theme with Theme Tinting"
          >
            <Compass className="h-3 w-3" />
            <span>Cyber Dark</span>
          </button>
          <button
            type="button"
            onClick={() => setMapStyle("standard")}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold transition-all ${
              mapStyle === "standard"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
            title="Standard OpenStreetMap Road Tiles"
          >
            <Layers className="h-3 w-3" />
            <span>Standard Streets</span>
          </button>
        </div>
      )}

      {/* Actual Map Container */}
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
        className={
          mapStyle === "cyber-dark"
            ? "osm-cyber-dark-map"
            : "osm-standard-map"
        }
      >
        <AutoFitBounds points={points} />

        {/* Free OpenStreetMap Standard Tiles — No API Key Required */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
          url={osmTileUrl}
          subdomains={["a", "b", "c"]}
          maxZoom={19}
          className={
            mapStyle === "cyber-dark"
              ? "filter brightness-[0.72] invert-[0.92] hue-rotate-[195deg] contrast-[1.8] saturate-[0.4]"
              : ""
          }
        />

        {/* Real Geotagged Pothole Detection Markers */}
        {points
          .filter((p) => p && p.latitude != null && p.longitude != null)
          .map((p, idx) => {
            const lat = Number(p.latitude);
            const lon = Number(p.longitude);
            if (isNaN(lat) || isNaN(lon)) return null;

            const sev = (p.severity || "MEDIUM").toUpperCase();
            const color = severityColors[sev] || currentThemeConfig?.colors?.primary || "#3B82F6";
            const radius = sev === "CRITICAL" ? 14 : sev === "HIGH" ? 11 : sev === "MEDIUM" ? 9 : 7;

            return (
              <CircleMarker
                key={p.id || idx}
                center={[lat, lon]}
                pathOptions={{
                  color: color,
                  fillColor: color,
                  fillOpacity: 0.8,
                  weight: 2.5,
                }}
                radius={radius}
              >
                <Popup className="roadsense-map-popup">
                  <div className="space-y-2 p-1.5 font-sans min-w-[210px] text-slate-900">
                    <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="h-2 w-2 rounded-full animate-ping"
                          style={{ backgroundColor: color }}
                        />
                        <span className="font-extrabold text-xs text-slate-900">
                          Road Defect
                        </span>
                      </div>
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-black uppercase text-white shadow-xs"
                        style={{ backgroundColor: color }}
                      >
                        {sev}
                      </span>
                    </div>

                    <div className="space-y-1 text-xs">
                      <div className="flex items-center justify-between text-slate-700">
                        <span className="font-semibold text-slate-500">AI Confidence:</span>
                        <span className="font-bold">
                          {p.confidence != null ? `${Math.round(p.confidence * 100)}%` : "N/A"}
                        </span>
                      </div>

                      {p.estimated_area_sqm != null && (
                        <div className="flex items-center justify-between text-slate-700">
                          <span className="font-semibold text-slate-500">Estimated Size:</span>
                          <span className="font-bold">
                            {Number(p.estimated_area_sqm).toFixed(2)} m²
                          </span>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-slate-700">
                        <span className="font-semibold text-slate-500">Coordinates:</span>
                        <span className="font-mono text-[10px] text-slate-600 font-bold">
                          {lat.toFixed(4)}, {lon.toFixed(4)}
                        </span>
                      </div>

                      {p.detected_at && (
                        <div className="flex items-center justify-between text-slate-500 text-[10px] pt-1 border-t border-slate-100">
                          <span>Detected:</span>
                          <span>{new Date(p.detected_at).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
      </MapContainer>

      {/* Floating Count Badge */}
      <div className="pointer-events-none absolute bottom-3 left-3 z-[1000] rounded-xl border border-border bg-card/90 px-3 py-1.5 text-[11px] font-bold text-foreground shadow-md backdrop-blur-md">
        <span>{points.length} road defects mapped</span>
      </div>
    </div>
  );
}
