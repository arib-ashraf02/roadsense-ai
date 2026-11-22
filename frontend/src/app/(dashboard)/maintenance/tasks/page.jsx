"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Wrench,
  MapPin,
  Calendar,
  Camera,
  Play,
  CheckCircle,
  ExternalLink,
  Navigation,
} from "lucide-react";
import { EmptyStateIllustration } from "@/components/illustrations/EmptyStateIllustration";

export default function MaintenanceTasksPage() {
  const { data: session } = useSession();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchTasks = async () => {
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
        setTasks(await res.json());
      }
    } catch (e) {
      console.error("Error loading tasks:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [session]);

  const updateStatus = async (taskId, newStatus) => {
    setUpdatingId(taskId);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";
      await fetch(`${apiUrl}/tickets/${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {}),
        },
        body: JSON.stringify({ status: newStatus }),
      });
      await fetchTasks();
    } catch (e) {
      console.error("Failed to update status:", e);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-bold text-foreground mb-2">
          <span className="h-2 w-2 rounded-full bg-primary" />
          <span>Active Field Queue</span>
        </div>
        <h1 className="text-3xl font-black tracking-tight text-foreground">
          Field Repair Work Queue
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Select a work order, update field status to 'In Repair', and upload after-repair proof for officer sign-off.
        </p>
      </div>

      <div className="editorial-card p-0 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs font-semibold text-muted-foreground">
            Loading work orders...
          </div>
        ) : tasks.length === 0 ? (
          <EmptyStateIllustration
            title="No Active Repair Tasks"
            subtitle="Your crew has completed all assigned municipal road work orders."
          />
        ) : (
          <div className="divide-y divide-border">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="flex flex-col lg:flex-row lg:items-center lg:justify-between p-5 gap-4 hover:bg-accent/20 transition-colors"
              >
                <div className="space-y-1.5 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-mono text-xs font-bold text-primary">
                      {task.ticket_number}
                    </span>
                    <h4 className="font-bold text-sm text-foreground">{task.title}</h4>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                        task.priority === "CRITICAL"
                          ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                          : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                      }`}
                    >
                      {task.priority}
                    </span>
                    <span className="rounded-full border border-border bg-card px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                      {task.status}
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">{task.description}</p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-0.5">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-primary" />
                      {Number(task.latitude).toFixed(4)}, {Number(task.longitude).toFixed(4)}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(task.created_at).toLocaleDateString()}
                    </span>
                    <a
                      href={`https://maps.google.com/?q=${task.latitude},${task.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary font-bold hover:underline"
                    >
                      <Navigation className="h-3 w-3" />
                      <span>GPS Directions</span>
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {task.status === "OPEN" || task.status === "ASSIGNED" ? (
                    <button
                      onClick={() => updateStatus(task.id, "IN_REPAIR")}
                      disabled={updatingId === task.id}
                      className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-sm hover:opacity-90 transition"
                    >
                      <Play className="h-3.5 w-3.5" />
                      <span>Start Repair Work</span>
                    </button>
                  ) : null}

                  {task.status === "IN_REPAIR" ? (
                    <Link
                      href={`/maintenance/verify/${task.id}`}
                      className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition"
                    >
                      <Camera className="h-3.5 w-3.5" />
                      <span>Submit Verification Proof</span>
                    </Link>
                  ) : null}

                  {task.status === "CLOSED" ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle className="h-4 w-4" />
                      <span>Verified & Closed</span>
                    </span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
