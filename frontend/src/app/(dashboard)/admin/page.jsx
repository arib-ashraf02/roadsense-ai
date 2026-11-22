"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  ShieldAlert,
  Users,
  Server,
  Database,
  Activity,
  ArrowRight,
  RefreshCw,
  Cpu,
  Layers,
  Sparkles,
} from "lucide-react";

export default function AdminPage() {
  const { data: session } = useSession();
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAdminData() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";
        const headers = session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {};

        const [overRes, usersRes] = await Promise.all([
          fetch(`${apiUrl}/analytics/overview`),
          fetch(`${apiUrl}/users/`, { headers }),
        ]);

        if (overRes.ok) setOverview(await overRes.json());
        if (usersRes.ok) setUsers(await usersRes.json());
      } catch (e) {
        console.error("Admin data load error:", e);
      } finally {
        setLoading(false);
      }
    }
    loadAdminData();
  }, [session]);

  return (
    <div className="space-y-8 pb-12">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1 text-xs font-bold text-foreground mb-2">
          <span className="h-2 w-2 rounded-full bg-primary" />
          <span>Root Governance</span>
        </div>
        <h1 className="text-3xl font-black tracking-tight text-foreground">
          System Administration Console
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Oversee platform users, system microservices, and spatial deduplication parameters.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="editorial-card space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Registered Users
          </span>
          <div className="text-3xl font-black text-foreground">{users.length}</div>
          <p className="text-[11px] text-muted-foreground">Active municipal accounts</p>
        </div>

        <div className="editorial-card space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Database Engine
          </span>
          <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
            Active
          </div>
          <p className="text-[11px] text-muted-foreground">11 relational tables connected</p>
        </div>

        <div className="editorial-card space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            AI Vision Engine
          </span>
          <div className="text-3xl font-black text-primary">
            YOLOv8
          </div>
          <p className="text-[11px] text-muted-foreground">RDD2022 trained model weights</p>
        </div>

        <div className="editorial-card space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Spatial Buffer
          </span>
          <div className="text-3xl font-black text-foreground">15 meters</div>
          <p className="text-[11px] text-muted-foreground">DBSCAN deduplication radius</p>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="editorial-card-interactive flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Users className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-base text-foreground">User Role Governance</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Assign and modify roles: Citizen, Municipal Officer, Maintenance Team Lead, Administrator.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/admin/users"
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-sm hover:opacity-90 transition"
            >
              <span>Manage Accounts</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        <div className="editorial-card-interactive flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Activity className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-base text-foreground">GIS Map & Ward Heatmaps</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Inspect citywide defect clustering, spatial duplicate groups, and ward risk index.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/map"
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-5 py-2.5 text-xs font-bold text-foreground shadow-xs hover:bg-accent transition"
            >
              <span>Inspect GIS Map</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
