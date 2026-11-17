"use client";

import React, { useState } from "react";
import {
  Bot,
  Send,
  User,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Lightbulb,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function AssistantPage() {
  const [messages, setMessages] = useState([
    {
      sender: "ai",
      text: "Hello! I am the RoadSense Municipal AI Assistant. Ask me anything regarding live road defect telemetry, critical pothole clusters, complaint statuses, or maintenance SLA deadlines.",
      recommendations: [
        "How many critical potholes are detected?",
        "Summarize citizen complaint backlog",
        "What is our active maintenance SLA?",
      ],
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async (textToSend) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    const userMsg = { sender: "user", text: query };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";
      const res = await fetch(`${apiUrl}/assistant/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [
          ...prev,
          {
            sender: "ai",
            text: data.reply,
            recommendations: data.recommendations,
            telemetry: data.telemetry_snapshot,
          },
        ]);
      } else {
        throw new Error("Assistant response error");
      }
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "I was unable to retrieve live telemetry right now. Please verify the backend service.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
            AI Municipal Assistant
          </h1>
          <Badge variant="outline" className="border-blue-300 bg-blue-50 text-blue-700">
            Telemetry RAG
          </Badge>
        </div>
        <p className="text-sm text-slate-500 mt-1">
          Query municipal database records, assess risk-based road repair priorities, and generate executive summaries.
        </p>
      </div>

      <Card className="flex h-[600px] flex-col">
        <CardHeader className="border-b border-slate-100 py-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-blue-600" />
              <span className="font-semibold text-slate-800 text-sm">RoadSense Decision Support</span>
            </div>
            <span className="text-[11px] text-slate-400">Distinguishing verified records from estimates</span>
          </div>
        </CardHeader>

        {/* Message Thread */}
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex gap-3 ${m.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              {m.sender === "ai" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white shadow-xs">
                  <Bot className="h-4 w-4" />
                </div>
              )}

              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  m.sender === "user"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-800"
                }`}
              >
                <p className="whitespace-pre-line">{m.text}</p>

                {m.recommendations && m.recommendations.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-200/80 space-y-1.5">
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-600">
                      <Lightbulb className="h-3 w-3 text-amber-500" /> Suggested Action Queries:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {m.recommendations.map((rec, rIdx) => (
                        <button
                          key={rIdx}
                          onClick={() => sendMessage(rec)}
                          className="rounded-md bg-white border border-slate-200 px-2 py-1 text-[11px] text-blue-700 hover:bg-blue-50 transition"
                        >
                          {rec}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {m.sender === "user" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white shadow-xs">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-slate-400 pl-11">
              <Sparkles className="h-4 w-4 animate-spin text-blue-500" />
              <span>Analyzing road database records...</span>
            </div>
          )}
        </CardContent>

        {/* Input Bar */}
        <div className="border-t border-slate-200 p-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="flex gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about road conditions, SLAs, or complaints..."
              className="text-xs"
              disabled={loading}
            />
            <Button type="submit" size="sm" disabled={loading || !input.trim()} className="bg-blue-600 hover:bg-blue-700 gap-1.5">
              <Send className="h-3.5 w-3.5" />
              <span>Send</span>
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
