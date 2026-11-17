"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  HardHat,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MapPin,
  Camera,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function MaintenanceDashboard() {
  const { data: session } = useSession();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTasks() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";
        const res = await fetch(`${apiUrl}/tickets/?assigned_to_me=true`, {
          headers: session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {},
        });
        if (res.ok) {
          setTasks(await res.json());
        }
      } catch (e) {
        console.error("Failed to load maintenance tasks:", e);
      } finally {
        setLoading(false);
      }
    }
    loadTasks();
  }, [session]);

  const criticalTasks = tasks.filter((t) => t.priority === "CRITICAL" && t.status !== "CLOSED");
  const inRepairTasks = tasks.filter((t) => t.status === "IN_REPAIR");
  const completedTasks = tasks.filter((t) => t.status === "CLOSED");

  return (
    <div className="space-y-8">
      {/* Banner */}
      <div className="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-500 to-amber-700 p-6 text-white shadow-sm md:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-xs">
              Field Maintenance Queue
            </span>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              Road Maintenance Team Operations
            </h1>
            <p className="max-w-xl text-sm text-amber-50">
              Navigate to assigned coordinates, mark work progress, and submit after-repair photos for AI validation.
            </p>
          </div>
          <Link href="/maintenance/tasks">
            <Button size="lg" className="bg-white text-amber-800 hover:bg-amber-50 shadow-md font-semibold gap-2">
              <Wrench className="h-5 w-5" />
              View Task Queue
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Critical Hazards</CardTitle>
            <AlertTriangle className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{criticalTasks.length}</div>
            <p className="text-xs text-rose-600 mt-1 font-medium">Immediate road closure / patch</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Actively Under Repair</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{inRepairTasks.length}</div>
            <p className="text-xs text-slate-500 mt-1">Asphalt work in progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Completed & Verified</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{completedTasks.length}</div>
            <p className="text-xs text-slate-500 mt-1">Closed by municipal officer</p>
          </CardContent>
        </Card>
      </div>

      {/* Assigned Tasks Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Assigned Work Queue</CardTitle>
            <CardDescription>Click a task to navigate to location or submit repair proof</CardDescription>
          </div>
          <Link href="/maintenance/tasks">
            <Button variant="ghost" size="sm" className="gap-1 text-xs">
              View All <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-sm text-slate-500">Loading assigned tasks...</div>
          ) : tasks.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-500">
              <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500" />
              <p className="mt-2 font-medium text-slate-800">No pending work orders assigned to your team.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {tasks.slice(0, 5).map((t) => (
                <div key={t.id} className="flex flex-col gap-3 py-3.5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-blue-700">{t.ticket_number}</span>
                      <span className="font-semibold text-slate-900 text-sm">{t.title}</span>
                      <Badge variant={t.priority === "CRITICAL" ? "destructive" : "warning"} className="text-[10px]">
                        {t.priority}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      <span>{t.latitude.toFixed(4)}, {t.longitude.toFixed(4)}</span>
                    </div>
                  </div>

                  <Link href={`/maintenance/verify/${t.id}`}>
                    <Button size="sm" className="gap-1.5 bg-amber-600 hover:bg-amber-700 text-xs">
                      <Camera className="h-3.5 w-3.5" />
                      Submit After Photo
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
