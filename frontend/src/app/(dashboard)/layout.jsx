import React from "react";
import { Sidebar } from "@/components/common/Sidebar";
import { Navbar } from "@/components/common/Navbar";
import { FuturisticBackground } from "@/components/common/FuturisticBackground";

export default function DashboardLayout({ children }) {
  return (
    <div className="relative flex min-h-screen bg-background font-sans text-foreground antialiased transition-colors duration-300">
      <FuturisticBackground />
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
