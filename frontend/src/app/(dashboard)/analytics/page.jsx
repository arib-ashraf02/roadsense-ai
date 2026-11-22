"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
  CartesianGrid,
} from "recharts";
import {
  BarChart3,
  TrendingUp,
  Download,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCw,
  Building,
  Sparkles,
  Layers,
} from "lucide-react";
import { useTheme } from "@/components/providers/ThemeProvider";
import { motion } from "framer-motion";
import {
  FadeInView,
  StaggerContainer,
  StaggerItem,
  AnimatedCounter,
  InteractiveCard,
} from "@/components/common/AnimationWrappers";

export default function AnalyticsPage() {
  const [overview, setOverview] = useState(null);
  const [severityData, setSeverityData] = useState([]);
  const [trends, setTrends] = useState([]);
  const [wardData, setWardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentThemeConfig } = useTheme();

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";
      const [overRes, sevRes, trendRes, wardRes] = await Promise.all([
        fetch(`${apiUrl}/analytics/overview`),
        fetch(`${apiUrl}/analytics/severity`),
        fetch(`${apiUrl}/analytics/trends`),
        fetch(`${apiUrl}/analytics/wards`),
      ]);

      if (overRes.ok) setOverview(await overRes.json());
      if (sevRes.ok) setSeverityData(await sevRes.json());
      if (trendRes.ok) setTrends(await trendRes.json());
      if (wardRes.ok) setWardData(await wardRes.json());
    } catch (e) {
      console.error("Failed to load analytics telemetry:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const exportCSV = () => {
    if (!severityData.length && !trends.length) return;
    let csv = "Severity,Count\n";
    severityData.forEach((s) => {
      csv += `${s.severity},${s.count}\n`;
    });
    csv += "\nDate,Detections,Complaints,Resolved\n";
    trends.forEach((t) => {
      csv += `${t.date},${t.detections},${t.complaints},${t.resolved}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `roadsense-telemetry-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const chartTheme = {
    critical: currentThemeConfig?.chart?.critical || "#EF4444",
    high: currentThemeConfig?.chart?.high || "#F59E0B",
    medium: currentThemeConfig?.chart?.medium || "#3B82F6",
    low: currentThemeConfig?.chart?.low || "#10B981",
    primary: currentThemeConfig?.chart?.primary || currentThemeConfig?.colors?.primary || "#3B82F6",
    secondary: currentThemeConfig?.chart?.secondary || currentThemeConfig?.colors?.accent || "#00F2FE",
  };

  const getSeverityColor = (sev) => {
    const s = String(sev).toUpperCase();
    if (s === "CRITICAL") return chartTheme.critical;
    if (s === "HIGH") return chartTheme.high;
    if (s === "MEDIUM") return chartTheme.medium;
    return chartTheme.low;
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1 text-xs font-bold text-foreground mb-2">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span>Infrastructure Intelligence</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">
            Municipal Road Telemetry & Analytics
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Real database-driven metrics analyzing pothole severity distribution, resolution SLAs, and ward risk levels.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.95 }}
            onClick={fetchAnalytics}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-xs font-bold text-foreground shadow-xs hover:bg-accent transition"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-primary" : ""}`} />
            <span>Refresh</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.95 }}
            onClick={exportCSV}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2 text-xs font-bold text-primary-foreground shadow-sm hover:opacity-95 transition"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </motion.button>
        </div>
      </motion.div>

      {/* Top Aggregates */}
      <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <StaggerItem>
          <InteractiveCard className="editorial-card space-y-2 h-full">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Total Detections
            </span>
            <div className="text-3xl font-black text-foreground">
              {overview?.total_potholes !== undefined ? (
                <AnimatedCounter value={overview.total_potholes} />
              ) : (
                "0"
              )}
            </div>
            <p className="text-[11px] text-muted-foreground">Captured via computer vision</p>
          </InteractiveCard>
        </StaggerItem>

        <StaggerItem>
          <InteractiveCard className="editorial-card space-y-2 h-full">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Resolution Rate
            </span>
            <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {overview?.complaints?.resolution_rate_pct !== undefined ? (
                <AnimatedCounter value={`${overview.complaints.resolution_rate_pct}%`} />
              ) : (
                "0%"
              )}
            </div>
            <p className="text-[11px] text-muted-foreground">
              {overview?.complaints?.resolved ?? 0} verified resolved
            </p>
          </InteractiveCard>
        </StaggerItem>

        <StaggerItem>
          <InteractiveCard className="editorial-card space-y-2 h-full">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Active Backlog
            </span>
            <div className="text-3xl font-black text-primary">
              {overview?.tickets?.pending !== undefined ? (
                <AnimatedCounter value={overview.tickets.pending} />
              ) : (
                "0"
              )}
            </div>
            <p className="text-[11px] text-muted-foreground">Field repair work orders</p>
          </InteractiveCard>
        </StaggerItem>

        <StaggerItem>
          <InteractiveCard className="editorial-card space-y-2 h-full">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Spatial Clusters
            </span>
            <div className="text-3xl font-black text-foreground">
              {overview?.spatial_clusters !== undefined ? (
                <AnimatedCounter value={overview.spatial_clusters} />
              ) : (
                "0"
              )}
            </div>
            <p className="text-[11px] text-muted-foreground">Deduplicated 15m road segments</p>
          </InteractiveCard>
        </StaggerItem>
      </StaggerContainer>

      {/* Recharts Grid with Dynamic Theme Colors */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Severity Classification */}
        <FadeInView className="editorial-card space-y-4">
          <div>
            <h3 className="text-sm font-bold text-foreground">Defect Severity Classification</h3>
            <p className="text-xs text-muted-foreground">Pothole density grouped by physical hazard rating</p>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={severityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis dataKey="severity" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    borderColor: "hsl(var(--border))",
                    color: "hsl(var(--foreground))",
                    borderRadius: "12px",
                  }}
                />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {severityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getSeverityColor(entry.severity)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </FadeInView>

        {/* 7-Day Trend */}
        <FadeInView delay={0.15} className="editorial-card space-y-4">
          <div>
            <h3 className="text-sm font-bold text-foreground">Detection & Repair Cadence (7 Days)</h3>
            <p className="text-xs text-muted-foreground">Daily volume of new defects vs completed repairs</p>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    borderColor: "hsl(var(--border))",
                    color: "hsl(var(--foreground))",
                    borderRadius: "12px",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                <Line
                  type="monotone"
                  dataKey="detections"
                  stroke={chartTheme.high}
                  strokeWidth={2.5}
                  name="AI Detections"
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="complaints"
                  stroke={chartTheme.secondary}
                  strokeWidth={2.5}
                  name="Grievances"
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="resolved"
                  stroke={chartTheme.low}
                  strokeWidth={2.5}
                  name="Repairs Closed"
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </FadeInView>
      </div>

      {/* Ward Conditions Risk Table */}
      <FadeInView delay={0.25} className="editorial-card p-0 overflow-hidden">
        <div className="p-6 border-b border-border">
          <h3 className="text-sm font-bold text-foreground">Ward-Wise Road Condition Analysis</h3>
          <p className="text-xs text-muted-foreground">
            Risk rating and active defect backlog across municipal administrative sectors
          </p>
        </div>

        {wardData.length === 0 ? (
          <p className="py-12 text-center text-xs text-muted-foreground">No ward records logged yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-muted/20 text-muted-foreground">
                <tr>
                  <th className="py-3 px-6 font-bold uppercase tracking-wider text-[10px]">
                    Municipal Ward
                  </th>
                  <th className="py-3 px-6 font-bold uppercase tracking-wider text-[10px]">
                    Total Tickets
                  </th>
                  <th className="py-3 px-6 font-bold uppercase tracking-wider text-[10px]">
                    Critical Defects
                  </th>
                  <th className="py-3 px-6 font-bold uppercase tracking-wider text-[10px]">
                    Active Backlog
                  </th>
                  <th className="py-3 px-6 font-bold uppercase tracking-wider text-[10px]">
                    Risk Rating
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {wardData.map((w, idx) => (
                  <tr key={idx} className="hover:bg-accent/20 transition-colors">
                    <td className="py-3.5 px-6 font-bold text-foreground">{w.ward}</td>
                    <td className="py-3.5 px-6 text-muted-foreground">{w.total_tickets}</td>
                    <td className="py-3.5 px-6 font-bold text-rose-600 dark:text-rose-400">
                      {w.critical}
                    </td>
                    <td className="py-3.5 px-6 font-semibold text-primary">{w.open}</td>
                    <td className="py-3.5 px-6">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${
                          w.critical > 2
                            ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                            : w.open > 5
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                            : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                        }`}
                      >
                        {w.critical > 2 ? "HIGH RISK" : w.open > 5 ? "MODERATE" : "STABLE"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </FadeInView>
    </div>
  );
}
