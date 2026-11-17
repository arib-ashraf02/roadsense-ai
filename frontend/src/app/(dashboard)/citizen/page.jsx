"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  PlusCircle,
  FileText,
  MapPin,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white shadow-sm md:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-xs">
              Citizen Reporting Portal
            </span>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              Report Road Hazards, Help Repair Your City
            </h1>
            <p className="max-w-xl text-sm text-blue-100">
              Upload smartphone snapshots or dashcam videos. RoadSense AI extracts GPS metadata,
              detects potholes, eliminates duplicate reports, and creates municipal repair tickets.
            </p>
          </div>
          <Link href="/citizen/report">
            <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50 shadow-md gap-2 font-semibold">
              <PlusCircle className="h-5 w-5" />
              Report Pothole
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{submittedCount}</div>
            <p className="text-xs text-slate-500 mt-1">Submitted grievances awaiting triage</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">In Active Repair</CardTitle>
            <AlertTriangle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressCount}</div>
            <p className="text-xs text-slate-500 mt-1">Assigned to municipal field teams</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Repaired & Closed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resolvedCount}</div>
            <p className="text-xs text-slate-500 mt-1">Verified with AI after-photo inspection</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Submissions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">My Recent Grievances</CardTitle>
            <CardDescription>Track the lifecycle of your road complaints</CardDescription>
          </div>
          <Link href="/citizen/my-reports">
            <Button variant="ghost" size="sm" className="gap-1 text-xs">
              View All <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-sm text-slate-500">Loading your reports...</div>
          ) : complaints.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 py-12 text-center">
              <FileText className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-2 text-sm font-medium text-slate-700">No complaints reported yet</p>
              <p className="text-xs text-slate-500 mt-0.5">Notice a pothole in your neighborhood? Submit a photo to report it.</p>
              <Link href="/citizen/report" className="mt-4 inline-block">
                <Button size="sm" className="gap-1.5">
                  <PlusCircle className="h-4 w-4" />
                  Report Your First Pothole
                </Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {complaints.slice(0, 5).map((c) => (
                <div key={c.id} className="flex items-center justify-between py-3.5">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-slate-900">{c.title}</p>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-slate-400" />
                        {c.address_text || `${c.latitude.toFixed(4)}, ${c.longitude.toFixed(4)}`}
                      </span>
                      <span>•</span>
                      <span>{new Date(c.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <Badge
                    variant={
                      c.status === "RESOLVED"
                        ? "success"
                        : c.status === "SUBMITTED"
                        ? "warning"
                        : "default"
                    }
                  >
                    {c.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
