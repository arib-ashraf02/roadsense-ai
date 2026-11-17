"use client";

import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Badge } from "@/components/ui/badge";

const SEVERITY_COLORS = {
  CRITICAL: "#ef4444",
  HIGH: "#f97316",
  MEDIUM: "#f59e0b",
  LOW: "#10b981",
};

export default function PotholeMap({ points = [], center = [28.6139, 77.2090], zoom = 12 }) {
  // Fix for client-only rendering
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-slate-100 text-sm text-slate-500">
        Loading interactive map canvas...
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-hidden rounded-xl border border-slate-200">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {points.map((p, idx) => {
          const color = SEVERITY_COLORS[p.severity] || "#3b82f6";
          const radius = p.severity === "CRITICAL" ? 12 : p.severity === "HIGH" ? 10 : 8;

          return (
            <CircleMarker
              key={p.id || idx}
              center={[p.latitude, p.longitude]}
              pathOptions={{
                color: color,
                fillColor: color,
                fillOpacity: 0.7,
                weight: 2,
              }}
              radius={radius}
            >
              <Popup>
                <div className="space-y-1.5 p-1 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-900">Road Defect</span>
                    <span
                      className="rounded px-1.5 py-0.5 text-[10px] font-bold text-white"
                      style={{ backgroundColor: color }}
                    >
                      {p.severity}
                    </span>
                  </div>
                  <p className="text-slate-600">
                    Confidence: {p.confidence ? `${Math.round(p.confidence * 100)}%` : "N/A"}
                  </p>
                  <p className="text-slate-500 font-mono text-[10px]">
                    {p.latitude.toFixed(5)}, {p.longitude.toFixed(5)}
                  </p>
                  {p.detected_at && (
                    <p className="text-slate-400 text-[10px]">
                      {new Date(p.detected_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
