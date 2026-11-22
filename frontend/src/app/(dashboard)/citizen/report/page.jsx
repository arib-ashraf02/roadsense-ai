"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useDropzone } from "react-dropzone";
import EXIF from "exif-js";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  Image as ImageIcon,
  Video,
  MapPin,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  ShieldAlert,
  Compass,
  Sparkles,
  Layers,
  Check,
} from "lucide-react";
import { RoadSurface3D } from "@/components/three/RoadSurface3D";

export default function ReportPotholePage() {
  const router = useRouter();
  const { data: session } = useSession();

  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [mediaType, setMediaType] = useState("IMAGE");

  // Location telemetry
  const [coords, setCoords] = useState({ lat: null, lon: null });
  const [hasGps, setHasGps] = useState(false);
  const [gpsSource, setGpsSource] = useState(null); // 'EXIF', 'DEVICE', 'MANUAL'
  const [addressText, setAddressText] = useState("");

  // Complaint details
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  // AI inference & upload states
  const [uploading, setUploading] = useState(false);
  const [detectionResult, setDetectionResult] = useState(null);
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [error, setError] = useState(null);

  // 1. Dropzone file upload handler
  const onDrop = useCallback((acceptedFiles) => {
    if (!acceptedFiles || acceptedFiles.length === 0) return;
    const selectedFile = acceptedFiles[0];
    setFile(selectedFile);
    setError(null);
    setDetectionResult(null);

    const isVideo = selectedFile.type.startsWith("video/");
    setMediaType(isVideo ? "VIDEO" : "IMAGE");

    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);

    if (!isVideo) {
      // Extract EXIF GPS from photograph
      EXIF.getData(selectedFile, function () {
        const lat = EXIF.getTag(this, "GPSLatitude");
        const lon = EXIF.getTag(this, "GPSLongitude");
        const latRef = EXIF.getTag(this, "GPSLatitudeRef") || "N";
        const lonRef = EXIF.getTag(this, "GPSLongitudeRef") || "E";

        if (lat && lon) {
          const latDecimal = (lat[0] + lat[1] / 60 + lat[2] / 3600) * (latRef === "S" ? -1 : 1);
          const lonDecimal = (lon[0] + lon[1] / 60 + lon[2] / 3600) * (lonRef === "W" ? -1 : 1);
          setCoords({ lat: parseFloat(latDecimal.toFixed(6)), lon: parseFloat(lonDecimal.toFixed(6)) });
          setHasGps(true);
          setGpsSource("EXIF");
          checkDuplicate(latDecimal, lonDecimal);
        } else {
          requestDeviceLocation();
        }
      });
    } else {
      requestDeviceLocation();
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp"],
      "video/*": [".mp4", ".mov", ".webm"],
    },
    maxFiles: 1,
  });

  // Request browser geolocation fallback
  const requestDeviceLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = parseFloat(pos.coords.latitude.toFixed(6));
          const lon = parseFloat(pos.coords.longitude.toFixed(6));
          setCoords({ lat, lon });
          setHasGps(true);
          setGpsSource("DEVICE");
          checkDuplicate(lat, lon);
        },
        (err) => {
          console.warn("Geolocation denied or unavailable:", err.message);
          setHasGps(false);
          setGpsSource("MISSING");
        },
        { enableHighAccuracy: true }
      );
    }
  };

  // Check spatial duplicate via FastAPI
  const checkDuplicate = async (lat, lon) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";
      const res = await fetch(
        `${apiUrl}/spatial/check-duplicate?latitude=${lat}&longitude=${lon}&radius_meters=15.0`,
        { method: "POST" }
      );
      if (res.ok) {
        const data = await res.json();
        if (data.is_duplicate) {
          setDuplicateWarning(data);
        } else {
          setDuplicateWarning(null);
        }
      }
    } catch (e) {
      console.warn("Could not verify duplicate status:", e);
    }
  };

  // 2. Submit Grievance & Run AI Detection
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("Please upload a photograph or video of the road damage.");
      return;
    }
    if (coords.lat === null || coords.lon === null) {
      setError("Please specify coordinates. Click 'Use Device GPS' or enter manually.");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

      // 1. Upload file and run AI detection
      const formData = new FormData();
      formData.append("file", file);

      let detectionData = null;
      if (mediaType === "IMAGE") {
        const detectRes = await fetch(`${apiUrl}/detection/image`, {
          method: "POST",
          body: formData,
        });
        if (detectRes.ok) {
          detectionData = await detectRes.json();
          setDetectionResult(detectionData);
        }
      }

      // 2. Create official complaint record
      const complaintPayload = {
        title: title || `Road Pothole Defect near ${addressText || "Detected Coordinates"}`,
        description: description || `Severity: ${detectionData?.severity || "Classified via YOLOv8 vision"}.`,
        latitude: coords.lat,
        longitude: coords.lon,
        address_text: addressText || `${coords.lat}, ${coords.lon}`,
        media_urls: detectionData?.annotated_image_path
          ? [detectionData.annotated_image_path]
          : detectionData?.upload?.media_url
          ? [detectionData.upload.media_url]
          : [],
      };

      const compRes = await fetch(`${apiUrl}/complaints/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {}),
        },
        body: JSON.stringify(complaintPayload),
      });

      if (!compRes.ok) {
        throw new Error("Grievance submission encountered an error.");
      }

      setTimeout(() => {
        router.push("/citizen/my-reports");
      }, 1200);
    } catch (err) {
      setError(err.message || "Failed to submit grievance. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-16">
      {/* Editorial Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1 text-xs font-bold text-foreground shadow-xs">
          <span className="h-2 w-2 rounded-full bg-primary" />
          <span>Citizen Road Audit</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
          Report Road Hazard or Pothole
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Upload road imagery. Our YOLO vision engine analyzes severity and cross-references existing municipal repair tickets within 15 meters.
        </p>
      </div>

      {/* Duplicate Alert Banner */}
      <AnimatePresence>
        {duplicateWarning && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="rounded-3xl border border-amber-500/40 bg-amber-500/10 p-5 shadow-sm"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-sm">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground">
                  Corroborating Existing Ticket: {duplicateWarning.matched_ticket?.ticket_number}
                </h4>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  A work ticket already exists approximately <strong>{duplicateWarning.distance_meters} meters</strong> away with priority <strong>{duplicateWarning.matched_ticket?.priority}</strong>. Your report will be automatically attached as secondary verification, elevating its municipal dispatch score!
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Alert */}
      {error && (
        <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 p-5 text-rose-700 dark:text-rose-400">
          <div className="flex items-center gap-2 font-bold text-sm">
            <AlertTriangle className="h-4 w-4" />
            <span>Submission Error</span>
          </div>
          <p className="mt-1 text-xs">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Media Dropzone */}
        <div className="editorial-card space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                1
              </span>
              <h3 className="font-bold text-base text-foreground">
                Capture or Upload Media
              </h3>
            </div>
            <span className="text-[11px] font-semibold text-muted-foreground">
              Supports JPEG, PNG, MP4, MOV
            </span>
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
            <div className="flex flex-col items-center justify-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm">
                <Upload className="h-7 w-7" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">
                  Drag and drop road photo or video, or{" "}
                  <span className="text-primary underline">browse your device</span>
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  EXIF geolocation metadata will be extracted automatically
                </p>
              </div>
            </div>
          </div>

          {/* Media Preview & EXIF telemetry pill */}
          {previewUrl && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col sm:flex-row items-center gap-5 rounded-2xl border border-border bg-card p-4 shadow-xs"
            >
              <div className="relative h-32 w-52 overflow-hidden rounded-xl bg-muted border border-border shrink-0">
                {mediaType === "IMAGE" ? (
                  <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
                ) : (
                  <video src={previewUrl} className="h-full w-full object-cover" controls />
                )}
              </div>
              <div className="space-y-1.5 text-xs text-muted-foreground w-full">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-foreground truncate max-w-[200px]">
                    {file?.name}
                  </h4>
                  <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-accent-foreground">
                    {mediaType}
                  </span>
                </div>
                <p>Filesize: {Math.round((file?.size || 0) / 1024)} KB</p>
                <div className="pt-2">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                      hasGps
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                    }`}
                  >
                    <MapPin className="h-3 w-3" />
                    <span>{hasGps ? `GPS Locked (${gpsSource})` : "GPS Missing from EXIF"}</span>
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Step 2: Location Telemetry */}
        <div className="editorial-card space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                2
              </span>
              <h3 className="font-bold text-base text-foreground">
                Road Location & Coordinates
              </h3>
            </div>
            <span className="text-[11px] font-semibold text-muted-foreground">
              Required for municipal dispatch
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Latitude</label>
              <input
                type="number"
                step="any"
                value={coords.lat ?? ""}
                onChange={(e) => setCoords({ ...coords, lat: parseFloat(e.target.value) || null })}
                placeholder="e.g. 28.613939"
                required
                className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Longitude</label>
              <input
                type="number"
                step="any"
                value={coords.lon ?? ""}
                onChange={(e) => setCoords({ ...coords, lon: parseFloat(e.target.value) || null })}
                placeholder="e.g. 77.209021"
                required
                className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <button
              type="button"
              onClick={requestDeviceLocation}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-xs font-bold text-foreground shadow-xs hover:bg-accent transition"
            >
              <Compass className="h-3.5 w-3.5 text-primary" />
              <span>Use Current Device GPS</span>
            </button>
            <span className="text-xs text-muted-foreground">
              {hasGps ? `Source: ${gpsSource}` : "Manual coordinate input supported"}
            </span>
          </div>

          <div className="space-y-1.5 pt-2">
            <label className="text-xs font-bold text-foreground">
              Street Landmark / Ward Name (Optional)
            </label>
            <input
              type="text"
              value={addressText}
              onChange={(e) => setAddressText(e.target.value)}
              placeholder="e.g. Ring Road, Outer Lane near Sector 4 Flyover"
              className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
            />
          </div>
        </div>

        {/* Step 3: Grievance Context */}
        <div className="editorial-card space-y-4">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              3
            </span>
            <h3 className="font-bold text-base text-foreground">
              Grievance Context & Details
            </h3>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">Report Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Deep pothole damaging vehicle rims on main arterial corridor"
              className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">Description & Observed Danger</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Specify approximate depth, water-logging, or specific risks to two-wheelers..."
              className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-xs resize-none"
            />
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-4 pt-3">
          <button
            type="button"
            onClick={() => router.push("/citizen")}
            disabled={uploading}
            className="rounded-full px-6 py-3 text-xs font-bold text-muted-foreground hover:text-foreground transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={uploading || !file}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3.5 text-xs font-bold text-primary-foreground shadow-lg shadow-primary/25 hover:opacity-95 transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50"
          >
            {uploading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Running YOLO Analysis & Submitting...</span>
              </>
            ) : (
              <>
                <span>Submit Grievance to Municipality</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
