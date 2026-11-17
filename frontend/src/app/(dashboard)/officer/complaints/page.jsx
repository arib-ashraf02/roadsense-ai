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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export default function OfficerComplaintsPage() {
  const { data: session } = useSession();
  const [complaints, setComplaints] = useState([]);
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchComplaints = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";
      const res = await fetch(`${apiUrl}/complaints/`, {
        headers: session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {},
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
    if (search && !c.title.toLowerCase().includes(search.toLowerCase()) && !c.address_text?.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
          Citizen Complaint Triage Board
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Review incoming grievances, verify AI detection severity, and dispatch official work orders.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {["ALL", "SUBMITTED", "TRIAGED", "IN_PROGRESS", "RESOLVED", "REJECTED"].map((st) => (
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
            placeholder="Search address or title..."
            className="pl-9 h-9 text-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Complaints Table Card */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 text-center text-sm text-slate-500">Loading complaints...</div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <FileText className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-2 text-sm font-semibold text-slate-700">No grievances matching filter</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filtered.map((item) => (
                <div key={item.id} className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="space-y-1.5 max-w-2xl">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 text-sm">{item.title}</span>
                      <Badge
                        variant={
                          item.status === "RESOLVED"
                            ? "success"
                            : item.status === "SUBMITTED"
                            ? "warning"
                            : item.status === "REJECTED"
                            ? "destructive"
                            : "default"
                        }
                        className="text-[10px]"
                      >
                        {item.status}
                      </Badge>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">{item.description}</p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-slate-400" />
                        {item.address_text || `${item.latitude.toFixed(4)}, ${item.longitude.toFixed(4)}`}
                      </span>
                      <span>•</span>
                      <span>{new Date(item.created_at).toLocaleString()}</span>
                      {item.ticket_id && (
                        <span className="rounded bg-blue-50 px-2 py-0.5 font-mono text-[10px] text-blue-700 border border-blue-200">
                          Work Order Linked
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions for Officer */}
                  <div className="flex items-center gap-2">
                    {item.status === "SUBMITTED" && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleApprove(item)}
                          disabled={actionLoading === item.id}
                          className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-xs"
                        >
                          <Check className="h-3.5 w-3.5" />
                          Approve & Ticket
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReject(item.id)}
                          disabled={actionLoading === item.id}
                          className="gap-1.5 text-rose-600 hover:bg-rose-50 border-rose-200 text-xs"
                        >
                          <X className="h-3.5 w-3.5" />
                          Reject
                        </Button>
                      </>
                    )}
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
