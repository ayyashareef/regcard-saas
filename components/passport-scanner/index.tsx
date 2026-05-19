"use client";

import { useState, useRef } from "react";

interface PassportScannerProps {
  onScanResult: (result: {
    surname: string;
    givenNames: string;
    documentNumber: string;
    nationality: string;
    birthDate: string;
    expirationDate: string;
  }) => void;
  onNidResult?: (result: { idNumber: string }) => void;
  onPassportPhoto?: (base64: string) => void;
  idType?: string;
}

export function PassportScanner({ onScanResult, onNidResult, onPassportPhoto, idType }: PassportScannerProps) {
  const [tab, setTab] = useState<"upload" | "camera">("upload");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<{
    imageUrl: string;
    data: {
      surname: string;
      givenNames: string;
      documentNumber: string;
      nationality: string;
      birthDate: string;
      expirationDate: string;
    };
    confidence: number;
  } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  async function handleFile(file: File) {
    setLoading(true);
    setError("");
    setPreview(null);

    const formData = new FormData();
    formData.append("file", file);
    if (idType) formData.append("idType", idType);

    try {
      const res = await fetch("/api/scan", { method: "POST", body: formData });
      const json = await res.json();

      if (!res.ok) {
        setError(json.message || "Scan failed");
        return;
      }

      if (json.success) {
        const imageUrl = URL.createObjectURL(file);
        if (json.passportPhoto) onPassportPhoto?.(json.passportPhoto);
        if (json.type === "nid") {
          onNidResult?.(json.data);
        } else {
          setPreview({ imageUrl, data: json.data, confidence: json.confidence });
          onScanResult(json.data);
        }
      } else {
        // Even on MRZ fail, save the photo if returned
        if (json.passportPhoto) onPassportPhoto?.(json.passportPhoto);
        setError(json.message || "Could not read passport");
      }
    } catch {
      setError("Failed to process image. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleUseData() {
    if (preview) {
      onScanResult(preview.data);
      setPreview(null);
    }
  }

  function handleRescan() {
    setPreview(null);
    setError("");
    if (fileRef.current) fileRef.current.value = "";
  }

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      setError("Could not access camera");
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  async function capturePhoto() {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d")?.drawImage(videoRef.current, 0, 0);
    canvas.toBlob(async (blob) => {
      if (blob) {
        stopCamera();
        const file = new File([blob], "passport.jpg", { type: "image/jpeg" });
        await handleFile(file);
      }
    }, "image/jpeg");
  }

  return (
    <div className="space-y-4">
      {preview ? (
        <div className="bg-white border border-neutral-border rounded-xl p-5 space-y-4">
          <h4 className="font-semibold text-neutral-text">Scan Result</h4>
          <div className="flex gap-4">
            <img
              src={preview.imageUrl}
              alt="Scanned passport"
              className="w-32 h-auto rounded-lg border border-neutral-border object-cover"
            />
            <div className="flex-1 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-muted">Name</span>
                <span className="font-medium">{preview.data.givenNames} {preview.data.surname}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-muted">Document No</span>
                <span className="font-mono">{preview.data.documentNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-muted">Nationality</span>
                <span>{preview.data.nationality}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-muted">Date of Birth</span>
                <span>{preview.data.birthDate}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-muted">Confidence</span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  preview.confidence > 80
                    ? "bg-green-100 text-green-800"
                    : "bg-amber-100 text-amber-800"
                }`}>
                  {Math.round(preview.confidence)}%
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleUseData}
              className="bg-brand text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-light transition"
            >
              Use this data
            </button>
            <button
              type="button"
              onClick={handleRescan}
              className="px-4 py-2 rounded-lg border border-neutral-border text-sm font-medium text-neutral-text hover:bg-neutral-section transition"
            >
              Re-scan
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex rounded-lg overflow-hidden border border-neutral-border">
            <button
              type="button"
              onClick={() => { setTab("upload"); stopCamera(); }}
              className={`flex-1 py-2 text-sm font-medium transition ${
                tab === "upload" ? "bg-brand text-white" : "bg-neutral-section text-neutral-muted"
              }`}
            >
              Upload Photo
            </button>
            <button
              type="button"
              onClick={() => { setTab("camera"); startCamera(); }}
              className={`flex-1 py-2 text-sm font-medium transition ${
                tab === "camera" ? "bg-brand text-white" : "bg-neutral-section text-neutral-muted"
              }`}
            >
              Camera
            </button>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg border border-red-200">
              {error}
              <button type="button" onClick={handleRescan} className="ml-2 underline font-medium">
                Re-scan
              </button>
            </div>
          )}

          {tab === "upload" ? (
            <div className="border-2 border-dashed border-neutral-border rounded-xl p-8 text-center">
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
                className="hidden"
                id="passport-upload"
              />
              <label
                htmlFor="passport-upload"
                className="cursor-pointer space-y-2 block"
              >
                <div className="text-4xl">📸</div>
                <div className="text-sm font-medium text-neutral-text">
                  {loading ? "Scanning…" : idType === "MALDIVIAN" ? "Click to upload ID card photo" : "Click to upload passport photo"}
                </div>
                <div className="text-xs text-neutral-muted">JPEG, PNG, or WebP — max 5MB</div>
              </label>
            </div>
          ) : (
            <div className="space-y-3">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full rounded-xl border border-neutral-border"
              />
              <button
                type="button"
                onClick={capturePhoto}
                disabled={loading}
                className="w-full bg-brand text-white py-2 rounded-lg text-sm font-medium hover:bg-brand-light disabled:opacity-50 transition"
              >
                {loading ? "Processing…" : "Capture"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
