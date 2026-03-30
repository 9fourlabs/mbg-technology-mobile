"use client";

import { useCallback, useRef, useState } from "react";

type Props = {
  tenantId: string;
  category: string;
  currentUrl?: string;
  onUpload: (url: string) => void;
  label?: string;
};

export default function ImageUploader({
  tenantId,
  category,
  currentUrl,
  onUpload,
  label,
}: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(currentUrl);
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = useCallback(
    async (file: File) => {
      setError(null);
      setUploading(true);

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("tenantId", tenantId);
        formData.append("category", category);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error ?? "Upload failed");
          setUploading(false);
          return;
        }

        setPreviewUrl(data.url);
        onUpload(data.url);
      } catch {
        setError("Upload failed. Please try again.");
      }

      setUploading(false);
    },
    [tenantId, category, onUpload]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) upload(file);
    },
    [upload]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) upload(file);
    },
    [upload]
  );

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="text-sm font-medium text-gray-300">{label}</label>
      )}

      {/* Current image preview */}
      {previewUrl && (
        <div className="flex items-center gap-3 mb-1">
          <img
            src={previewUrl}
            alt={label ?? "Preview"}
            className="w-12 h-12 rounded-lg object-cover border border-gray-700 bg-gray-800"
          />
          <span className="text-xs text-gray-500 truncate max-w-xs">
            {previewUrl}
          </span>
        </div>
      )}

      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-6 cursor-pointer transition-colors ${
          dragOver
            ? "border-[#2563EB] bg-gray-800/80"
            : "border-gray-700 bg-gray-800 hover:border-[#2563EB]"
        }`}
      >
        {uploading ? (
          <svg
            className="animate-spin h-6 w-6 text-gray-400"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        ) : (
          <>
            <svg
              className="w-6 h-6 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
              />
            </svg>
            <span className="text-sm text-gray-400">
              Click or drag image here
            </span>
          </>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      <p className="text-xs text-gray-600">
        PNG, JPG, GIF, WebP, SVG — max 5MB
      </p>

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
