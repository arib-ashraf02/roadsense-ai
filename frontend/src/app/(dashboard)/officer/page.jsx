"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  ShieldAlert,
  ClipboardList,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Wrench,
  Users,
  MapPin,
  Sparkles,
} from "lucide-react";
import { EmptyStateIllustration } from "@/components/illustrations/EmptyStateIllustration";
import { motion } from "framer-motion";
import {
  FadeInView,
  StaggerContainer,
  StaggerItem,
  AnimatedCounter,
  InteractiveCard,
} from "@/components/common/AnimationWrappers";

export default function OfficerDashboard() {
  const { data: session } = useSession();
  const [complaints, setComplaints] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";
        const headers = session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {};

        const [compRes, tktRes, overRes] = await Promise.all([
          fetch(`${apiUrl}/complaints/?limit=10`, { headers }),
          fetch(`${apiUrl}/tickets/?limit=10`, { headers }),
          fetch(`${apiUrl}/analytics/overview`),
        ]);

        if (compRes.ok) setComplaints(await compRes.json());
        if (tktRes.ok) setTickets(await tktRes.json());
        if (overRes.ok) setOverview(await overRes.json());
      } catch (e) {
        console.error("Failed to load officer dashboard data:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [session]);

  const pendingComplaints = complaints.filter((c) => c.status === "SUBMITTED");

  return (
    <div className="space-y-8 pb-12">
      {/* Officer Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1 text-xs font-bold text-foreground mb-2">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span>Ward Engineering Command</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">
            Municipal Officer Command
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Triage AI-detected road defects, manage work orders, and verify field repairs.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.95 }}>
            <Link
              href="/officer/complaints"
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-xs font-bold text-foreground shadow-xs hover:bg-accent transition"
            >
              <ClipboardList className="h-4 w-4 text-primary" />
              <span>Triage Queue</span>
            </Link>
          </motion.div>
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.95 }}>
            <Link
              href="/officer/tickets"
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2 text-xs font-bold text-primary-foreground shadow-sm hover:opacity-95 transition"
            >
              <Wrench className="h-4 w-4" />
              <span>Work Orders</span>
            </Link>
          </motion.div>
        </div>
      </motion.div>

      {/* Real-time Telemetry Grid */}
      <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <StaggerItem>
          <InteractiveCard className="editorial-card space-y-2 h-full">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-bold uppercase tracking-wider">Total Detections</span>
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </div>
            <div className="text-3xl font-black text-foreground">
              {overview?.total_potholes !== undefined ? (
                <AnimatedCounter value={overview.total_potholes} />
              ) : (
                "0"
              )}
            </div>
            <p className="text-[11px] text-muted-foreground">AI detected surface defects</p>
          </InteractiveCard>
        </StaggerItem>

        <StaggerItem>
          <InteractiveCard className="editorial-card space-y-2 h-full">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-bold uppercase tracking-wider">Pending Triage</span>
              <Clock className="h-4 w-4 text-primary" />
            </div>
            <div className="text-3xl font-black text-primary">
              {overview?.complaints?.open !== undefined ? (
                <AnimatedCounter value={overview.complaints.open} />
              ) : (
                "0"
              )}
            </div>
            <p className="text-[11px] text-muted-foreground">Citizen reports awaiting action</p>
          </InteractiveCard>
        </StaggerItem>

        <StaggerItem>
          <InteractiveCard className="editorial-card space-y-2 h-full">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-bold uppercase tracking-wider">Active Work Orders</span>
              <Wrench className="h-4 w-4 text-primary" />
            </div>
            <div className="text-3xl font-black text-foreground">
              {overview?.tickets?.pending !== undefined ? (
                <AnimatedCounter value={overview.tickets.pending} />
              ) : (
                "0"
              )}
            </div>
            <p className="text-[11px] text-muted-foreground">Dispatched to field teams</p>
          </InteractiveCard>
        </StaggerItem>

        <StaggerItem>
          <InteractiveCard className="editorial-card space-y-2 h-full">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-bold uppercase tracking-wider">Resolution Rate</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="text-3xl font-black text-foreground">
              {overview?.complaints?.resolution_rate_pct !== undefined ? (
                <AnimatedCounter value={`${overview.complaints.resolution_rate_pct}%`} />
              ) : (
                "0%"
              )}
            </div>
            <p className="text-[11px] text-muted-foreground">Verified closed with after-photo</p>
          </InteractiveCard>
        </StaggerItem>
      </StaggerContainer>

      {/* Immediate Triage Queue */}
      <FadeInView delay={0.2} className="editorial-card space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-foreground">Priority Triage Queue</h3>
            <p className="text-xs text-muted-foreground">
              Review citizen submissions, cross-check spatial duplicate clusters, and dispatch work orders
            </p>
          </div>
          <Link
            href="/officer/complaints"
            className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
          >
            <span>View Full Queue</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs font-semibold text-muted-foreground">
            Loading triage queue...
          </div>
        ) : pendingComplaints.length === 0 ? (
          <EmptyStateIllustration
            title="Triage Queue Clear!"
            subtitle="All received citizen road grievances have been reviewed and dispatched."
          />
        ) : (
          <div className="divide-y divide-border">
            {pendingComplaints.slice(0, 5).map((c) => (
              <div
                key={c.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between py-4 gap-3 hover:bg-accent/20 rounded-xl px-2 transition-colors"
              >
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-foreground">{c.title}</h4>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-primary" />
                      {c.address_text || `${Number(c.latitude).toFixed(4)}, ${Number(c.longitude).toFixed(4)}`}
                    </span>
                    <span>•</span>
                    <span>{new Date(c.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/officer/complaints`}
                    className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-bold text-primary hover:bg-primary hover:text-primary-foreground transition-all"
                  >
                    <span>Review & Dispatch</span>
                    <ArrowRight className="h-3 w-3" />
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
