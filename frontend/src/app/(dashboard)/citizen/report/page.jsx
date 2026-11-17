"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useDropzone } from "react-dropzone";
import EXIF from "exif-js";
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
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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
          // Fallback to browser Geolocation API
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
      const res = await fetch(`${apiUrl}/spatial/check-duplicate?latitude=${lat}&longitude=${lon}&radius_meters=15.0`, {
        method: "POST",
      });
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
      setError("Please specify coordinates. Click 'Use Current Location' or enter manually.");
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
        title: title || `Road Pothole Defect near ${addressText || "Detected Location"}`,
        description: description || `Severity: ${detectionData?.severity || "Assessed via computer vision"}.`,
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

      // Redirect to citizen grievances after 1.5s
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
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
          Report Road Hazard or Pothole
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Submit road imagery. Our YOLO vision engine classifies severity and checks for nearby duplicate reports automatically.
        </p>
      </div>

      {duplicateWarning && (
        <Alert variant="warning" className="border-amber-300 bg-amber-50 text-amber-900">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="font-semibold">Corroborating Existing Municipal Ticket</AlertTitle>
          <AlertDescription className="text-xs text-amber-800 mt-1">
            An active ticket <strong>{duplicateWarning.matched_ticket.ticket_number}</strong> ({duplicateWarning.matched_ticket.priority})
            already exists {duplicateWarning.distance_meters}m away. Your photo will be linked as supporting evidence, boosting its municipal priority!
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Submission Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Media Dropzone */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">1. Capture or Upload Media</CardTitle>
            <CardDescription>Upload road surface photos (JPEG, PNG, WebP) or video clips (MP4, MOV)</CardDescription>
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
                <div className="rounded-full bg-blue-50 p-3 text-blue-600">
                  <Upload className="h-6 w-6" />
                </div>
                <p className="text-sm font-medium text-slate-700">
                  Drag and drop road photo or video, or <span className="text-blue-600 underline">browse files</span>
                </p>
                <p className="text-xs text-slate-400">EXIF GPS metadata will be extracted automatically</p>
              </div>
            </div>

            {previewUrl && (
              <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center">
                <div className="relative h-28 w-44 overflow-hidden rounded-lg bg-slate-100">
                  {mediaType === "IMAGE" ? (
                    <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
                  ) : (
                    <video src={previewUrl} className="h-full w-full object-cover" controls />
                  )}
                </div>
                <div className="space-y-1 text-xs text-slate-600">
                  <p className="font-semibold text-slate-800 text-sm">{file?.name}</p>
                  <p>Type: {mediaType} ({Math.round((file?.size || 0) / 1024)} KB)</p>
                  <div className="flex items-center gap-2 pt-1">
                    <Badge variant={hasGps ? "success" : "warning"} className="text-[10px]">
                      {hasGps ? `GPS: ${gpsSource}` : "GPS: Missing from EXIF"}
                    </Badge>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Step 2: Location Telemetry */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">2. Road Location & Coordinates</CardTitle>
            <CardDescription>Associated GPS coordinates are required for municipal road repair dispatch</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Latitude</label>
                <Input
                  type="number"
                  step="any"
                  value={coords.lat ?? ""}
                  onChange={(e) => setCoords({ ...coords, lat: parseFloat(e.target.value) || null })}
                  placeholder="e.g. 28.613939"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Longitude</label>
                <Input
                  type="number"
                  step="any"
                  value={coords.lon ?? ""}
                  onChange={(e) => setCoords({ ...coords, lon: parseFloat(e.target.value) || null })}
                  placeholder="e.g. 77.209021"
                  required
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={requestDeviceLocation}
                className="gap-1.5 text-xs"
              >
                <Compass className="h-3.5 w-3.5 text-blue-600" />
                Use Current Device GPS
              </Button>
              <span className="text-xs text-slate-500">
                {hasGps ? `Source: ${gpsSource}` : "Coordinates required for dispatch"}
              </span>
            </div>

            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-semibold text-slate-700">Landmark or Street Address (Optional)</label>
              <Input
                value={addressText}
                onChange={(e) => setAddressText(e.target.value)}
                placeholder="e.g. Ring Road, Near Gate 3 Metro Station"
              />
            </div>
          </CardContent>
        </Card>

        {/* Step 3: Grievance Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">3. Additional Grievance Details</CardTitle>
            <CardDescription>Provide context regarding traffic impact or road hazard</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Complaint Title</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Deep pothole on outer right lane causing accidents"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Description</label>
              <Textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe size, depth, or specific danger to two-wheelers..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push("/citizen")}
            disabled={uploading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            size="lg"
            disabled={uploading || !file}
            className="gap-2 bg-blue-600 text-white hover:bg-blue-700 font-semibold shadow-md"
          >
            {uploading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Processing AI Telemetry & Submitting...
              </>
            ) : (
              <>
                Submit Grievance
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
