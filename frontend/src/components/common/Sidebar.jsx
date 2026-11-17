"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Compass,
  LayoutDashboard,
  PlusCircle,
  FileText,
  MapPin,
  ClipboardList,
  Wrench,
  BarChart3,
  Users,
  Bot,
  ShieldAlert,
  HardHat,
  ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role || "CITIZEN";

  const getNavLinks = () => {
    const common = [
      { href: "/map", label: "GIS Heatmap", icon: MapPin },
      { href: "/analytics", label: "Analytics", icon: BarChart3 },
    ];

    if (role === "ADMIN") {
      return [
        { href: "/admin", label: "Admin Console", icon: LayoutDashboard },
        { href: "/admin/users", label: "User Management", icon: Users },
        { href: "/officer/complaints", label: "All Complaints", icon: FileText },
        { href: "/officer/tickets", label: "Work Orders", icon: ClipboardList },
        ...common,
      ];
    }

    if (role === "OFFICER") {
      return [
        { href: "/officer", label: "Officer Portal", icon: LayoutDashboard },
        { href: "/officer/complaints", label: "Triage Complaints", icon: FileText },
        { href: "/officer/tickets", label: "Tickets & Dispatch", icon: ClipboardList },
        ...common,
      ];
    }

    if (role === "MAINTENANCE") {
      return [
        { href: "/maintenance", label: "My Work Queue", icon: LayoutDashboard },
        { href: "/maintenance/tasks", label: "Assigned Repairs", icon: Wrench },
        ...common,
      ];
    }

    // Default: CITIZEN
    return [
      { href: "/citizen", label: "Dashboard", icon: LayoutDashboard },
      { href: "/citizen/report", label: "Report Pothole", icon: PlusCircle, highlight: true },
      { href: "/citizen/my-reports", label: "My Grievances", icon: FileText },
      ...common,
    ];
  };

  const navLinks = getNavLinks();

  return (
    <aside className="hidden w-64 flex-col border-r border-slate-200 bg-white md:flex">
      {/* Brand Header */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-100 px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-500/20">
          <Compass className="h-6 w-6" />
        </div>
        <div>
          <span className="font-bold text-slate-900">RoadSense AI</span>
          <span className="block text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
            Municipal Portal
          </span>
        </div>
      </div>

      {/* Role Pill */}
      <div className="px-6 py-4">
        <div className="flex items-center justify-between rounded-lg bg-slate-50 p-2.5 border border-slate-100">
          <div className="flex items-center gap-2">
            {role === "ADMIN" && <ShieldAlert className="h-4 w-4 text-purple-600" />}
            {role === "OFFICER" && <ClipboardList className="h-4 w-4 text-blue-600" />}
            {role === "MAINTENANCE" && <HardHat className="h-4 w-4 text-amber-600" />}
            {role === "CITIZEN" && <Users className="h-4 w-4 text-emerald-600" />}
            <span className="text-xs font-semibold text-slate-700">{role}</span>
          </div>
          <Badge variant="outline" className="text-[10px]">Active</Badge>
        </div>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 space-y-1 px-4 py-2">
        {navLinks.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? "bg-blue-50 text-blue-700 font-semibold shadow-xs"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`h-4 w-4 ${isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"}`} />
                <span>{item.label}</span>
              </div>
              {item.highlight ? (
                <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] text-white">New</span>
              ) : (
                <ChevronRight className={`h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100 ${isActive ? "opacity-100 text-blue-600" : "text-slate-300"}`} />
              )}
            </Link>
          );
        })}
      </nav>

      {/* AI Assistant shortcut */}
      <div className="p-4 border-t border-slate-100">
        <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50/60 p-3.5 border border-blue-100/60">
          <div className="flex items-center gap-2 text-blue-800">
            <Bot className="h-4 w-4 text-blue-600" />
            <span className="text-xs font-semibold">AI Assistant</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 leading-tight">
            Ask natural language questions about road condition telemetry.
          </p>
          <Link
            href="/assistant"
            className="mt-2.5 block text-center rounded-lg bg-blue-600 py-1.5 text-xs font-medium text-white shadow-xs hover:bg-blue-700 transition"
          >
            Open Assistant
          </Link>
        </div>
      </div>
    </aside>
  );
}
