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
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
    return <div className="py-12 text-center text-sm text-slate-500">Loading complaint details...</div>;
  }

  if (!complaint) {
    return (
      <div className="py-12 text-center space-y-3">
        <p className="text-sm font-semibold text-slate-800">Complaint not found.</p>
        <Link href="/citizen/my-reports">
          <Button size="sm" variant="outline">Back to My Grievances</Button>
        </Link>
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
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-1.5 text-xs">
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </Button>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{complaint.title}</h1>
            <Badge variant="outline">{complaint.status}</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Logged on {new Date(complaint.created_at).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Lifecycle Progress Stepper */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Grievance Lifecycle Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {steps.map((st, sIdx) => (
              <div key={sIdx} className="flex items-center gap-2">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                    st.done ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {st.done ? "✓" : sIdx + 1}
                </div>
                <span className={`text-xs font-medium ${st.done ? "text-slate-800" : "text-slate-400"}`}>
                  {st.label}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Details Grid */}
      <div className="grid gap-6 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Location & Context</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs text-slate-600">
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-800">Address / Coordinates</p>
                <p>{complaint.address_text || "Coordinates Only"}</p>
                <p className="font-mono text-slate-500 mt-0.5">
                  {complaint.latitude.toFixed(6)}, {complaint.longitude.toFixed(6)}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-1">
              <p className="font-semibold text-slate-800">Citizen Description</p>
              <p className="leading-relaxed">{complaint.description || "No description provided."}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Municipal Work Order</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs text-slate-600">
            {complaint.ticket_id ? (
              <div className="rounded-lg bg-blue-50/70 p-3.5 border border-blue-100 space-y-1.5">
                <div className="flex items-center gap-1.5 text-blue-700 font-semibold">
                  <Wrench className="h-4 w-4" />
                  <span>Assigned Work Order #{complaint.ticket_id.slice(0, 8)}</span>
                </div>
                <p className="text-slate-600 text-[11px]">
                  A municipal maintenance crew has been dispatched to repair this defect.
                </p>
              </div>
            ) : (
              <p className="text-slate-500">
                Awaiting officer review. When approved, a formal work order ticket will appear here.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
