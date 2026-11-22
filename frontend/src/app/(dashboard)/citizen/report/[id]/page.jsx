"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  FileText,
  MapPin,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowLeft,
  Wrench,
  ShieldCheck,
  Compass,
} from "lucide-react";

export default function ComplaintDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: session } = useSession();

  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadComplaint() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";
        const res = await fetch(`${apiUrl}/complaints/${id}`, {
          headers: session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {},
        });
        if (res.ok) {
          setComplaint(await res.json());
        }
      } catch (e) {
        console.error("Failed to load complaint:", e);
      } finally {
        setLoading(false);
      }
    }
    if (id) loadComplaint();
  }, [id, session]);

  if (loading) {
    return (
      <div className="py-16 text-center text-xs font-semibold text-muted-foreground">
        Loading complaint telemetry...
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="editorial-card text-center py-12 space-y-4 max-w-md mx-auto">
        <p className="text-sm font-bold text-foreground">Complaint record not found.</p>
        <button
          onClick={() => router.push("/citizen/my-reports")}
          className="rounded-full bg-primary px-5 py-2 text-xs font-bold text-primary-foreground shadow-sm"
        >
          Back to Grievances
        </button>
      </div>
    );
  }

  const steps = [
    { label: "Submitted", status: "SUBMITTED", done: true },
    {
      label: "Triaged by Officer",
      status: "TRIAGED",
      done: ["TRIAGED", "IN_PROGRESS", "RESOLVED"].includes(complaint.status),
    },
    {
      label: "Work Order Dispatched",
      status: "IN_PROGRESS",
      done: ["IN_PROGRESS", "RESOLVED"].includes(complaint.status),
    },
    {
      label: "Repaired & Verified",
      status: "RESOLVED",
      done: complaint.status === "RESOLVED",
    },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-16">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-bold text-foreground shadow-xs hover:bg-accent transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to List</span>
        </button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black text-foreground">{complaint.title}</h1>
            <span
              className={`rounded-full px-3 py-0.5 text-[10px] font-black uppercase tracking-wider ${complaint.status === "RESOLVED"
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                : complaint.status === "SUBMITTED"
                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                  : "bg-primary/10 text-primary border border-primary/20"
                }`}
            >
              {complaint.status}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Logged on {new Date(complaint.created_at).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Lifecycle Progress Stepper */}
      <div className="editorial-card space-y-4">
        <h3 className="text-sm font-bold text-foreground">Grievance Lifecycle</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {steps.map((st, sIdx) => (
            <div
              key={sIdx}
              className={`rounded-2xl border p-3.5 space-y-1.5 transition-all ${st.done
                ? "border-primary/40 bg-primary/5 text-foreground"
                : "border-border bg-card text-muted-foreground opacity-60"
                }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-black ${st.done
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-muted text-muted-foreground"
                    }`}
                >
                  {st.done ? "✓" : sIdx + 1}
                </span>
                <span className="text-xs font-bold">{st.label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="editorial-card space-y-4">
          <h3 className="text-sm font-bold text-foreground">Spatial Telemetry</h3>
          <div className="space-y-3 text-xs text-muted-foreground">
            <div className="flex items-start gap-2.5">
              <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-foreground">Street Address / Landmark</p>
                <p className="mt-0.5">{complaint.address_text || "Coordinates Only"}</p>
                <p className="font-mono text-muted-foreground mt-1 text-[11px]">
                  {Number(complaint.latitude).toFixed(6)}, {Number(complaint.longitude).toFixed(6)}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-border space-y-1">
              <p className="font-bold text-foreground">Citizen Observations</p>
              <p className="leading-relaxed">{complaint.description || "No description provided."}</p>
            </div>
          </div>
        </div>

        <div className="editorial-card space-y-4">
          <h3 className="text-sm font-bold text-foreground">Municipal Work Order</h3>
          <div className="space-y-3 text-xs text-muted-foreground">
            {complaint.ticket_id ? (
              <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 space-y-2">
                <div className="flex items-center gap-2 text-primary font-bold">
                  <Wrench className="h-4 w-4" />
                  <span>Work Ticket #{complaint.ticket_id.slice(0, 8)}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Municipal road maintenance team assigned. Repairs will undergo AI photo verification.
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border border-border bg-card p-4 text-xs text-muted-foreground">
                Awaiting officer triage. Once dispatched, work order telemetry will update automatically.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
