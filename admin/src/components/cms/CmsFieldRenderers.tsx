"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import type { FieldKind, ResourceField } from "@/lib/refine/resource-registry";
import { RichTextEditor } from "./RichTextEditor";

/**
 * Format a single cell value for display in the list view.
 */
export function renderCellValue(value: unknown, kind: FieldKind): string {
  if (value === null || value === undefined || value === "") {
    return "—";
  }
  switch (kind) {
    case "boolean":
      return value ? "Yes" : "No";
    case "date":
    case "datetime": {
      const d = new Date(String(value));
      if (isNaN(d.getTime())) return String(value);
      return kind === "date"
        ? d.toLocaleDateString()
        : d.toLocaleString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
          });
    }
    case "number":
      return Number(value).toLocaleString();
    case "url":
      return String(value).length > 40
        ? String(value).slice(0, 37) + "…"
        : String(value);
    default: {
      const s = String(value);
      return s.length > 80 ? s.slice(0, 77) + "…" : s;
    }
  }
}

/** Render a single form input for a field. */
interface FormFieldProps {
  field: ResourceField;
  value: unknown;
  onChange: (value: unknown) => void;
  disabled?: boolean;
}

export function FormField({
  field,
  value,
  onChange,
  disabled,
}: FormFieldProps) {
  const id = `field-${field.name}`;
  const inputClass =
    "w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500";

  // For datetime, normalize the ISO string to the format <input type="datetime-local"> expects
  const datetimeValue =
    typeof value === "string" && value
      ? value.slice(0, 16) // "2026-04-25T15:30:00.000Z" → "2026-04-25T15:30"
      : "";

  switch (field.kind) {
    case "textarea":
      return (
        <textarea
          id={id}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          rows={4}
          className={inputClass}
        />
      );
    case "richtext":
      return (
        <RichTextEditor
          id={id}
          value={typeof value === "string" ? value : ""}
          onChange={(html) => onChange(html)}
          disabled={disabled}
        />
      );
    case "boolean":
      return (
        <label className="inline-flex items-center gap-2 text-sm text-gray-900">
          <input
            id={id}
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => onChange(e.target.checked)}
            disabled={disabled}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span>Enabled</span>
        </label>
      );
    case "number":
      return (
        <input
          id={id}
          type="number"
          value={typeof value === "number" ? value : ""}
          onChange={(e) => {
            const v = e.target.value;
            onChange(v === "" ? null : Number(v));
          }}
          disabled={disabled}
          className={inputClass}
        />
      );
    case "date":
      return (
        <input
          id={id}
          type="date"
          value={
            typeof value === "string" && value ? value.slice(0, 10) : ""
          }
          onChange={(e) => onChange(e.target.value || null)}
          disabled={disabled}
          className={inputClass}
        />
      );
    case "datetime":
      return (
        <input
          id={id}
          type="datetime-local"
          value={datetimeValue}
          onChange={(e) =>
            onChange(e.target.value ? new Date(e.target.value).toISOString() : null)
          }
          disabled={disabled}
          className={inputClass}
        />
      );
    case "select":
      return (
        <select
          id={id}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value || null)}
          disabled={disabled}
          className={inputClass}
        >
          <option value="">— Select —</option>
          {(field.options ?? []).map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      );
    case "url":
      return (
        <input
          id={id}
          type="url"
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value || null)}
          disabled={disabled}
          className={inputClass}
          placeholder="https://…"
        />
      );
    case "email":
      return (
        <input
          id={id}
          type="email"
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value || null)}
          disabled={disabled}
          className={inputClass}
        />
      );
    case "image":
      return (
        <ImageField
          id={id}
          value={typeof value === "string" ? value : ""}
          onChange={onChange}
          disabled={disabled}
        />
      );
    default:
      return (
        <input
          id={id}
          type="text"
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={inputClass}
        />
      );
  }
}

interface ImageFieldProps {
  id: string;
  value: string;
  onChange: (value: unknown) => void;
  disabled?: boolean;
}

function ImageField({ id, value, onChange, disabled }: ImageFieldProps) {
  const params = useParams<{ tenantId?: string }>();
  const tenantId = params?.tenantId;
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputClass =
    "w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500";

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !tenantId) return;
    setError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("tenantId", tenantId);
      fd.append("category", "post");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      const body = (await res.json()) as { url: string };
      onChange(body.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      // reset input so the same file can be re-selected
      e.target.value = "";
    }
  }

  return (
    <div className="space-y-2">
      {value ? (
        <div className="relative inline-block">
          <img
            src={value}
            alt=""
            className="max-h-32 rounded-md border border-gray-200"
          />
          <button
            type="button"
            onClick={() => onChange(null)}
            disabled={disabled}
            className="absolute top-1 right-1 bg-white border border-gray-300 rounded-full size-6 flex items-center justify-center text-gray-600 hover:text-red-600 hover:border-red-300 disabled:opacity-50"
            title="Remove image"
          >
            ×
          </button>
        </div>
      ) : null}
      <div className="flex gap-2">
        <input
          id={id}
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value || null)}
          disabled={disabled || uploading}
          placeholder="https://… or upload below"
          className={inputClass}
        />
        <label
          className={`shrink-0 cursor-pointer px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50 hover:bg-gray-100 ${
            disabled || uploading ? "opacity-50 pointer-events-none" : ""
          }`}
        >
          {uploading ? "Uploading…" : "Upload"}
          <input
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/gif,image/webp,image/svg+xml"
            onChange={handleFileSelect}
            disabled={disabled || uploading}
            className="hidden"
          />
        </label>
      </div>
      {error ? (
        <p className="text-xs text-red-600">{error}</p>
      ) : (
        <p className="text-xs text-gray-400">
          Paste a URL or upload an image (max 5MB; PNG/JPG/GIF/WebP/SVG).
        </p>
      )}
    </div>
  );
}
