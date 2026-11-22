"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  FileText,
  MapPin,
  Calendar,
  Check,
  X,
  Wrench,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
} from "lucide-react";
import { EmptyStateIllustration } from "@/components/illustrations/EmptyStateIllustration";

export default function OfficerComplaintsPage() {
  const { data: session } = useSession();
  const [complaints, setComplaints] = useState([]);
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchComplaints = async () => {
    if (!session?.accessToken) {
      setLoading(false);
      return;
    }
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";
      const res = await fetch(`${apiUrl}/complaints/`, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      if (res.ok) {
        setComplaints(await res.json());
      }
    } catch (e) {
      console.error("Error loading complaints:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [session]);

  // Approve & Generate Ticket
  const handleApprove = async (complaint) => {
    setActionLoading(complaint.id);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";
      const headers = {
        "Content-Type": "application/json",
        ...(session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {}),
      };

      // 1. Create Maintenance Ticket
      const tktRes = await fetch(`${apiUrl}/tickets/`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          title: `Repair: ${complaint.title}`,
          description: complaint.description || "Generated from citizen grievance report.",
          priority: "HIGH",
          latitude: complaint.latitude,
          longitude: complaint.longitude,
          ward_identifier: "WARD-04",
        }),
      });

      if (tktRes.ok) {
        const ticket = await tktRes.json();
        // 2. Update complaint status to TRIAGED with ticket_id
        await fetch(`${apiUrl}/complaints/${complaint.id}`, {
          method: "PATCH",
          headers,
          body: JSON.stringify({
            status: "TRIAGED",
            ticket_id: ticket.id,
          }),
        });
        await fetchComplaints();
      }
    } catch (e) {
      console.error("Failed to approve complaint:", e);
    } finally {
      setActionLoading(null);
    }
  };

  // Reject complaint
  const handleReject = async (complaintId) => {
    setActionLoading(complaintId);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";
      await fetch(`${apiUrl}/complaints/${complaintId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {}),
        },
        body: JSON.stringify({ status: "REJECTED" }),
      });
      await fetchComplaints();
    } catch (e) {
      console.error("Failed to reject complaint:", e);
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = complaints.filter((c) => {
    if (filter !== "ALL" && c.status !== filter) return false;
    if (
      search &&
      !c.title.toLowerCase().includes(search.toLowerCase()) &&
      !c.address_text?.toLowerCase().includes(search.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-bold text-foreground mb-2">
          <span className="h-2 w-2 rounded-full bg-primary" />
          <span>Grievance Triage</span>
        </div>
        <h1 className="text-3xl font-black tracking-tight text-foreground">
          Citizen Complaint Triage Board
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Review incoming grievances, verify AI detection severity, and dispatch official work orders.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {["ALL", "SUBMITTED", "TRIAGED", "IN_PROGRESS", "RESOLVED", "REJECTED"].map((st) => (
            <button
              key={st}
              onClick={() => setFilter(st)}
              className={`rounded-full px-3.5 py-1 text-xs font-bold transition-all ${
                filter === st
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <input
            placeholder="Search address or title..."
            className="w-full rounded-full border border-border bg-card pl-9 pr-4 py-2 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Complaints Table Card */}
      <div className="editorial-card p-0 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs font-semibold text-muted-foreground">
            Loading complaints...
          </div>
        ) : filtered.length === 0 ? (
          <EmptyStateIllustration
            title="No Grievances Matching Filter"
            subtitle="Change filter parameters or wait for new citizen road defect submissions."
          />
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="flex flex-col lg:flex-row lg:items-center lg:justify-between p-5 gap-4 hover:bg-accent/20 transition-colors"
              >
                <div className="space-y-1.5 max-w-2xl">
                  <div className="flex items-center gap-2.5">
                    <h4 className="font-bold text-sm text-foreground">{item.title}</h4>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                        item.status === "RESOLVED"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                          : item.status === "SUBMITTED"
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                          : item.status === "REJECTED"
                          ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                          : "bg-primary/10 text-primary border border-primary/20"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-0.5">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-primary" />
                      {item.address_text || `${Number(item.latitude).toFixed(4)}, ${Number(item.longitude).toFixed(4)}`}
                    </span>
                    <span>•</span>
                    <span>{new Date(item.created_at).toLocaleString()}</span>
                    {item.ticket_id && (
                      <span className="rounded-md bg-accent px-2 py-0.5 font-mono text-[10px] text-accent-foreground font-bold">
                        Ticket Dispatched
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions for Officer */}
                <div className="flex items-center gap-2">
                  {item.status === "SUBMITTED" && (
                    <>
                      <button
                        onClick={() => handleApprove(item)}
                        disabled={actionLoading === item.id}
                        className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition"
                      >
                        <Check className="h-3.5 w-3.5" />
                        <span>Approve & Ticket</span>
                      </button>
                      <button
                        onClick={() => handleReject(item.id)}
                        disabled={actionLoading === item.id}
                        className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 transition"
                      >
                        <X className="h-3.5 w-3.5" />
                        <span>Reject</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
