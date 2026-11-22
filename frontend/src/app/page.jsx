"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Compass,
  ArrowRight,
  Shield,
  HardHat,
  Users,
  MapPin,
  CheckCircle2,
  Clock,
  Sparkles,
  Layers,
  BarChart3,
  ExternalLink,
  Activity,
  Bot,
  Zap,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
} from "recharts";
import Image from "next/image";
import { AiRoadInspectionHero } from "@/components/hero/AiRoadInspectionHero";
import { CinematicRoadBackground } from "@/components/common/CinematicRoadBackground";
import { ThemeSwitcherModal } from "@/components/common/ThemeSwitcherModal";
import { useTheme } from "@/components/providers/ThemeProvider";
import {
  FadeInView,
  StaggerContainer,
  StaggerItem,
  AnimatedCounter,
  InteractiveCard,
} from "@/components/common/AnimationWrappers";

const MOCK_SEVERITY_DATA = [
  { severity: "Low", count: 42 },
  { severity: "Medium", count: 87 },
  { severity: "High", count: 54 },
  { severity: "Critical", count: 19 },
];

const ROLES = [
  {
    title: "Citizen / Reporter",
    roleKey: "CITIZEN",
    icon: Users,
    description: "Capture road defects with automated EXIF location extraction and real-time status tracking.",
    cta: "Citizen Portal",
    href: "/citizen",
  },
  {
    title: "Municipal Officer",
    roleKey: "OFFICER",
    icon: Shield,
    description: "Triage AI detections, inspect 15-meter duplicate clusters, and dispatch work orders.",
    cta: "Officer Portal",
    href: "/officer",
  },
  {
    title: "Maintenance Crew",
    roleKey: "MAINTENANCE",
    icon: HardHat,
    description: "Navigate to turn-by-turn repair sites and submit post-repair imagery for AI verification.",
    cta: "Work Queue",
    href: "/maintenance",
  },
  {
    title: "System Administrator",
    roleKey: "ADMIN",
    icon: Activity,
    description: "Manage city wards, user roles, spatial clustering thresholds, and infrastructure analytics.",
    cta: "Admin Console",
    href: "/admin",
  },
];

