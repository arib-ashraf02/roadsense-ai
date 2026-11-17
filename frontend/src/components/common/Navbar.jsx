"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { Bell, LogOut, User, Menu, X, Compass, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function Navbar() {
  const { data: session } = useSession();
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    async function fetchUnread() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";
        const res = await fetch(`${apiUrl}/notifications/unread-count`);
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.unread_count || 0);
        }
      } catch (e) {
        // Ignored in offline mode
      }
    }
    fetchUnread();
  }, []);

  return (
    <header className="flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-6">
      {/* Mobile brand & toggle */}
      <div className="flex items-center gap-3 md:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
            <Compass className="h-5 w-5" />
          </div>
          <span className="font-bold text-slate-900 text-sm">RoadSense</span>
        </div>
      </div>

      {/* Desktop Breadcrumbs/Welcome */}
      <div className="hidden items-center gap-2 md:flex">
        <span className="text-sm font-semibold text-slate-800">
          Welcome, {session?.user?.name || session?.user?.email || "Citizen"}
        </span>
        <Badge variant="secondary" className="text-[11px] font-medium">
          {session?.user?.role || "CITIZEN"}
        </Badge>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3">
        {/* Public view shortcut */}
        <Link
          href="/"
          className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition"
        >
          <span>Live Demo Overview</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>

        {/* Notifications Icon */}
        <Link href="/notifications" className="relative p-2 text-slate-500 hover:text-slate-700 transition">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
              {unreadCount}
            </span>
          )}
        </Link>

        {/* User initials pill */}
        <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 py-1 pl-1 pr-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
            {(session?.user?.name || "U")[0].toUpperCase()}
          </div>
          <span className="hidden text-xs font-medium text-slate-700 sm:inline-block max-w-[120px] truncate">
            {session?.user?.name || session?.user?.email || "User"}
          </span>
        </div>

        {/* Sign out */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="gap-1.5 text-xs text-slate-600 hover:text-rose-600"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Logout</span>
        </Button>
      </div>
    </header>
  );
}
