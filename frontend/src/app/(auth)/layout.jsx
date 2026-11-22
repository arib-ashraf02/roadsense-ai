import React from "react";
import { FuturisticBackground } from "@/components/common/FuturisticBackground";

export default function AuthLayout({ children }) {
  return (
    <div className="relative min-h-screen bg-background font-sans text-foreground antialiased transition-colors duration-300">
      <FuturisticBackground />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
