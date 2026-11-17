"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Wrench,
  MapPin,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Check,
  X,
  ShieldCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function TicketDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: session } = useSession();

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    async function loadTicket() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";
        const res = await fetch(`${apiUrl}/tickets/${id}`, {
          headers: session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {},
        });
        if (res.ok) {
          setTicket(await res.json());
        }
      } catch (e) {
        console.error("Failed to load ticket:", e);
      } finally {
        setLoading(false);
      }
    }
    if (id) loadTicket();
  }, [id, session]);

  const handleSignOff = async (approved) => {
    setActionLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";
      await fetch(`${apiUrl}/tickets/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {}),
        },
        body: JSON.stringify({
          status: approved ? "CLOSED" : "IN_REPAIR",
        }),
      });
      router.push("/officer/tickets");
    } catch (e) {
      console.error("Failed to sign off ticket:", e);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-sm text-slate-500">Loading work order details...</div>;
  }

  if (!ticket) {
    return (
      <div className="py-12 text-center space-y-3">
        <p className="text-sm font-semibold text-slate-800">Work order not found.</p>
        <Link href="/officer/tickets">
          <Button size="sm" variant="outline">Back to Tickets</Button>
        </Link>
      </div>
    );
  }

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
            <span className="font-mono text-sm font-bold text-blue-700">{ticket.ticket_number}</span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{ticket.title}</h1>
            <Badge variant="outline">{ticket.status}</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Ward: {ticket.ward_identifier || "Ward 4"} • Created {new Date(ticket.created_at).toLocaleString()}
          </p>
        </div>

        {ticket.status === "AWAITING_VERIFICATION" && (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => handleSignOff(true)}
              disabled={actionLoading}
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold"
            >
              <Check className="h-4 w-4" /> Approve & Close Ticket
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleSignOff(false)}
              disabled={actionLoading}
              className="gap-1.5 text-rose-600 border-rose-200 hover:bg-rose-50 text-xs"
            >
              <X className="h-4 w-4" /> Reject (Rework)
            </Button>
          </div>
        )}
      </div>

      {/* Grid */}
      <div className="grid gap-6 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Defect Coordinates & SLA</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs text-slate-600">
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-800">Coordinates</p>
                <p className="font-mono text-slate-500">
                  {ticket.latitude.toFixed(6)}, {ticket.longitude.toFixed(6)}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-1">
              <p className="font-semibold text-slate-800">Priority & Deadlines</p>
              <p>Priority Grade: <strong>{ticket.priority}</strong></p>
              {ticket.sla_deadline && (
                <p className="text-amber-700">
                  SLA Target: {new Date(ticket.sla_deadline).toLocaleString()}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Work Order Description</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs text-slate-600">
            <p className="leading-relaxed">{ticket.description || "No additional notes logged."}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
