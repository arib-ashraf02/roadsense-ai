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
  Check,
  X,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
    <div className="space-y-8">
      {/* Officer Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
              Municipal Officer Command
            </h1>
            <Badge variant="outline" className="border-purple-300 bg-purple-50 text-purple-700">
              Ward Authority
            </Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Triage AI-detected road defects, manage work orders, and verify field repairs.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/officer/complaints">
            <Button variant="outline" size="sm" className="gap-1.5">
              <ClipboardList className="h-4 w-4" /> Triage Queue
            </Button>
          </Link>
          <Link href="/officer/tickets">
            <Button size="sm" className="gap-1.5 bg-blue-600 hover:bg-blue-700">
              <Wrench className="h-4 w-4" /> Work Orders
            </Button>
          </Link>
        </div>
      </div>

      {/* Real-time Telemetry Grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-slate-500">Total Detections</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{overview?.total_potholes ?? 0}</div>
            <p className="text-xs text-slate-400 mt-1">AI detected surface defects</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-slate-500">Unreviewed Grievances</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{overview?.complaints?.open ?? 0}</div>
            <p className="text-xs text-slate-400 mt-1">Citizen reports pending triage</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-slate-500">Active Work Orders</CardTitle>
            <Wrench className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{overview?.tickets?.pending ?? 0}</div>
            <p className="text-xs text-slate-400 mt-1">Assigned to maintenance teams</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-slate-500">Resolution Rate</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {overview?.complaints?.resolution_rate_pct ?? 0}%
            </div>
            <p className="text-xs text-slate-400 mt-1">Verified repairs closed</p>
          </CardContent>
        </Card>
      </div>

      {/* Immediate Triage Queue */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Priority Triage Queue</CardTitle>
            <CardDescription>Review citizen submissions, check spatial duplicates, and dispatch tickets</CardDescription>
          </div>
          <Link href="/officer/complaints">
            <Button variant="ghost" size="sm" className="gap-1 text-xs">
              View All <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-sm text-slate-500">Loading complaints...</div>
          ) : pendingComplaints.length === 0 ? (
            <div className="py-10 text-center">
              <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-400" />
              <p className="mt-2 text-sm font-semibold text-slate-700">Triage Queue Clear!</p>
              <p className="text-xs text-slate-400 mt-0.5">All received citizen grievances have been reviewed.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {pendingComplaints.slice(0, 5).map((c) => (
                <div key={c.id} className="flex flex-col gap-3 py-3.5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-900">{c.title}</p>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-slate-400" />
                        {c.address_text || `${c.latitude.toFixed(4)}, ${c.longitude.toFixed(4)}`}
                      </span>
                      <span>•</span>
                      <span>{new Date(c.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/officer/complaints`}>
                      <Button size="sm" variant="outline" className="text-xs">
                        Review & Dispatch
                      </Button>
                    </Link>
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
