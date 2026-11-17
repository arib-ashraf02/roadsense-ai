"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Compass,
  Cpu,
  FileText,
  MapPin,
  RefreshCw,
  Server,
  Shield,
  Truck,
  Users,
  Wrench,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const MOCK_SEVERITY_DATA = [
  { severity: "Low", count: 42, color: "#10b981" },
  { severity: "Medium", count: 87, color: "#f59e0b" },
  { severity: "High", count: 54, color: "#f97316" },
  { severity: "Critical", count: 19, color: "#ef4444" },
];

const ROLES = [
  {
    title: "Citizen / Reporter",
    icon: Users,
    color: "bg-blue-50 text-blue-700 border-blue-200",
    description: "Capture & submit road defects with automatic GPS & EXIF extraction.",
    action: "Report Pothole",
  },
  {
    title: "Municipal Officer",
    icon: Shield,
    color: "bg-purple-50 text-purple-700 border-purple-200",
    description: "Triage AI detections, review duplicates & assign tickets to teams.",
    action: "Manage Tickets",
  },
  {
    title: "Maintenance Team",
    icon: Wrench,
    color: "bg-amber-50 text-amber-700 border-amber-200",
    description: "Receive geolocated tasks & submit 'after' photos for AI verification.",
    action: "Field Tasks",
  },
  {
    title: "Administrator",
    icon: Cpu,
    color: "bg-slate-100 text-slate-800 border-slate-300",
    description: "Oversee system health, spatial clustering heuristics & municipal analytics.",
    action: "System Console",
  },
];

