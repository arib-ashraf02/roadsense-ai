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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export default function OfficerTicketsPage() {
  const { data: session } = useSession();
  const [tickets, setTickets] = useState([]);
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchTickets = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";
      const res = await fetch(`${apiUrl}/tickets/`, {
        headers: session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {},
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
    if (search && !t.title.toLowerCase().includes(search.toLowerCase()) && !t.ticket_number.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
          Municipal Work Orders & Maintenance Tickets
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Monitor road repair lifecycle, team dispatches, and SLA compliance.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {["ALL", "OPEN", "ASSIGNED", "IN_REPAIR", "AWAITING_VERIFICATION", "CLOSED"].map((st) => (
            <button
              key={st}
              onClick={() => setFilter(st)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                filter === st
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search ticket # or title..."
            className="pl-9 h-9 text-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Tickets List */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 text-center text-sm text-slate-500">Loading work orders...</div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <Wrench className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-2 text-sm font-semibold text-slate-700">No work orders matching filter</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filtered.map((ticket) => (
                <div key={ticket.id} className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="space-y-1.5 max-w-2xl">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-blue-700">{ticket.ticket_number}</span>
                      <span className="font-semibold text-slate-900 text-sm">{ticket.title}</span>
                      <Badge
                        variant={
                          ticket.priority === "CRITICAL"
                            ? "destructive"
                            : ticket.priority === "HIGH"
                            ? "warning"
                            : "outline"
                        }
                        className="text-[10px]"
                      >
                        {ticket.priority}
                      </Badge>
                      <Badge
                        variant={
                          ticket.status === "CLOSED"
                            ? "success"
                            : ticket.status === "AWAITING_VERIFICATION"
                            ? "warning"
                            : "default"
                        }
                        className="text-[10px]"
                      >
                        {ticket.status}
                      </Badge>
                    </div>

                    <p className="text-xs text-slate-600">{ticket.description}</p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-slate-400" />
                        {ticket.ward_identifier || "Ward 4"} ({ticket.latitude.toFixed(4)}, {ticket.longitude.toFixed(4)})
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-slate-400" />
                        {new Date(ticket.created_at).toLocaleDateString()}
                      </span>
                      {ticket.sla_deadline && (
                        <span className="flex items-center gap-1 text-amber-600 font-medium">
                          <Clock className="h-3 w-3" />
                          SLA Target: {new Date(ticket.sla_deadline).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
