"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Bell,
  CheckCircle,
  Clock,
  Check,
  AlertTriangle,
  FileText,
  Wrench,
  Sparkles,
} from "lucide-react";
import { EmptyStateIllustration } from "@/components/illustrations/EmptyStateIllustration";

export default function NotificationsPage() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifs = async () => {
    if (!session?.accessToken) {
      setLoading(false);
      return;
    }
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";
      const res = await fetch(`${apiUrl}/notifications/`, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      if (res.ok) {
        setNotifications(await res.json());
      }
    } catch (e) {
      console.error("Failed to load notifications:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, [session]);

  const markAsRead = async (id) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";
      await fetch(`${apiUrl}/notifications/${id}/read`, {
        method: "PATCH",
        headers: session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {},
      });
      await fetchNotifs();
    } catch (e) {
      console.error("Failed to mark as read:", e);
    }
  };

  const markAllRead = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";
      await fetch(`${apiUrl}/notifications/read-all`, {
        method: "POST",
        headers: session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {},
      });
      await fetchNotifs();
    } catch (e) {
      console.error("Failed to mark all read:", e);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1 text-xs font-bold text-foreground mb-2">
            <span className="h-2 w-2 rounded-full bg-primary" />
            <span>Activity Feed</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">
            Notifications & Updates
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Real-time status updates on submitted grievances, ticket assignments, and repair sign-offs.
          </p>
        </div>
        <button
          onClick={markAllRead}
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-xs font-bold text-foreground shadow-xs hover:bg-accent transition"
        >
          <Check className="h-3.5 w-3.5 text-primary" />
          <span>Mark All Read</span>
        </button>
      </div>

      <div className="editorial-card p-0 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs font-semibold text-muted-foreground">
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <EmptyStateIllustration
            title="All Caught Up!"
            subtitle="You have zero unread municipal notifications."
          />
        ) : (
          <div className="divide-y divide-border">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`flex items-start justify-between p-5 transition-colors ${
                  n.is_read ? "bg-card" : "bg-primary/5"
                }`}
              >
                <div className="space-y-1 max-w-xl">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-foreground">{n.title}</h4>
                    {!n.is_read && (
                      <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{n.message}</p>
                  <p className="text-[10px] text-muted-foreground/80 font-mono">
                    {n.created_at ? new Date(n.created_at).toLocaleString() : ""}
                  </p>
                </div>

                {!n.is_read && (
                  <button
                    onClick={() => markAsRead(n.id)}
                    className="rounded-full px-3 py-1 text-xs font-bold text-primary hover:bg-primary/10 transition"
                  >
                    Mark read
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
