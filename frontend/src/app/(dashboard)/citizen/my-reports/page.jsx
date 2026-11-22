"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  FileText,
  MapPin,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  PlusCircle,
  ExternalLink,
  Filter,
} from "lucide-react";
import { EmptyStateIllustration } from "@/components/illustrations/EmptyStateIllustration";

export default function MyReportsPage() {
  const { data: session } = useSession();
  const [complaints, setComplaints] = useState([]);
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReports() {
      if (!session?.accessToken) {
        setLoading(false);
        return;
      }
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";
        const res = await fetch(`${apiUrl}/complaints/?mine_only=true`, {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          setComplaints(data);
        }
      } catch (e) {
        console.error("Failed to load complaints:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchReports();
  }, [session]);

  const filtered = complaints.filter((c) => {
    if (filter === "ALL") return true;
    return c.status === filter;
  });

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-bold text-foreground mb-2">
            <span className="h-2 w-2 rounded-full bg-primary" />
            <span>Civic Records</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">
            My Road Grievances
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Track real-time municipal triage, work order assignment, and repair verification.
          </p>
        </div>
        <Link
          href="/citizen/report"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-sm hover:opacity-90 transition-all"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Report New Pothole</span>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
        {["ALL", "SUBMITTED", "TRIAGED", "IN_PROGRESS", "RESOLVED"].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
              filter === status
                ? "bg-primary text-primary-foreground shadow-sm"
                : "border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-accent"
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Reports List */}
      <div className="editorial-card p-0 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs font-semibold text-muted-foreground">
            Loading grievances...
          </div>
        ) : filtered.length === 0 ? (
          <EmptyStateIllustration
            title="No Grievances in this Category"
            subtitle="Try switching filters or submit a new pothole report to help improve municipal infrastructure."
          />
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-5 gap-4 hover:bg-accent/20 transition-colors"
              >
                <div className="space-y-1.5 max-w-2xl">
                  <div className="flex items-center gap-2.5">
                    <h4 className="font-bold text-sm text-foreground">{item.title}</h4>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${
                        item.status === "RESOLVED"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                          : item.status === "SUBMITTED"
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                          : "bg-primary/10 text-primary border border-primary/20"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-1">{item.description}</p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-primary" />
                      {item.address_text || `${Number(item.latitude).toFixed(4)}, ${Number(item.longitude).toFixed(4)}`}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                    {item.ticket_id && (
                      <span className="rounded-md bg-accent px-2 py-0.5 font-mono text-[10px] text-accent-foreground font-bold">
                        Ticket #{item.ticket_id.slice(0, 8)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/citizen/report/${item.id}`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-xs font-bold text-foreground shadow-xs hover:bg-accent transition"
                  >
                    <span>View Inspection</span>
                    <ExternalLink className="h-3 w-3" />
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