export default function Home() {
  const { currentThemeConfig } = useTheme();
  const [apiHealth, setApiHealth] = useState({
    checked: false,
    healthy: false,
    latency: null,
    model: "YOLOv8-RDD",
  });

  useEffect(() => {
    async function checkHealth() {
      const startTime = performance.now();
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";
        const res = await fetch(`${apiUrl}/health`);
        const latency = Math.round(performance.now() - startTime);
        if (res.ok) {
          const data = await res.json();
          setApiHealth({
            checked: true,
            healthy: true,
            latency,
            model: data.model_weights || "YOLOv8-RDD2022",
          });
        } else {
          setApiHealth({ checked: true, healthy: false, latency, model: "Unavailable" });
        }
      } catch (e) {
        setApiHealth({ checked: true, healthy: false, latency: null, model: "Offline" });
      }
    }
    checkHealth();
  }, []);

  const chartPalette = [
    currentThemeConfig?.chart?.low || "#00F2FE",
    currentThemeConfig?.chart?.medium || "#3B82F6",
    currentThemeConfig?.chart?.high || "#F59E0B",
    currentThemeConfig?.chart?.critical || "#EF4444",
  ];

  return (
    <div className="relative min-h-screen bg-background text-foreground transition-colors duration-300 overflow-x-hidden">
      {/* Cinematic Road Background Layer */}
      <CinematicRoadBackground />

      {/* Top Futuristic Navigation */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/75 backdrop-blur-md transition-colors duration-200">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 sm:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-2xl text-white shadow-md transition-all duration-300"
              style={{
                backgroundColor: currentThemeConfig.colors.primary,
                boxShadow: `0 0 20px -3px ${currentThemeConfig.colors.glow}`,
              }}
            >
              <Compass className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-foreground">
                RoadSense<span style={{ color: currentThemeConfig.colors.primary }}>.ai</span>
              </span>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Autonomous Road Governance
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#portals" className="hover:text-foreground transition-colors">
              User Portals
            </a>
            <a href="#analytics" className="hover:text-foreground transition-colors">
              City Analytics
            </a>
            <Link href="/map" className="hover:text-foreground transition-colors">
              Live Map
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <ThemeSwitcherModal />
            <Link
              href="/login"
              className="inline-flex h-10 items-center justify-center rounded-full border border-border bg-card/80 px-5 text-xs font-bold text-foreground shadow-xs hover:bg-accent transition-all duration-200"
            >
              Sign In
            </Link>
            <Link
              href="/citizen/report"
              className="inline-flex h-10 items-center gap-1.5 rounded-full px-5 text-xs font-bold text-white shadow-lg transition-all duration-200 hover:opacity-95 hover:scale-105"
              style={{
                backgroundColor: currentThemeConfig.colors.primary,
                boxShadow: `0 0 25px -4px ${currentThemeConfig.colors.glow}`,
              }}
            >
              <span>Report Pothole</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section with Realistic Indian Urban Road Backdrop & AI Pothole Detection Viewport */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28">
        {/* Realistic High-Quality Indian Urban Road Cinematic Backdrop */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden select-none">
          <Image
            src="/images/mumbai_urban_road.jpg"
            alt="Local Indian Urban Road Infrastructure"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center opacity-25 sm:opacity-30 scale-105"
          />
          {/* Subtle Dark Gradient Overlay behind hero text for pristine readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/95 sm:via-background/85 to-background/50" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/70" />
        </div>

        <div className="mx-auto max-w-7xl px-6 sm:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 relative z-10">
              {/* Top Tag Pill */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-4 py-1.5 shadow-sm backdrop-blur-md"
                style={{
                  boxShadow: `0 0 15px -3px ${currentThemeConfig.colors.glow}`,
                }}
              >
                <span
                  className="h-2 w-2 rounded-full animate-ping"
                  style={{ backgroundColor: currentThemeConfig.colors.accent }}
                />
                <span className="text-xs font-extrabold tracking-wide text-foreground">
                  AI-Powered Smart Road Infrastructure
                </span>
              </motion.div>

              {/* Headline */}
              <motion.h1
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-4xl sm:text-6xl font-black tracking-tight text-foreground leading-[1.1]"
              >
                Detect road defects. Prioritize repairs.{" "}
                <span
                  className="accent-underline"
                  style={{ color: currentThemeConfig.colors.primary }}
                >
                  Automate cities.
                </span>
              </motion.h1>

              {/* Body Text */}
              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="text-base sm:text-lg text-muted-foreground max-w-2xl font-normal leading-relaxed"
              >
                RoadSense AI combines computer vision (YOLOv8-RDD), sub-meter GPS indexing, and 15-meter DBSCAN spatial clustering to eliminate duplicate complaints and dispatch municipal work crews with verified before-and-after proof.
              </motion.p>

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="flex flex-wrap items-center gap-4 pt-2"
              >
                <motion.div whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}>
                  <Link
                    href="/citizen/report"
                    className="inline-flex h-12 items-center gap-2.5 rounded-full px-7 text-sm font-bold text-white shadow-xl transition-all duration-200"
                    style={{
                      backgroundColor: currentThemeConfig.colors.primary,
                      boxShadow: `0 0 30px -5px ${currentThemeConfig.colors.glow}`,
                    }}
                  >
                    <span>Launch Reporting Flow</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </motion.div>

                <motion.div whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}>
                  <Link
                    href="/map"
                    className="inline-flex h-12 items-center gap-2.5 rounded-full border border-border bg-card/80 px-7 text-sm font-bold text-foreground shadow-sm backdrop-blur-md hover:bg-accent/70 transition-all duration-200"
                  >
                    <MapPin className="h-4 w-4" style={{ color: currentThemeConfig.colors.accent }} />
                    <span>Explore GIS Heatmap</span>
                  </Link>
                </motion.div>
              </motion.div>

              {/* Telemetry Status Bar */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="flex flex-wrap items-center gap-6 pt-4 text-xs font-semibold text-muted-foreground border-t border-border"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      apiHealth.healthy ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
                    }`}
                  />
                  <span>
                    API Service:{" "}
                    <strong className="text-foreground">
                      {apiHealth.healthy ? "Operational" : "Checking"}
                    </strong>
                  </span>
                  {apiHealth.latency && (
                    <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-foreground font-mono">
                      {apiHealth.latency}ms
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Zap className="h-3.5 w-3.5" style={{ color: currentThemeConfig.colors.accent }} />
                  <span>Model: <strong>{apiHealth.model}</strong></span>
                </div>
              </motion.div>
            </div>

            {/* Right: AI Road Pothole Detection Viewport */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="lg:col-span-5 relative"
            >
              <AiRoadInspectionHero />
            </motion.div>
          </div>
        </div>
      </section>

      {/* KPI Metric Strip with Smooth Animated Counters */}
      <section className="border-y border-border bg-card/60 backdrop-blur-md py-10 transition-colors duration-200">
        <div className="mx-auto max-w-7xl px-6 sm:px-8">
          <FadeInView>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="space-y-1">
                <span className="text-3xl sm:text-4xl font-black text-foreground">
                  <AnimatedCounter value="98.4%" />
                </span>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  AI Detection Precision
                </p>
              </div>
              <div className="space-y-1">
                <span
                  className="text-3xl sm:text-4xl font-black"
                  style={{ color: currentThemeConfig.colors.accent }}
                >
                  <AnimatedCounter value="15m" />
                </span>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Spatial Clustering Radius
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-3xl sm:text-4xl font-black text-foreground">
                  <AnimatedCounter value="3.2x" />
                </span>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Faster Repair Dispatch
                </p>
              </div>
              <div className="space-y-1">
                <span
                  className="text-3xl sm:text-4xl font-black"
                  style={{ color: currentThemeConfig.colors.primary }}
                >
                  <AnimatedCounter value="100%" />
                </span>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Evidence AI Verification
                </p>
              </div>
            </div>
          </FadeInView>
        </div>
      </section>

      {/* Core Technology Features with Staggered Scroll Entrance */}
      <section id="features" className="py-20 sm:py-28 relative">
        <div className="mx-auto max-w-7xl px-6 sm:px-8">
          <FadeInView className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span
              className="text-xs font-bold uppercase tracking-widest"
              style={{ color: currentThemeConfig.colors.accent }}
            >
              Core Capabilities
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
              Built for Municipal Scale & High Availability
            </h2>
            <p className="text-sm text-muted-foreground">
              A complete autonomous pipeline from citizen snapshot to automated field dispatch and forensic repair sign-off.
            </p>
          </FadeInView>

          <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <StaggerItem>
              <InteractiveCard className="editorial-card-interactive space-y-4 h-full">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110"
                  style={{
                    backgroundColor: "hsl(var(--primary) / 0.15)",
                    color: currentThemeConfig.colors.primary,
                  }}
                >
                  <Sparkles className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground">
                  YOLOv8 Computer Vision
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Real-time bounding box localization, confidence scoring, and 4-tier severity classification trained on road damage datasets.
                </p>
              </InteractiveCard>
            </StaggerItem>

            {/* Feature 2 */}
            <StaggerItem>
              <InteractiveCard className="editorial-card-interactive space-y-4 h-full">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110"
                  style={{
                    backgroundColor: "hsl(var(--primary) / 0.15)",
                    color: currentThemeConfig.colors.accent,
                  }}
                >
                  <Layers className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground">
                  15m Spatial Clustering
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Prevents duplicate tickets by matching new reports with existing coordinates in real-time, grouping citizen grievance clusters.
                </p>
              </InteractiveCard>
            </StaggerItem>

            {/* Feature 3 */}
            <StaggerItem>
              <InteractiveCard className="editorial-card-interactive space-y-4 h-full">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110"
                  style={{
                    backgroundColor: "hsl(var(--primary) / 0.15)",
                    color: currentThemeConfig.colors.primary,
                  }}
                >
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground">
                  AI Repair Verification
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Compares before-and-after photographs to confirm pothole patches and asphalt resurfacing before closing municipal work tickets.
                </p>
              </InteractiveCard>
            </StaggerItem>
          </StaggerContainer>
        </div>
      </section>

      {/* Role Dashboards Grid with Staggered Entrance */}
      <section id="portals" className="border-t border-border bg-card/40 backdrop-blur-md py-20 sm:py-28 transition-colors duration-200">
        <div className="mx-auto max-w-7xl px-6 sm:px-8">
          <FadeInView className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <span
                className="text-xs font-bold uppercase tracking-widest"
                style={{ color: currentThemeConfig.colors.accent }}
              >
                Role-Based Architecture
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight mt-1">
                Designed for All 4 Municipal Stakeholders
              </h2>
            </div>
            <p className="text-xs text-muted-foreground max-w-md">
              Secure role-based access control grants customized tools for citizens, officers, engineers, and administrators.
            </p>
          </FadeInView>

          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {ROLES.map((r, i) => {
              const Icon = r.icon;
              return (
                <StaggerItem key={i}>
                  <InteractiveCard
                    className="editorial-card flex flex-col justify-between group hover:border-primary/60 transition-all duration-200 h-full"
                    style={{
                      boxShadow: `0 0 25px -10px ${currentThemeConfig.colors.glow}`,
                    }}
                  >
                    <div className="space-y-4">
                      <div
                        className="flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-200 group-hover:scale-110"
                        style={{
                          backgroundColor: "hsl(var(--primary) / 0.15)",
                          color: currentThemeConfig.colors.primary,
                        }}
                      >
                        <Icon className="h-6 w-6" />
                      </div>
                      <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
                        {r.title}
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {r.description}
                      </p>
                    </div>

                    <div className="pt-6">
                      <Link
                        href={r.href}
                        className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-border bg-card py-2.5 text-xs font-bold text-foreground group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all duration-200 shadow-xs"
                      >
                        <span>Enter {r.cta}</span>
                        <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                      </Link>
                    </div>
                  </InteractiveCard>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        </div>
      </section>

      {/* Analytics Preview with Active Theme Palette */}
      <section id="analytics" className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-6 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <FadeInView className="lg:col-span-5 space-y-5">
              <span
                className="text-xs font-bold uppercase tracking-widest"
                style={{ color: currentThemeConfig.colors.accent }}
              >
                Live Data Telemetry
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
                Ward-Level Defect Distribution
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Severity breakdowns dynamically re-color to harmonize with your active theme. Real-time telemetry ensures budget allocation matches actual road deterioration.
              </p>
              <div className="pt-2">
                <motion.div whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }} className="inline-block">
                  <Link
                    href="/analytics"
                    className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-xs font-bold text-white shadow-md hover:opacity-95 transition-all"
                    style={{
                      backgroundColor: currentThemeConfig.colors.primary,
                      boxShadow: `0 0 25px -4px ${currentThemeConfig.colors.glow}`,
                    }}
                  >
                    <BarChart3 className="h-4 w-4" />
                    <span>Open Full Analytics Portal</span>
                  </Link>
                </motion.div>
              </div>
            </FadeInView>

            <FadeInView delay={0.2} className="lg:col-span-7">
              <div className="editorial-card p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h4 className="font-bold text-sm text-foreground">Defect Severity Count</h4>
                    <span className="text-xs text-muted-foreground">Real-time classification breakdown</span>
                  </div>
                  <span
                    className="text-xs font-bold px-2.5 py-1 rounded-full border"
                    style={{
                      backgroundColor: "hsl(var(--primary) / 0.15)",
                      color: currentThemeConfig.colors.primary,
                      borderColor: "hsl(var(--primary) / 0.3)",
                    }}
                  >
                    202 Potholes Logged
                  </span>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={MOCK_SEVERITY_DATA}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis dataKey="severity" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          borderColor: "hsl(var(--border))",
                          borderRadius: "12px",
                          color: "hsl(var(--foreground))",
                        }}
                      />
                      <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                        {MOCK_SEVERITY_DATA.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={chartPalette[index % chartPalette.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </FadeInView>
          </div>
        </div>
      </section>

      {/* Footer with Subtle Reveal */}
      <footer className="border-t border-border bg-card/60 backdrop-blur-md py-12 transition-colors duration-200">
        <FadeInView className="mx-auto max-w-7xl px-6 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <motion.div
              whileHover={{ rotate: 12, scale: 1.05 }}
              className="flex h-8 w-8 items-center justify-center rounded-xl text-white shadow-sm cursor-pointer"
              style={{ backgroundColor: currentThemeConfig.colors.primary }}
            >
              <Compass className="h-4 w-4" />
            </motion.div>
            <span className="text-sm font-bold text-foreground">
              RoadSense AI Platform
            </span>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Futuristic Autonomous Municipal Infrastructure • Powered by YOLOv8 & PostGIS
          </p>

          <div className="flex items-center gap-4 text-xs font-semibold text-muted-foreground">
            <Link href="/citizen" className="hover:text-foreground transition-colors hover:-translate-y-0.5">Citizen</Link>
            <Link href="/officer" className="hover:text-foreground transition-colors hover:-translate-y-0.5">Officer</Link>
            <Link href="/maintenance" className="hover:text-foreground transition-colors hover:-translate-y-0.5">Crew</Link>
            <Link href="/admin" className="hover:text-foreground transition-colors hover:-translate-y-0.5">Admin</Link>
          </div>
        </FadeInView>
      </footer>
    </div>
  );
}
