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
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function AnalyticsPage() {
  const [overview, setOverview] = useState(null);
  const [severityData, setSeverityData] = useState([]);
  const [trends, setTrends] = useState([]);
  const [wardData, setWardData] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
            Municipal Road Telemetry & Analytics
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real database-driven metrics analyzing pothole severity distribution, resolution SLAs, and ward conditions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchAnalytics} disabled={loading} className="gap-1.5 text-xs">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={exportCSV} className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-xs">
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Top Aggregates */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-slate-500">Total Detections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-slate-900">{overview?.total_potholes ?? 0}</div>
            <p className="text-xs text-slate-400 mt-1">Captured via computer vision</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-slate-500">Resolution Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-emerald-600">
              {overview?.complaints?.resolution_rate_pct ?? 0}%
            </div>
            <p className="text-xs text-slate-400 mt-1">{overview?.complaints?.resolved ?? 0} resolved complaints</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-slate-500">Active Work Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-blue-600">{overview?.tickets?.pending ?? 0}</div>
            <p className="text-xs text-slate-400 mt-1">Field repair backlog</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-slate-500">Spatial Clusters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-purple-600">{overview?.spatial_clusters ?? 0}</div>
            <p className="text-xs text-slate-400 mt-1">Deduplicated road segments</p>
          </CardContent>
        </Card>
      </div>

      {/* Recharts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Severity Classification */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Defect Severity Classification</CardTitle>
            <CardDescription>Pothole density grouped by physical hazard rating</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={severityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="severity" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      borderColor: "#334155",
                      color: "#f8fafc",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {severityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* 7-Day Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Detection & Resolution Trend (7 Days)</CardTitle>
            <CardDescription>Daily cadence of new defects vs completed repairs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      borderColor: "#334155",
                      color: "#f8fafc",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                  <Line type="monotone" dataKey="detections" stroke="#f59e0b" strokeWidth={2} name="Detections" />
                  <Line type="monotone" dataKey="complaints" stroke="#3b82f6" strokeWidth={2} name="Complaints" />
                  <Line type="monotone" dataKey="resolved" stroke="#10b981" strokeWidth={2} name="Resolved" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ward Conditions Risk Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Ward-Wise Road Condition Analysis</CardTitle>
          <CardDescription>Risk scoring and defect backlog distribution across municipal zones</CardDescription>
        </CardHeader>
        <CardContent>
          {wardData.length === 0 ? (
            <p className="py-8 text-center text-xs text-slate-400">No ward records logged yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 text-slate-500">
                  <tr>
                    <th className="pb-3 font-semibold">Municipal Ward</th>
                    <th className="pb-3 font-semibold">Total Tickets</th>
                    <th className="pb-3 font-semibold">Critical Defects</th>
                    <th className="pb-3 font-semibold">Active Backlog</th>
                    <th className="pb-3 font-semibold">Risk Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {wardData.map((w, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-3 font-medium text-slate-800">{w.ward}</td>
                      <td className="py-3">{w.total_tickets}</td>
                      <td className="py-3 font-semibold text-rose-600">{w.critical}</td>
                      <td className="py-3 text-blue-600">{w.open}</td>
                      <td className="py-3">
                        <Badge
                          variant={w.critical > 2 ? "destructive" : w.open > 5 ? "warning" : "success"}
                          className="text-[10px]"
                        >
                          {w.critical > 2 ? "HIGH RISK" : w.open > 5 ? "MODERATE" : "STABLE"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
