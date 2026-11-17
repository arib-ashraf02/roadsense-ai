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
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function MaintenanceTasksPage() {
  const { data: session } = useSession();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchTasks = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";
      const res = await fetch(`${apiUrl}/tickets/`, {
        headers: session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {},
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
          Field Repair Work Queue
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Select a work order, update field status to 'In Repair', and upload after-repair proof for officer sign-off.
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 text-center text-sm text-slate-500">Loading work orders...</div>
          ) : tasks.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-sm">
              <Wrench className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-2 font-medium text-slate-800">No repair tasks in your queue.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {tasks.map((task) => (
                <div key={task.id} className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="space-y-1.5 max-w-2xl">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-blue-700">{task.ticket_number}</span>
                      <span className="font-semibold text-slate-900 text-sm">{task.title}</span>
                      <Badge variant={task.priority === "CRITICAL" ? "destructive" : "warning"} className="text-[10px]">
                        {task.priority}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        {task.status}
                      </Badge>
                    </div>

                    <p className="text-xs text-slate-600">{task.description}</p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${task.latitude},${task.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-blue-600 hover:underline"
                      >
                        <MapPin className="h-3 w-3" />
                        Navigate ({task.latitude.toFixed(4)}, {task.longitude.toFixed(4)})
                      </a>
                      <span>•</span>
                      <span>Target: {task.ward_identifier || "Ward 4"}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {task.status === "OPEN" || task.status === "ASSIGNED" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatus(task.id, "IN_REPAIR")}
                        disabled={updatingId === task.id}
                        className="gap-1.5 text-xs text-amber-700 border-amber-300 bg-amber-50 hover:bg-amber-100"
                      >
                        <Play className="h-3.5 w-3.5" />
                        Start Repair
                      </Button>
                    ) : null}

                    <Link href={`/maintenance/verify/${task.id}`}>
                      <Button size="sm" className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-xs">
                        <Camera className="h-3.5 w-3.5" />
                        Submit Repair Evidence
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
