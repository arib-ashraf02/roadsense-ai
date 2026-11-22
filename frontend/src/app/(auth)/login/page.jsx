"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Compass, Mail, Lock, AlertCircle, Loader2, ArrowRight, ShieldCheck } from "lucide-react";
import { ThemeSwitcherModal } from "@/components/common/ThemeSwitcherModal";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password. Please try again.");
      } else {
        router.push("/citizen");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fillQuickLogin = (email, password) => {
    setForm({ email, password });
    setError("");
  };

  return (
    <div className="min-h-screen bg-transparent text-foreground flex flex-col justify-between p-4 sm:p-8 transition-colors duration-200">
      {/* Top Header */}
      <div className="flex items-center justify-between mx-auto w-full max-w-5xl">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm shadow-primary/25">
            <Compass className="h-5 w-5" />
          </div>
          <span className="font-extrabold text-foreground text-base tracking-tight">
            RoadSense<span className="text-primary font-black">.ai</span>
          </span>
        </Link>
        <ThemeSwitcherModal />
      </div>

      {/* Main Login Card */}
      <div className="mx-auto w-full max-w-md my-auto py-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="glass-panel border border-border p-6 sm:p-8 rounded-3xl shadow-2xl space-y-6"
        >
          <div className="space-y-1 text-center">
            <h1 className="text-2xl font-black text-foreground tracking-tight">
              Sign In to RoadSense
            </h1>
            <p className="text-xs text-muted-foreground">
              Access role-based portals for reporting, triage, and repair verification
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-rose-600 dark:text-rose-400 text-xs font-bold">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="name@roadsense.ai"
                  className="w-full rounded-xl border border-border bg-card pl-10 pr-4 py-2.5 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground">Password</label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                <input
                  type="password"
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-border bg-card pl-10 pr-4 py-2.5 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
                />
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-primary py-3 text-xs font-bold text-primary-foreground shadow-md shadow-primary/20 hover:opacity-95 transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </motion.button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="pt-2 border-t border-border space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-center">
              Quick One-Click Test Accounts:
            </p>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              {[
                { label: "Citizen User", email: "citizen@roadsense.ai", pass: "Citizen@12345" },
                { label: "Municipal Officer", email: "officer@roadsense.ai", pass: "Officer@12345" },
                { label: "Maintenance Crew", email: "maintenance@roadsense.ai", pass: "Maintenance@12345" },
                { label: "Administrator", email: "admin@roadsense.ai", pass: "Admin@12345" },
              ].map((account) => (
                <motion.button
                  key={account.label}
                  whileHover={{ scale: 1.03, y: -1 }}
                  whileTap={{ scale: 0.96 }}
                  type="button"
                  onClick={() => fillQuickLogin(account.email, account.pass)}
                  className="rounded-xl border border-border bg-card p-2 text-center font-bold text-foreground hover:border-primary/50 hover:bg-accent transition-all shadow-xs"
                >
                  {account.label}
                </motion.button>
              ))}
            </div>
          </div>

          <div className="text-center text-xs text-muted-foreground pt-1">
            <span>Don't have an account? </span>
            <Link href="/register" className="font-bold text-primary hover:underline">
              Create an Account
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="text-center text-[11px] text-muted-foreground">
        RoadSense AI • Secure Municipal Authentication
      </div>
    </div>
  );
}
