"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
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
  Sparkles,
  Layers,
} from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role || "CITIZEN";

  const getNavSections = () => {
    const general = [
      { href: "/map", label: "GIS Heatmap", icon: MapPin },
      { href: "/analytics", label: "Ward Analytics", icon: BarChart3 },
      { href: "/assistant", label: "AI Municipal Bot", icon: Bot, badge: "AI" },
    ];

    if (role === "ADMIN") {
      return [
        {
          title: "Administration",
          links: [
            { href: "/admin", label: "Admin Console", icon: LayoutDashboard },
            { href: "/admin/users", label: "User Management", icon: Users },
            { href: "/officer/complaints", label: "All Complaints", icon: FileText },
            { href: "/officer/tickets", label: "All Work Orders", icon: ClipboardList },
          ],
        },
        {
          title: "Spatial & Analytics",
          links: general,
        },
      ];
    }

    if (role === "OFFICER") {
      return [
        {
          title: "Triage & Dispatch",
          links: [
            { href: "/officer", label: "Officer Portal", icon: LayoutDashboard },
            { href: "/officer/complaints", label: "Triage Grievances", icon: FileText },
            { href: "/officer/tickets", label: "Tickets & Dispatch", icon: ClipboardList },
          ],
        },
        {
          title: "Spatial & Analytics",
          links: general,
        },
      ];
    }

    if (role === "MAINTENANCE") {
      return [
        {
          title: "Work Orders",
          links: [
            { href: "/maintenance", label: "Active Queue", icon: LayoutDashboard },
            { href: "/maintenance/tasks", label: "Assigned Repairs", icon: Wrench },
          ],
        },
        {
          title: "Spatial & Analytics",
          links: general,
        },
      ];
    }

    // Default: CITIZEN
    return [
      {
        title: "Citizen Grievances",
        links: [
          { href: "/citizen", label: "My Dashboard", icon: LayoutDashboard },
          { href: "/citizen/report", label: "Report Pothole", icon: PlusCircle, highlight: true },
          { href: "/citizen/my-reports", label: "My Grievances", icon: FileText },
        ],
      },
      {
        title: "City Intelligence",
        links: general,
      },
    ];
  };

  const navSections = getNavSections();

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="hidden w-72 flex-col border-r border-border bg-card/60 backdrop-blur-md md:flex transition-colors duration-200"
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center gap-3 border-b border-border px-6">
        <motion.div
          whileHover={{ rotate: 12, scale: 1.05 }}
          className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm shadow-primary/25 cursor-pointer"
        >
          <Compass className="h-5 w-5" />
        </motion.div>
        <div>
          <span className="font-extrabold text-foreground text-base tracking-tight">
            RoadSense<span className="text-primary font-black">.ai</span>
          </span>
          <span className="block text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
            Smart City Works
          </span>
        </div>
      </div>

      {/* Role Pill Card */}
      <div className="p-4">
        <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-3 shadow-xs transition-all hover:border-primary/40">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent text-accent-foreground">
              {role === "ADMIN" && <ShieldAlert className="h-4 w-4" />}
              {role === "OFFICER" && <ClipboardList className="h-4 w-4" />}
              {role === "MAINTENANCE" && <HardHat className="h-4 w-4" />}
              {role === "CITIZEN" && <Users className="h-4 w-4" />}
            </div>
            <div>
              <span className="text-xs font-bold text-foreground block">{role}</span>
              <span className="text-[10px] text-muted-foreground">Signed In</span>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Live</span>
          </span>
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-6">
        {navSections.map((section, idx) => (
          <div key={idx}>
            <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
              {section.title}
            </div>
            <nav className="space-y-1">
              {section.links.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`group relative flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all duration-200 active:scale-98 ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                        : link.highlight
                        ? "bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15 hover:shadow-xs"
                        : "text-foreground hover:bg-accent/70 hover:translate-x-0.5"
                    }`}
                  >
                    <div className="flex items-center gap-3 relative z-10">
                      <Icon
                        className={`h-4 w-4 transition-transform duration-200 group-hover:scale-115 ${
                          isActive
                            ? "text-primary-foreground"
                            : link.highlight
                            ? "text-primary"
                            : "text-muted-foreground group-hover:text-foreground"
                        }`}
                      />
                      <span>{link.label}</span>
                    </div>

                    <div className="flex items-center gap-1.5 relative z-10">
                      {link.badge && (
                        <span
                          className={`rounded-full px-1.5 py-0.5 text-[9px] font-extrabold transition-colors ${
                            isActive
                              ? "bg-primary-foreground/20 text-primary-foreground"
                              : "bg-primary/15 text-primary"
                          }`}
                        >
                          {link.badge}
                        </span>
                      )}
                      {isActive && (
                        <ChevronRight className="h-3.5 w-3.5 text-primary-foreground" />
                      )}
                    </div>
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* Bottom Municipal Telemetry Widget */}
      <div className="p-4 border-t border-border">
        <div className="rounded-2xl border border-border bg-card p-3 shadow-xs hover:border-primary/40 transition-colors">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-bold text-foreground">Spatial Deduplication</span>
          </div>
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            DBSCAN spatial clustering (15m radius) active on all reported road coordinates.
          </p>
        </div>
      </div>
    </motion.aside>
  );
}
