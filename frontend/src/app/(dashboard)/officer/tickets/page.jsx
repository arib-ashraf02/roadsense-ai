"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Wrench,
  MapPin,
  Calendar,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Users,
  Search,
  Filter,
} from "lucide-react";
import { EmptyStateIllustration } from "@/components/illustrations/EmptyStateIllustration";

export default function OfficerTicketsPage() {
  const { data: session } = useSession();
  const [tickets, setTickets] = useState([]);
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchTickets = async () => {
    if (!session?.accessToken) {
      setLoading(false);
      return;
    }
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";
      const res = await fetch(`${apiUrl}/tickets/`, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      if (res.ok) {
        setTickets(await res.json());
      }
    } catch (e) {
      console.error("Error loading tickets:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [session]);

  const filtered = tickets.filter((t) => {
    if (filter !== "ALL" && t.status !== filter) return false;
    if (
      search &&
      !t.title.toLowerCase().includes(search.toLowerCase()) &&
      !t.ticket_number.toLowerCase().includes(search.toLowerCase())
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
          <span>Work Order Dispatch</span>
        </div>
        <h1 className="text-3xl font-black tracking-tight text-foreground">
          Municipal Work Orders & Repair Tickets
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Monitor road repair lifecycle, field team assignments, and municipal SLA compliance.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {["ALL", "OPEN", "ASSIGNED", "IN_REPAIR", "AWAITING_VERIFICATION", "CLOSED"].map((st) => (
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
            placeholder="Search ticket # or title..."
            className="w-full rounded-full border border-border bg-card pl-9 pr-4 py-2 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Tickets List */}
      <div className="editorial-card p-0 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs font-semibold text-muted-foreground">
            Loading work orders...
          </div>
        ) : filtered.length === 0 ? (
          <EmptyStateIllustration
            title="No Work Orders Matching Filter"
            subtitle="Change filter parameters or dispatch approved complaints from the triage board."
          />
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((ticket) => (
              <div
                key={ticket.id}
                className="flex flex-col lg:flex-row lg:items-center lg:justify-between p-5 gap-4 hover:bg-accent/20 transition-colors"
              >
                <div className="space-y-1.5 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-mono text-xs font-bold text-primary">
                      {ticket.ticket_number}
                    </span>
                    <h4 className="font-bold text-sm text-foreground">{ticket.title}</h4>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                        ticket.priority === "CRITICAL"
                          ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                          : ticket.priority === "HIGH"
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                          : "bg-muted text-muted-foreground border border-border"
                      }`}
                    >
                      {ticket.priority}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                        ticket.status === "CLOSED"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                          : ticket.status === "AWAITING_VERIFICATION"
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                          : "bg-primary/10 text-primary border border-primary/20"
                      }`}
                    >
                      {ticket.status}
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">{ticket.description}</p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-0.5">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-primary" />
                      {ticket.ward_identifier || "Ward 4"} ({Number(ticket.latitude).toFixed(4)}, {Number(ticket.longitude).toFixed(4)})
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(ticket.created_at).toLocaleDateString()}
                    </span>
                    {ticket.sla_deadline && (
                      <span className="flex items-center gap-1 text-primary font-bold">
                        <Clock className="h-3.5 w-3.5" />
                        SLA Target: {new Date(ticket.sla_deadline).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
