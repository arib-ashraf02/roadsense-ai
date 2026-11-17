"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Users,
  Shield,
  HardHat,
  Search,
  CheckCircle,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export default function AdminUsersPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchUsers = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";
      const res = await fetch(`${apiUrl}/users/`, {
        headers: session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {},
      });
      if (res.ok) {
        setUsers(await res.json());
      }
    } catch (e) {
      console.error("Failed to load users:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [session]);

  const changeRole = async (userId, newRole) => {
    setUpdatingId(userId);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";
      const res = await fetch(`${apiUrl}/users/${userId}/role`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {}),
        },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        await fetchUsers();
      }
    } catch (e) {
      console.error("Failed to update user role:", e);
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = users.filter((u) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      (u.fullName || u.full_name || "").toLowerCase().includes(s) ||
      u.email.toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
            User Accounts & Role Governance
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage municipal officers, maintenance leads, citizens, and administrative access.
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search name or email..."
            className="pl-9 h-9 text-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 text-center text-sm text-slate-500">Loading user accounts...</div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-sm text-slate-500">No users found</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filtered.map((u) => (
                <div key={u.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 text-sm">
                        {u.fullName || u.full_name || u.email}
                      </span>
                      <Badge
                        variant={
                          u.role === "ADMIN"
                            ? "default"
                            : u.role === "OFFICER"
                            ? "warning"
                            : u.role === "MAINTENANCE"
                            ? "secondary"
                            : "outline"
                        }
                        className="text-[10px]"
                      >
                        {u.role}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500">{u.email}</p>
                    <p className="text-[11px] text-slate-400">Ward: {u.wardId || u.ward_id || "Global"}</p>
                  </div>

                  {/* Role Switcher */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Set Role:</span>
                    {["CITIZEN", "MAINTENANCE", "OFFICER", "ADMIN"].map((r) => (
                      <button
                        key={r}
                        onClick={() => changeRole(u.id, r)}
                        disabled={updatingId === u.id || u.role === r}
                        className={`rounded px-2 py-1 text-[10px] font-semibold transition ${
                          u.role === r
                            ? "bg-slate-900 text-white"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {r}
                      </button>
                    ))}
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
