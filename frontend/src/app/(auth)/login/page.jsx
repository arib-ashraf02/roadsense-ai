"use client";

import React, { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Compass, Mail, Lock, AlertCircle, Loader2, ArrowRight } from "lucide-react";
import { ThemeSwitcherModal } from "@/components/common/ThemeSwitcherModal";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    const errParam = searchParams?.get("error");
    if (errParam) {
      if (errParam === "OAuthSignin" || errParam === "OAuthCallback") {
        setError("Could not complete Google Sign-In. Please verify your connection or try again.");
      } else if (errParam === "OAuthAccountNotLinked") {
        setError("An account with this email exists with a different login provider.");
      } else if (errParam === "AccessDenied") {
        setError("Access was denied. Please use an authorized account.");
      } else if (errParam === "Configuration") {
        setError("Google authentication is being configured. Please use email/password in the meantime.");
      } else {
        setError("Authentication failed. Please verify your credentials.");
      }
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading || googleLoading) return;
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email: form.email.trim(),
        password: form.password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password. Please try again.");
      } else {
        // Fetch session to determine role-based destination immediately
        try {
          const sessionRes = await fetch("/api/auth/session");
          const sessionData = await sessionRes.json();
          const role = sessionData?.user?.role;
          if (role === "ADMIN") {
            router.push("/admin");
          } else if (role === "OFFICER") {
            router.push("/officer");
          } else if (role === "MAINTENANCE") {
            router.push("/maintenance");
          } else {
            router.push("/citizen");
          }
        } catch {
          router.push("/dashboard");
        }
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (loading || googleLoading) return;
    setError("");
    setGoogleLoading(true);
    try {
      await signIn("google", { callbackUrl: "/dashboard" });
    } catch {
      setError("Failed to initiate Google Sign-In. Please try again.");
      setGoogleLoading(false);
    }
  };

  const fillQuickLogin = (email, password) => {
    setForm({ email, password });
    setError("");
  };

  const isBusy = loading || googleLoading;

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

          {/* Google Sign-In Button */}
          <div className="space-y-3">
            <motion.button
              whileHover={isBusy ? {} : { scale: 1.02 }}
              whileTap={isBusy ? {} : { scale: 0.98 }}
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isBusy}
              aria-label="Continue with Google"
              className="w-full inline-flex items-center justify-center gap-3 rounded-full border border-border bg-card hover:bg-accent/80 py-3 px-4 text-xs font-bold text-foreground transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {googleLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span>Connecting to Google...</span>
                </>
              ) : (
                <>
                  <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </>
              )}
            </motion.button>

            {/* Divider */}
            <div className="relative flex items-center justify-center my-3">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative bg-card/80 px-3 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground backdrop-blur-xs rounded-full">
                or continue with email
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                <input
                  type="email"
                  required
                  disabled={isBusy}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="name@roadsense.ai"
                  className="w-full rounded-xl border border-border bg-card pl-10 pr-4 py-2.5 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-xs disabled:opacity-60"
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
                  disabled={isBusy}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-border bg-card pl-10 pr-4 py-2.5 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-xs disabled:opacity-60"
                />
              </div>
            </div>

            <motion.button
              whileHover={isBusy ? {} : { scale: 1.02 }}
              whileTap={isBusy ? {} : { scale: 0.97 }}
              type="submit"
              disabled={isBusy}
              className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-primary py-3 text-xs font-bold text-primary-foreground shadow-md shadow-primary/20 hover:opacity-95 transition disabled:opacity-50 disabled:cursor-not-allowed"
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
                  whileHover={isBusy ? {} : { scale: 1.03, y: -1 }}
                  whileTap={isBusy ? {} : { scale: 0.96 }}
                  type="button"
                  disabled={isBusy}
                  onClick={() => fillQuickLogin(account.email, account.pass)}
                  className="rounded-xl border border-border bg-card p-2 text-center font-bold text-foreground hover:border-primary/50 hover:bg-accent transition-all shadow-xs disabled:opacity-50"
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

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-transparent">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
