"use client";

import type { FieldKind, ResourceField } from "@/lib/refine/resource-registry";

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
      // Note: this is a textarea today. A real rich-text editor (TipTap,
      // Lexical) is a follow-up. The mobile app rendering tolerates plain
      // text; markdown is the path of least resistance.
      return (
        <textarea
          id={id}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          rows={10}
          placeholder="Plain text or Markdown — rich text editor coming soon"
          className={`${inputClass} font-mono text-xs`}
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
