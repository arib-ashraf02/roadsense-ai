"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  LogOut,
  User,
  Menu,
  X,
  Compass,
  ExternalLink,
  Shield,
  HardHat,
  Users,
  MapPin,
  BarChart3,
  FileText,
  ClipboardList,
  Wrench,
  Bot,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeSwitcherModal } from "@/components/common/ThemeSwitcherModal";

export function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const role = session?.user?.role || "CITIZEN";

  useEffect(() => {
    async function fetchUnread() {
      if (!session?.accessToken) {
        setUnreadCount(0);
        return;
      }
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";
        const res = await fetch(`${apiUrl}/notifications/unread-count`, {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.unread_count || 0);
        }
      } catch (e) {
        // Offline safeguard
      }
    }
    fetchUnread();
  }, [session?.accessToken]);

  const getMobileLinks = () => {
    const common = [
      { href: "/map", label: "GIS Heatmap", icon: MapPin },
      { href: "/analytics", label: "Analytics", icon: BarChart3 },
      { href: "/assistant", label: "AI Assistant", icon: Bot },
    ];

    if (role === "ADMIN") {
      return [
        { href: "/admin", label: "Admin Console", icon: Shield },
        { href: "/admin/users", label: "Users & Teams", icon: Users },
        { href: "/officer/complaints", label: "Complaints", icon: FileText },
        { href: "/officer/tickets", label: "Work Orders", icon: ClipboardList },
        ...common,
      ];
    }
    if (role === "OFFICER") {
      return [
        { href: "/officer", label: "Officer Portal", icon: Shield },
        { href: "/officer/complaints", label: "Triage Complaints", icon: FileText },
        { href: "/officer/tickets", label: "Tickets & Dispatch", icon: ClipboardList },
        ...common,
      ];
    }
    if (role === "MAINTENANCE") {
      return [
        { href: "/maintenance", label: "My Work Queue", icon: HardHat },
        { href: "/maintenance/tasks", label: "Assigned Repairs", icon: Wrench },
        ...common,
      ];
    }
    return [
      { href: "/citizen", label: "My Dashboard", icon: Users },
      { href: "/citizen/report", label: "Report Defect", icon: MapPin },
      { href: "/citizen/my-reports", label: "My Grievances", icon: FileText },
      ...common,
    ];
  };

  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <motion.header
        initial={{ y: -12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className={`sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b transition-all duration-300 px-4 sm:px-8 ${
          scrolled
            ? "border-border/90 bg-card/95 shadow-md shadow-black/10 backdrop-blur-xl"
            : "border-border bg-card/85 backdrop-blur-md"
        }`}
      >
        {/* Left: Mobile hamburger & Brand */}
        <div className="flex items-center gap-3">
          <motion.button
            whileTap={{ scale: 0.92 }}
            type="button"
            suppressHydrationWarning
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-foreground md:hidden shadow-sm hover:bg-accent transition-colors"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </motion.button>

          <Link href="/" className="flex items-center gap-2.5 group">
            <motion.div
              whileHover={{ rotate: 12, scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm shadow-primary/20 transition-transform"
            >
              <Compass className="h-5 w-5" />
            </motion.div>
            <div className="hidden sm:block">
              <span className="font-extrabold tracking-tight text-foreground text-base group-hover:text-primary transition-colors">
                RoadSense<span className="text-primary font-black">.ai</span>
              </span>
            </div>
          </Link>

          {/* Role Pill Indicator */}
          <div className="hidden lg:flex items-center gap-1.5 ml-4 rounded-full border border-border bg-accent/50 px-3 py-1 text-xs font-semibold text-foreground transition-all">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="tracking-wide uppercase text-[11px] font-bold">{role}</span>
          </div>
        </div>

        {/* Center: Subtle Editorial Status */}
        <div className="hidden md:flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <span>Active Municipality:</span>
          <span className="font-semibold text-foreground">Metro Central Works</span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Public Overview Link */}
          <Link
            href="/"
            className="hidden sm:flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-all duration-200 hover:-translate-y-0.5 mr-1"
          >
            <span>Showcase</span>
            <ExternalLink className="h-3 w-3" />
          </Link>

          {/* Theme Switcher Trigger */}
          <ThemeSwitcherModal />

          {/* Notifications Button */}
          <Link
            href="/notifications"
            className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm"
            title="Notifications"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white shadow-sm ring-2 ring-card animate-pulse">
                {unreadCount}
              </span>
            )}
          </Link>

          {/* User Profile Pill */}
          <div className="flex items-center gap-2 rounded-full border border-border bg-card p-1 pr-3 shadow-sm transition-all hover:border-primary/40">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shadow-xs">
              {(session?.user?.name || session?.user?.email || "U")[0].toUpperCase()}
            </div>
            <span className="hidden sm:inline-block max-w-[100px] truncate text-xs font-semibold text-foreground">
              {session?.user?.name || session?.user?.email?.split("@")[0] || "User"}
            </span>
          </div>

          {/* Sign Out */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            suppressHydrationWarning
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex h-9 items-center gap-1.5 rounded-xl border border-border bg-card px-3 text-xs font-semibold text-muted-foreground hover:text-destructive hover:border-destructive/30 hover:bg-destructive/10 transition-all shadow-sm"
            title="Sign out"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </motion.button>
        </div>
      </motion.header>

      {/* Mobile Menu Drawer with Smooth Staggered Animation */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -16, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -16, height: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed inset-x-0 top-16 z-30 border-b border-border bg-card/95 backdrop-blur-xl p-4 shadow-2xl md:hidden overflow-hidden"
          >
            <motion.nav
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: { staggerChildren: 0.04 },
                },
              }}
              className="flex flex-col gap-1.5"
            >
              {getMobileLinks().map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <motion.div
                    key={link.href}
                    variants={{
                      hidden: { opacity: 0, x: -10 },
                      visible: { opacity: 1, x: 0 },
                    }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                        isActive
                          ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25"
                          : "text-foreground hover:bg-accent/80 active:scale-98"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{link.label}</span>
                    </Link>
                  </motion.div>
                );
              })}
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
