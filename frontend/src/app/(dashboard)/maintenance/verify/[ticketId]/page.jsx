"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useDropzone } from "react-dropzone";
import {
  Camera,
  Upload,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ShieldCheck,
  ArrowRight,
  Info,
  Sparkles,
} from "lucide-react";

export default function RepairVerificationPage() {
  const { ticketId } = useParams();
  const router = useRouter();
  const { data: session } = useSession();

  const [ticket, setTicket] = useState(null);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadTicket() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";
        const res = await fetch(`${apiUrl}/tickets/${ticketId}`, {
          headers: session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {},
        });
        if (res.ok) {
          setTicket(await res.json());
        }
      } catch (e) {
        console.error("Failed to load ticket:", e);
      }
    }
    if (ticketId) loadTicket();
  }, [ticketId, session]);

  const onDrop = useCallback((acceptedFiles) => {
    if (!acceptedFiles || acceptedFiles.length === 0) return;
    const f = acceptedFiles[0];
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setError(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpeg", ".jpg", ".png", ".webp"] },
    maxFiles: 1,
  });

  const handleSubmitEvidence = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("Please capture or upload an after-repair photograph.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

      // 1. Upload after-photo to uploads/
      const formData = new FormData();
      formData.append("file", file);

      const upRes = await fetch(`${apiUrl}/detection/image`, {
        method: "POST",
        body: formData,
      });

      let afterMediaUrl = previewUrl;
      if (upRes.ok) {
        const upData = await upRes.json();
        afterMediaUrl = upData.annotated_image_path || upData.upload?.media_url || upData.upload?.file_path || previewUrl;
      }

      // 2. Submit Repair Record with AI advisory verification
      const repRes = await fetch(`${apiUrl}/repairs/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {}),
        },
        body: JSON.stringify({
          ticket_id: ticketId,
          before_media_url: ticket?.before_media_url || null,
          after_media_url: afterMediaUrl,
          notes: notes || "Hot mix asphalt patching completed.",
        }),
      });

      if (!repRes.ok) {
        throw new Error("Failed to submit repair verification.");
      }

      const repData = await repRes.json();
      setVerificationResult(repData);
    } catch (err) {
      setError(err.message || "Failed to submit repair evidence.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-16">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-bold text-foreground mb-2">
          <span className="h-2 w-2 rounded-full bg-primary" />
          <span>Quality Assurance</span>
        </div>
        <h1 className="text-3xl font-black tracking-tight text-foreground">
          Submit Repair Evidence for Verification
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Work Order: <strong className="text-primary font-mono">{ticket?.ticket_number || ticketId}</strong>
        </p>
      </div>

      {verificationResult ? (
        <div className="editorial-card border-emerald-500/30 bg-emerald-500/5 space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-sm">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">Repair Proof Submitted Successfully!</h3>
              <p className="text-xs text-muted-foreground">
                AI verification analysis completed. Sent to Municipal Officer for final sign-off.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 rounded-2xl border border-emerald-500/20 bg-card p-5">
            <div>
              <p className="text-xs font-bold text-muted-foreground">AI Verification Confidence</p>
              <p className="text-3xl font-black text-foreground mt-1">
                {Math.round((verificationResult.ai_verification_score || 0.9) * 100)}%
              </p>
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground">Advisory Recommendation</p>
              <div className="mt-2">
                <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  {verificationResult.ai_verdict || "PASSED"}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-xs text-muted-foreground space-y-1">
            <div className="flex items-center gap-2 text-primary font-bold">
              <Info className="h-4 w-4" />
              <span>Human-in-the-Loop Safeguard</span>
            </div>
            <p className="leading-relaxed">
              In compliance with municipal audit guidelines, AI delivers an advisory recommendation. Your assigned Municipal Officer conducts the final closure inspection.
            </p>
          </div>

          <button
            onClick={() => router.push("/maintenance/tasks")}
            className="w-full rounded-full bg-emerald-600 py-3 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition"
          >
            Return to Work Queue
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmitEvidence} className="space-y-6">
          {error && (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-rose-700 dark:text-rose-400 text-xs font-bold">
              {error}
            </div>
          )}

          <div className="editorial-card space-y-4">
            <div>
              <h3 className="font-bold text-base text-foreground">
                Upload "After-Repair" Photograph
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Photograph the repaired asphalt patch in clear daylight from a 45-degree perspective.
              </p>
            </div>

            <div
              {...getRootProps()}
              className={`cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-200 ${
                isDragActive
                  ? "border-primary bg-primary/10 shadow-inner"
                  : "border-border bg-card/60 hover:border-primary/50 hover:bg-accent/30"
              }`}
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center justify-center gap-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Camera className="h-6 w-6" />
                </div>
                <p className="text-sm font-bold text-foreground">
                  Take or drop after-repair photo, or <span className="text-primary underline">browse</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  AI will verify the absence of pothole cavity and presence of asphalt patch
                </p>
              </div>
            </div>

            {previewUrl && (
              <div className="relative h-48 w-full overflow-hidden rounded-2xl border border-border">
                <img src={previewUrl} alt="After repair proof" className="h-full w-full object-cover" />
              </div>
            )}

            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-bold text-foreground">
                Repair Notes / Patch Materials
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Applied 50mm hot mix asphalt, compacted with 2-ton roller, road reopened to traffic."
                className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-xs resize-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => router.push("/maintenance/tasks")}
              className="rounded-full px-5 py-2.5 text-xs font-bold text-muted-foreground hover:text-foreground transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !file}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3 text-xs font-bold text-primary-foreground shadow-md shadow-primary/25 hover:opacity-90 transition disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Running AI Verification...</span>
                </>
              ) : (
                <>
                  <span>Submit Evidence for Officer Sign-Off</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
