"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  Send,
  User,
  Sparkles,
  AlertCircle,
  Lightbulb,
  RefreshCw,
  Trash2,
  Database,
  CheckCircle2,
  Activity,
  Layers,
} from "lucide-react";

const INITIAL_MESSAGE = {
  sender: "ai",
  text: "Hello! I am the RoadSense Municipal AI Co-Pilot. I am connected directly to your municipal road telemetry and GIS database. Ask me anything regarding live defect counts, critical pothole locations, citizen complaint backlogs, or maintenance SLA compliance.",
  recommendations: [
    "How many critical potholes are detected?",
    "Summarize citizen complaint backlog",
    "What is our active maintenance SLA?",
    "Which road defects require immediate attention?",
    "Give me a summary of current road conditions.",
  ],
};

export default function AssistantPage() {
  const { data: session } = useSession();
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastFailedQuery, setLastFailedQuery] = useState(null);
  const [serviceStatus, setServiceStatus] = useState({
    checking: true,
    online: false,
    records: null,
    error: null,
  });

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Check backend and database status on mount
  const checkStatus = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";
      const res = await fetch(`${apiUrl}/assistant/status`);
      if (res.ok) {
        const data = await res.json();
        setServiceStatus({
          checking: false,
          online: data.status === "online",
          records: data.records || null,
          error: data.error_type || null,
        });
      } else {
        setServiceStatus({ checking: false, online: false, records: null, error: "HTTP_ERROR" });
      }
    } catch (err) {
      setServiceStatus({ checking: false, online: false, records: null, error: "NETWORK_ERROR" });
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (textToSend) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    const userMsg = { sender: "user", text: query };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setLastFailedQuery(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";
      const headers = { "Content-Type": "application/json" };
      if (session?.accessToken) {
        headers["Authorization"] = `Bearer ${session.accessToken}`;
      }

      const res = await fetch(`${apiUrl}/assistant/chat`, {
        method: "POST",
        headers,
        body: JSON.stringify({ query }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Server responded with status ${res.status}`);
      }

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: data.reply,
          recommendations: data.recommendations || [],
          telemetry: data.telemetry_snapshot || null,
        },
      ]);
    } catch (err) {
      setLastFailedQuery(query);
      const isNetwork = !window.navigator.onLine || err.message.includes("Failed to fetch");
      const errorMessage = isNetwork
        ? "Network error: Unable to reach the RoadSense AI backend at 127.0.0.1:8000. Please ensure the backend is running."
        : `Service communication error: ${err.message}. Please check backend logs or retry.`;

      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          isError: true,
          text: errorMessage,
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleClear = () => {
    setMessages([INITIAL_MESSAGE]);
    setLastFailedQuery(null);
    setInput("");
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1 text-xs font-bold text-foreground mb-2">
            <span className="h-2 w-2 rounded-full bg-primary" />
            <span>AI Decision Support</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">
            AI Municipal Assistant
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Query municipal database records, assess risk-based road repair priorities, and inspect real-time road telemetry.
          </p>
        </div>

        {/* Live Service Indicator & Clear Button */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 rounded-full border border-border bg-card/80 px-3.5 py-1.5 text-xs font-semibold text-foreground shadow-xs">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                serviceStatus.online
                  ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)] animate-pulse"
                  : "bg-amber-500"
              }`}
            />
            <span className="text-[11px] font-bold">
              {serviceStatus.checking
                ? "Connecting..."
                : serviceStatus.online
                ? "Telemetry Live"
                : "Telemetry Degraded"}
            </span>
          </div>

          <button
            type="button"
            onClick={handleClear}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card/80 text-muted-foreground hover:text-foreground hover:bg-accent transition shadow-xs"
            title="Reset Conversation"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="glass-panel rounded-3xl border border-border p-0 flex flex-col h-[640px] overflow-hidden shadow-2xl">
        {/* Chat Header Status Bar */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm shadow-primary/20">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-foreground">RoadSense AI Co-Pilot</h4>
              <p className="text-[10px] text-muted-foreground">
                Connected to municipal database • YOLOv8 RDD2022 & DBSCAN Engine
              </p>
            </div>
          </div>

          {serviceStatus.records && (
            <div className="hidden sm:flex items-center gap-3 text-[11px] text-muted-foreground font-semibold">
              <span className="flex items-center gap-1">
                <Database className="h-3.5 w-3.5 text-primary" />
                <strong className="text-foreground">{serviceStatus.records.potholes}</strong> defects
              </span>
              <span>•</span>
              <span>
                <strong className="text-foreground">{serviceStatus.records.complaints}</strong> complaints
              </span>
              <span>•</span>
              <span>
                <strong className="text-foreground">{serviceStatus.records.tickets}</strong> tickets
              </span>
            </div>
          )}
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          <AnimatePresence initial={false}>
            {messages.map((m, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className={`flex gap-3 ${m.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.sender === "ai" && (
                  <motion.div
                    whileHover={{ scale: 1.08 }}
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl shadow-xs text-white ${
                      m.isError ? "bg-rose-500" : "bg-primary"
                    }`}
                  >
                    {m.isError ? <AlertCircle className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </motion.div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed transition-all ${
                    m.sender === "user"
                      ? "bg-primary text-primary-foreground shadow-sm font-semibold ml-10"
                      : m.isError
                      ? "bg-rose-500/10 border border-rose-500/30 text-rose-500 dark:text-rose-400 mr-10"
                      : "bg-card/90 border border-border text-foreground shadow-sm mr-10"
                  }`}
                >
                  <div className="whitespace-pre-line leading-relaxed font-sans">{m.text}</div>

                  {/* Telemetry Snapshot Data Chips */}
                  {m.telemetry && (
                    <div className="mt-3.5 pt-3 border-t border-border/60">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
                        <Activity className="h-3 w-3 text-primary animate-pulse" />
                        Live Verified Database Telemetry
                      </div>
                      <div className="flex flex-wrap gap-2 text-[10px]">
                        <span className="rounded-lg border border-border bg-muted/40 px-2.5 py-1 font-bold text-foreground transition-colors hover:border-primary/40">
                          Critical: <strong className="text-rose-500">{m.telemetry.critical_potholes}</strong>
                        </span>
                        <span className="rounded-lg border border-border bg-muted/40 px-2.5 py-1 font-bold text-foreground transition-colors hover:border-primary/40">
                          Total Potholes: <strong>{m.telemetry.total_potholes}</strong>
                        </span>
                        <span className="rounded-lg border border-border bg-muted/40 px-2.5 py-1 font-bold text-foreground transition-colors hover:border-primary/40">
                          Complaints Backlog: <strong>{m.telemetry.complaints_backlog ?? m.telemetry.open_complaints ?? 0}</strong>
                        </span>
                        <span className="rounded-lg border border-border bg-muted/40 px-2.5 py-1 font-bold text-foreground transition-colors hover:border-primary/40">
                          Open Work Orders: <strong>{m.telemetry.open_tickets}</strong>
                        </span>
                        <span className="rounded-lg border border-border bg-muted/40 px-2.5 py-1 font-bold text-foreground transition-colors hover:border-primary/40">
                          Spatial Clusters: <strong>{m.telemetry.spatial_clusters ?? 0}</strong>
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Suggested Action Queries */}
                  {m.recommendations && m.recommendations.length > 0 && (
                    <div className="mt-3.5 pt-3 border-t border-border/60 space-y-2">
                      <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        <Lightbulb className="h-3 w-3 text-amber-500" /> Suggested Action Queries:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {m.recommendations.map((rec, rIdx) => (
                          <motion.button
                            key={rIdx}
                            type="button"
                            whileHover={{ scale: 1.02, y: -1 }}
                            whileTap={{ scale: 0.96 }}
                            disabled={loading}
                            onClick={() => sendMessage(rec)}
                            className="rounded-full border border-border bg-muted/30 px-3 py-1 text-[11px] font-semibold text-foreground hover:border-primary/50 hover:bg-primary/10 transition shadow-xs text-left"
                          >
                            {rec}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Retry Button on Error */}
                  {m.isError && lastFailedQuery && (
                    <div className="mt-3 pt-2">
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.95 }}
                        type="button"
                        onClick={() => sendMessage(lastFailedQuery)}
                        disabled={loading}
                        className="inline-flex items-center gap-1.5 rounded-full bg-rose-500 text-white px-3 py-1 text-xs font-bold hover:bg-rose-600 transition shadow-xs"
                      >
                        <RefreshCw className="h-3 w-3" />
                        <span>Retry Query</span>
                      </motion.button>
                    </div>
                  )}
                </div>

                {m.sender === "user" && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-foreground text-background shadow-xs font-bold text-xs">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2.5 text-xs font-semibold text-muted-foreground pl-11 py-2"
            >
              <Sparkles className="h-4 w-4 animate-spin text-primary" />
              <span>Querying municipal database & calculating telemetry...</span>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="border-t border-border p-4 bg-muted/10">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="flex gap-2"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about critical potholes, complaints, SLAs, or current road conditions..."
              className="w-full rounded-full border border-border bg-card px-5 py-3 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-xs transition"
              disabled={loading}
            />
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.94 }}
              type="submit"
              disabled={loading || !input.trim()}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-6 py-3 text-xs font-bold text-primary-foreground shadow-sm hover:opacity-95 transition disabled:opacity-50 shrink-0"
            >
              <Send className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Send</span>
            </motion.button>
          </form>
        </div>
      </div>
    </div>
  );
}
