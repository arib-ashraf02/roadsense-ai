"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  HardHat,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MapPin,
  Camera,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { EmptyStateIllustration } from "@/components/illustrations/EmptyStateIllustration";

export default function MaintenanceDashboard() {
  const { data: session } = useSession();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTasks() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";
        const res = await fetch(`${apiUrl}/tickets/?assigned_to_me=true`, {
          headers: session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {},
        });
        if (res.ok) {
          setTasks(await res.json());
        }
      } catch (e) {
        console.error("Failed to load maintenance tasks:", e);
      } finally {
        setLoading(false);
      }
    }
    loadTasks();
  }, [session]);

  const criticalTasks = tasks.filter((t) => t.priority === "CRITICAL" && t.status !== "CLOSED");
  const inRepairTasks = tasks.filter((t) => t.status === "IN_REPAIR");
  const completedTasks = tasks.filter((t) => t.status === "CLOSED");

  return (
    <div className="space-y-8 pb-12">
      {/* Banner */}
      <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-accent/60 px-3.5 py-1 text-xs font-bold text-foreground">
              <span className="h-2 w-2 rounded-full bg-primary" />
              <span>Field Engineering Works</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
              Road Maintenance Team Operations
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Navigate to assigned coordinates, mark work progress, and submit after-repair photographs for forensic AI validation.
            </p>
          </div>
          <Link
            href="/maintenance/tasks"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3.5 text-xs font-bold text-primary-foreground shadow-md shadow-primary/20 hover:opacity-95 transition-all duration-200 hover:-translate-y-0.5 shrink-0"
          >
            <Wrench className="h-4 w-4" />
            <span>Open Field Queue</span>
          </Link>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="editorial-card space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold uppercase tracking-wider">Critical Hazards</span>
            <AlertTriangle className="h-4 w-4 text-rose-500" />
          </div>
          <div className="text-3xl font-black text-rose-600 dark:text-rose-400">
            {criticalTasks.length}
          </div>
          <p className="text-[11px] text-muted-foreground">Immediate asphalt repair required</p>
        </div>

        <div className="editorial-card space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold uppercase tracking-wider">Under Active Repair</span>
            <Clock className="h-4 w-4 text-primary" />
          </div>
          <div className="text-3xl font-black text-primary">{inRepairTasks.length}</div>
          <p className="text-[11px] text-muted-foreground">Crew actively on site</p>
        </div>

        <div className="editorial-card space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold uppercase tracking-wider">Verified & Closed</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-3xl font-black text-foreground">{completedTasks.length}</div>
          <p className="text-[11px] text-muted-foreground">AI repair confidence approved</p>
        </div>
      </div>

      {/* Recent Assigned Repairs */}
      <div className="editorial-card space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-foreground">Priority Work Orders</h3>
            <p className="text-xs text-muted-foreground">Assigned road defect coordinates requiring field crew action</p>
          </div>
          <Link
            href="/maintenance/tasks"
            className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
          >
            <span>View All Tasks</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs font-semibold text-muted-foreground">
            Loading work orders...
          </div>
        ) : tasks.length === 0 ? (
          <EmptyStateIllustration
            title="Work Queue Clear"
            subtitle="No urgent repair tasks are currently assigned to your team lead."
          />
        ) : (
          <div className="divide-y divide-border">
            {tasks.slice(0, 5).map((t) => (
              <div
                key={t.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between py-4 gap-4 hover:bg-accent/20 rounded-xl px-2 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-primary">{t.ticket_number}</span>
                    <h4 className="font-bold text-sm text-foreground">{t.title}</h4>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                        t.priority === "CRITICAL"
                          ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                          : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                      }`}
                    >
                      {t.priority}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-primary" />
                      {Number(t.latitude).toFixed(4)}, {Number(t.longitude).toFixed(4)}
                    </span>
                    <span>•</span>
                    <span>{new Date(t.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/maintenance/verify/${t.id}`}
                    className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-4 py-2 text-xs font-bold text-primary hover:bg-primary hover:text-primary-foreground transition-all"
                  >
                    <Camera className="h-3.5 w-3.5" />
                    <span>Upload Proof</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
