"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  PlusCircle,
  FileText,
  MapPin,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import { EmptyStateIllustration } from "@/components/illustrations/EmptyStateIllustration";
import {
  FadeInView,
  StaggerContainer,
  StaggerItem,
  AnimatedCounter,
  InteractiveCard,
} from "@/components/common/AnimationWrappers";

export default function CitizenDashboard() {
  const { data: session } = useSession();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadComplaints() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";
        const res = await fetch(`${apiUrl}/complaints/?mine_only=true`, {
          headers: session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          setComplaints(data);
        }
      } catch (e) {
        console.error("Error loading citizen complaints:", e);
      } finally {
        setLoading(false);
      }
    }
    loadComplaints();
  }, [session]);

  const submittedCount = complaints.filter((c) => c.status === "SUBMITTED").length;
  const inProgressCount = complaints.filter((c) => ["TRIAGED", "IN_PROGRESS"].includes(c.status)).length;
  const resolvedCount = complaints.filter((c) => c.status === "RESOLVED").length;

  return (
    <div className="space-y-8 pb-12">
      {/* Editorial Welcome Banner */}
      <FadeInView className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-accent/60 px-3.5 py-1 text-xs font-bold text-foreground">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span>Citizen Civic Network</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
              Welcome back,{" "}
              <span className="text-primary font-black">
                {session?.user?.name || "Citizen Reporter"}
              </span>
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Every road snapshot you submit is verified with computer vision, checked against nearby reports, and tracked live through repair completion.
            </p>
          </div>

          <div className="shrink-0">
            <motion.div whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}>
              <Link
                href="/citizen/report"
                className="inline-flex items-center gap-2.5 rounded-full bg-primary px-6 py-3.5 text-xs font-bold text-primary-foreground shadow-md shadow-primary/20 hover:opacity-95 transition-all duration-200"
              >
                <PlusCircle className="h-4 w-4" />
                <span>Report New Pothole</span>
              </Link>
            </motion.div>
          </div>
        </div>
      </FadeInView>

      {/* KPI Metrics Row */}
      <StaggerContainer className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StaggerItem>
          <InteractiveCard className="editorial-card space-y-2 h-full">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-bold uppercase tracking-wider">Under Triage</span>
              <Clock className="h-4 w-4 text-amber-500" />
            </div>
            <div className="text-3xl font-black text-foreground">
              <AnimatedCounter value={submittedCount} />
            </div>
            <p className="text-[11px] text-muted-foreground">Pending municipal officer review</p>
          </InteractiveCard>
        </StaggerItem>

        <StaggerItem>
          <InteractiveCard className="editorial-card space-y-2 h-full">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-bold uppercase tracking-wider">In Active Repair</span>
              <AlertTriangle className="h-4 w-4 text-primary" />
            </div>
            <div className="text-3xl font-black text-primary">
              <AnimatedCounter value={inProgressCount} />
            </div>
            <p className="text-[11px] text-muted-foreground">Work order assigned to field crew</p>
          </InteractiveCard>
        </StaggerItem>

        <StaggerItem>
          <InteractiveCard className="editorial-card space-y-2 h-full">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-bold uppercase tracking-wider">Repaired & Verified</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="text-3xl font-black text-foreground">
              <AnimatedCounter value={resolvedCount} />
            </div>
            <p className="text-[11px] text-muted-foreground">Confirmed with AI after-photo evidence</p>
          </InteractiveCard>
        </StaggerItem>
      </StaggerContainer>

      {/* Recent Submissions */}
      <FadeInView delay={0.2} className="editorial-card space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-foreground">My Submitted Grievances</h3>
            <p className="text-xs text-muted-foreground">Real-time status tracking of your road hazard reports</p>
          </div>
          <Link
            href="/citizen/my-reports"
            className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
          >
            <span>View All</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs font-medium text-muted-foreground">
            Loading your reports from municipal database...
          </div>
        ) : complaints.length === 0 ? (
          <EmptyStateIllustration
            title="No Grievances Reported Yet"
            subtitle="Spotted an asphalt cavity or broken pavement? Submit your first road report in seconds."
          />
        ) : (
          <div className="divide-y divide-border">
            {complaints.slice(0, 5).map((c) => (
              <div
                key={c.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between py-4 gap-3 hover:bg-accent/30 rounded-xl px-2 transition-colors"
              >
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-foreground">{c.title}</h4>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-primary" />
                      {c.address_text || `${Number(c.latitude).toFixed(4)}, ${Number(c.longitude).toFixed(4)}`}
                    </span>
                    <span>•</span>
                    <span>{new Date(c.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider ${
                      c.status === "RESOLVED"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                        : c.status === "SUBMITTED"
                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                        : "bg-primary/10 text-primary border border-primary/20"
                    }`}
                  >
                    {c.status}
                  </span>
                  <Link
                    href={`/citizen/report/${c.id}`}
                    className="rounded-xl border border-border bg-card p-2 text-muted-foreground hover:text-foreground hover:bg-accent transition"
                    title="View Inspection Details"
                  >
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </FadeInView>
    </div>
  );
}
