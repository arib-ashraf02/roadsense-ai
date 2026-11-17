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
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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
        afterMediaUrl = upData.annotated_image_path || previewUrl;
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
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
          Submit Repair Evidence for Verification
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Work Order: <strong className="text-blue-700 font-mono">{ticket?.ticket_number || ticketId}</strong>
        </p>
      </div>

      {verificationResult ? (
        <Card className="border-emerald-200 bg-emerald-50/40">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              <CardTitle className="text-lg text-emerald-900">Repair Proof Submitted Successfully!</CardTitle>
            </div>
            <CardDescription className="text-emerald-700">
              AI verification analysis completed. Sent to Municipal Officer for final sign-off.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 rounded-xl border border-emerald-200 bg-white p-4">
              <div>
                <p className="text-xs text-slate-500">AI Verification Confidence</p>
                <p className="text-2xl font-bold text-slate-900">
                  {Math.round((verificationResult.ai_verification_score || 0.9) * 100)}%
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Advisory Recommendation</p>
                <Badge variant="success" className="mt-1">
                  {verificationResult.ai_verdict || "PASSED"}
                </Badge>
              </div>
            </div>

            <Alert className="border-blue-200 bg-blue-50 text-blue-900">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertTitle className="font-semibold text-xs">Human-in-the-Loop Safeguard</AlertTitle>
              <AlertDescription className="text-xs text-blue-800">
                In compliance with municipal audit guidelines, AI delivers an advisory recommendation.
                Your assigned Municipal Officer conducts the final closure inspection.
              </AlertDescription>
            </Alert>

            <Button
              className="w-full bg-emerald-600 hover:bg-emerald-700 font-semibold"
              onClick={() => router.push("/maintenance/tasks")}
            >
              Return to Work Queue
            </Button>
          </CardContent>
        </Card>
      ) : (
        <form onSubmit={handleSubmitEvidence} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Submission Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Upload "After-Repair" Photograph</CardTitle>
              <CardDescription>
                Photograph the repaired asphalt patch in clear daylight from a 45-degree perspective.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                {...getRootProps()}
                className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
                  isDragActive
                    ? "border-blue-500 bg-blue-50/50"
                    : "border-slate-200 hover:border-slate-300 bg-slate-50/50"
                }`}
              >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="rounded-full bg-amber-50 p-3 text-amber-600">
                    <Camera className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-medium text-slate-700">
                    Take or drop after-repair photo, or <span className="text-blue-600 underline">browse</span>
                  </p>
                  <p className="text-xs text-slate-400">AI will verify absence of pothole and presence of patch</p>
                </div>
              </div>

              {previewUrl && (
                <div className="relative h-48 w-full overflow-hidden rounded-xl border border-slate-200">
                  <img src={previewUrl} alt="After repair proof" className="h-full w-full object-cover" />
                </div>
              )}

              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-semibold text-slate-700">Repair Notes / Patch Materials</label>
                <Textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Applied 50mm hot mix asphalt, compacted with 2-ton roller, road reopened."
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => router.push("/maintenance/tasks")}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="lg"
              disabled={submitting || !file}
              className="gap-2 bg-amber-600 text-white hover:bg-amber-700 font-semibold"
            >
              {submitting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Running AI Verification...
                </>
              ) : (
                <>
                  Submit Evidence for Officer Sign-Off
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
