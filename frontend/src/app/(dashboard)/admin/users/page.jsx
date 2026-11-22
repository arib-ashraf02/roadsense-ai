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
import { EmptyStateIllustration } from "@/components/illustrations/EmptyStateIllustration";

export default function AdminUsersPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchUsers = async () => {
    if (!session?.accessToken) {
      setLoading(false);
      return;
    }
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";
      const res = await fetch(`${apiUrl}/users/`, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
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
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1 text-xs font-bold text-foreground mb-2">
            <span className="h-2 w-2 rounded-full bg-primary" />
            <span>Identity Governance</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">
            User Accounts & Role Governance
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Manage municipal officers, maintenance leads, citizens, and administrative access.
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <input
            placeholder="Search name or email..."
            className="w-full rounded-full border border-border bg-card pl-9 pr-4 py-2 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="editorial-card p-0 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs font-semibold text-muted-foreground">
            Loading user accounts...
          </div>
        ) : filtered.length === 0 ? (
          <EmptyStateIllustration
            title="No Users Found"
            subtitle="No municipal accounts matching your query."
          />
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((u) => (
              <div
                key={u.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-5 gap-4 hover:bg-accent/20 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <h4 className="font-bold text-sm text-foreground">
                      {u.fullName || u.full_name || u.email}
                    </h4>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                        u.role === "ADMIN"
                          ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20"
                          : u.role === "OFFICER"
                          ? "bg-primary/10 text-primary border border-primary/20"
                          : u.role === "MAINTENANCE"
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                          : "bg-muted text-muted-foreground border border-border"
                      }`}
                    >
                      {u.role}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{u.email}</p>
                  <p className="text-[11px] text-muted-foreground/80 font-mono">
                    Ward: {u.wardId || u.ward_id || "Global"}
                  </p>
                </div>

                {/* Role Switcher */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-muted-foreground mr-1">Role:</span>
                  {["CITIZEN", "MAINTENANCE", "OFFICER", "ADMIN"].map((r) => (
                    <button
                      key={r}
                      onClick={() => changeRole(u.id, r)}
                      disabled={updatingId === u.id || u.role === r}
                      className={`rounded-full px-3 py-1 text-[10px] font-bold transition-all ${
                        u.role === r
                          ? "bg-primary text-primary-foreground shadow-xs"
                          : "border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-accent"
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
      </div>
    </div>
  );
}