export default function Home() {
  const [apiStatus, setApiStatus] = useState({
    loading: false,
    checked: false,
    healthy: false,
    latency: null,
    data: null,
    error: null,
  });

  const checkBackendHealth = async () => {
    setApiStatus((prev) => ({ ...prev, loading: true, error: null }));
    const startTime = performance.now();
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";
      const response = await fetch(`${apiUrl}/health`, {
        method: "GET",
        headers: { Accept: "application/json" },
      });
      const endTime = performance.now();
      const latency = Math.round(endTime - startTime);

      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setApiStatus({
        loading: false,
        checked: true,
        healthy: data.status === "healthy",
        latency,
        data,
        error: null,
      });
    } catch (err) {
      setApiStatus({
        loading: false,
        checked: true,
        healthy: false,
        latency: null,
        data: null,
        error: err.message || "Failed to connect to FastAPI service",
      });
    }
  };

  useEffect(() => {
    checkBackendHealth();
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 px-4 py-8 md:px-8 lg:px-16">
      {/* Top Banner & Header */}
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
              <Compass className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
                  RoadSense AI
                </h1>
                <Badge variant="outline" className="border-blue-300 bg-blue-50 text-blue-700">
                  Phase 2 Scaffold
                </Badge>
              </div>
              <p className="text-sm text-slate-500">
                AI-Powered Road Anomaly Detection & Municipal Complaint Platform
              </p>
            </div>
          </div>

          {/* Real-time Health Indicator */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 shadow-sm">
              <span className="relative flex h-3 w-3">
                {apiStatus.healthy ? (
                  <>
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500"></span>
                  </>
                ) : (
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-amber-500"></span>
                )}
              </span>
              <span className="text-xs font-medium text-slate-700">
                Backend:{" "}
                {apiStatus.loading
                  ? "Checking..."
                  : apiStatus.healthy
                  ? "Operational"
                  : "Disconnected"}
              </span>
              {apiStatus.latency && (
                <span className="text-xs text-slate-400">({apiStatus.latency}ms)</span>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={checkBackendHealth}
              disabled={apiStatus.loading}
              className="gap-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${apiStatus.loading ? "animate-spin" : ""}`} />
              Verify
            </Button>
          </div>
        </header>

        {/* Hero Section with Framer Motion */}
        <motion.section
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="my-8 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm md:p-8"
        >
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              <Badge variant="secondary" className="font-semibold text-blue-700">
                System Initialized
              </Badge>
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
                Automated Municipal Road Auditing & Lifecycle Management
              </h2>
              <p className="text-base text-slate-600">
                RoadSense AI pairs high-throughput <strong>YOLO vision models</strong> with{" "}
                <strong>PostGIS spatial deduplication</strong>, bridging citizen reports directly
                to municipal maintenance tickets with AI before/after repair validation.
              </p>

              {/* Status metrics grid */}
              <div className="grid grid-cols-2 gap-4 pt-2 sm:grid-cols-4">
                <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-3">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <Activity className="h-4 w-4 text-blue-600" />
                    <span className="text-xs font-medium">FastAPI Engine</span>
                  </div>
                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {apiStatus.healthy ? "Connected" : "Standby"}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-3">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <MapPin className="h-4 w-4 text-emerald-600" />
                    <span className="text-xs font-medium">PostGIS Geo</span>
                  </div>
                  <p className="mt-1 text-sm font-semibold text-slate-800">ST_DWithin Ready</p>
                </div>
                <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-3">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <span className="text-xs font-medium">YOLO Detection</span>
                  </div>
                  <p className="mt-1 text-sm font-semibold text-slate-800">PyTorch Scaffolding</p>
                </div>
                <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-3">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <CheckCircle2 className="h-4 w-4 text-purple-600" />
                    <span className="text-xs font-medium">Next.js App</span>
                  </div>
                  <p className="mt-1 text-sm font-semibold text-slate-800">JS / Tailwind</p>
                </div>
              </div>
            </div>

            {/* FastAPI Diagnostics Card */}
            <Card className="border-slate-200 bg-slate-900 text-white">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-100">
                    <Server className="h-4 w-4 text-blue-400" />
                    FastAPI Telemetry
                  </CardTitle>
                  <Badge
                    variant={apiStatus.healthy ? "success" : "destructive"}
                    className="text-[10px]"
                  >
                    {apiStatus.healthy ? "HTTP 200" : "OFFLINE"}
                  </Badge>
                </div>
                <CardDescription className="text-xs text-slate-400">
                  Target: {process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-xs font-mono">
                <div className="rounded bg-slate-800/80 p-3 text-slate-300">
                  {apiStatus.loading && (
                    <div className="flex items-center gap-2 text-slate-400">
                      <RefreshCw className="h-3 w-3 animate-spin" />
                      Pinging health endpoint...
                    </div>
                  )}
                  {!apiStatus.loading && apiStatus.data && (
                    <pre className="overflow-x-auto whitespace-pre-wrap">
                      {JSON.stringify(apiStatus.data, null, 2)}
                    </pre>
                  )}
                  {!apiStatus.loading && apiStatus.error && (
                    <div className="text-rose-400">
                      <p className="font-semibold">Connection Notice:</p>
                      <p>{apiStatus.error}</p>
                      <p className="mt-2 text-[11px] text-slate-400">
                        Run backend server: <code className="text-blue-300">uvicorn main:app --reload</code>
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.section>

        {/* Analytics & Architecture Overview */}
        <div className="my-8 grid gap-6 md:grid-cols-2">
          {/* Recharts Component Demonstration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Severity Classification Telemetry</CardTitle>
              <CardDescription>
                Live Recharts visualization of detected road anomalies by severity grade
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={MOCK_SEVERITY_DATA}>
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
                      {MOCK_SEVERITY_DATA.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* User Roles Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Municipal Stakeholder Ecosystem</CardTitle>
              <CardDescription>
                Role-based access matrix ready for Phase 3 ticket lifecycle implementation
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {ROLES.map((role) => {
                const Icon = role.icon;
                return (
                  <div
                    key={role.title}
                    className="flex flex-col justify-between rounded-lg border border-slate-200/70 p-3.5 transition-all hover:border-slate-300 hover:shadow-sm"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <div className={`rounded-md p-1.5 ${role.color}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <h4 className="text-sm font-semibold text-slate-800">{role.title}</h4>
                      </div>
                      <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                        {role.description}
                      </p>
                    </div>
                    <div className="mt-3">
                      <Badge variant="outline" className="text-[10px]">
                        {role.action}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <footer className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-200 py-6 text-xs text-slate-500 sm:flex-row">
          <p>© 2026 RoadSense AI Platform — Built with Next.js & FastAPI</p>
          <div className="flex items-center gap-4">
            <span>Next.js 15 (App Router / JS)</span>
            <span>•</span>
            <span>FastAPI 0.115</span>
            <span>•</span>
            <span>Tailwind CSS + shadcn</span>
          </div>
        </footer>
      </div>
    </main>
  );
}
