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
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
            System Administration Console
          </h1>
          <Badge variant="outline" className="border-purple-300 bg-purple-50 text-purple-700">
            Superuser
          </Badge>
        </div>
        <p className="text-sm text-slate-500 mt-1">
          Oversee platform users, system microservices, and spatial deduplication parameters.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-slate-500">Registered Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-slate-400 mt-1">Active municipal accounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-slate-500">Database Engine</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">Active</div>
            <p className="text-xs text-slate-400 mt-1">11 relational tables connected</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-slate-500">AI Vision Engine</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">YOLOv8 Ready</div>
            <p className="text-xs text-slate-400 mt-1">Batch inference pipeline</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-slate-500">Spatial Radius</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">12 meters</div>
            <p className="text-xs text-slate-400 mt-1">Deduplication buffer</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="hover:border-slate-300 transition">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">User Role Governance</CardTitle>
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <CardDescription>Assign and modify roles: Citizen, Officer, Maintenance, Admin</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/users">
              <Button size="sm" className="gap-1.5 text-xs bg-slate-900 hover:bg-slate-800">
                Manage Accounts <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:border-slate-300 transition">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">GIS Map & Ward Heatmaps</CardTitle>
              <Activity className="h-5 w-5 text-emerald-600" />
            </div>
            <CardDescription>Inspect citywide defect clustering and spatial duplicates</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/map">
              <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                Inspect GIS Map <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
