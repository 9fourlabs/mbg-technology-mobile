"use client";

import { useState } from "react";

type ColumnDef = {
  key: string;
  label: string;
  type: string;
  required: boolean;
  options?: { label: string; value: string }[];
  placeholder?: string;
};

type Props = {
  column: ColumnDef;
  value: unknown;
  onChange: (key: string, value: unknown) => void;
  error?: string;
};

const inputClass =
  "bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none w-full";

export default function FormField({ column, value, onChange, error }: Props) {
  const [jsonError, setJsonError] = useState<string | null>(null);

  const handleJsonChange = (raw: string) => {
    setJsonError(null);
    try {
      const parsed = JSON.parse(raw);
      onChange(column.key, parsed);
    } catch {
      setJsonError("Invalid JSON");
      onChange(column.key, raw);
    }
  };

  const renderInput = () => {
    switch (column.type) {
      case "text":
      case "date":
      case "datetime":
        return (
          <input
            type="text"
            className={inputClass}
            placeholder={column.placeholder ?? ""}
            value={(value as string) ?? ""}
            onChange={(e) => onChange(column.key, e.target.value)}
          />
        );

      case "number":
        return (
          <input
            type="number"
            className={inputClass}
            placeholder={column.placeholder ?? ""}
            value={(value as string | number) ?? ""}
            onChange={(e) =>
              onChange(
                column.key,
                e.target.value === "" ? null : Number(e.target.value)
              )
            }
          />
        );

      case "decimal":
        return (
          <input
            type="number"
            step="0.01"
            className={inputClass}
            placeholder={column.placeholder ?? ""}
            value={(value as string | number) ?? ""}
            onChange={(e) =>
              onChange(
                column.key,
                e.target.value === "" ? null : Number(e.target.value)
              )
            }
          />
        );

      case "textarea":
        return (
          <textarea
            rows={4}
            className={inputClass}
            placeholder={column.placeholder ?? ""}
            value={(value as string) ?? ""}
            onChange={(e) => onChange(column.key, e.target.value)}
          />
        );

      case "boolean":
        return (
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={!!value}
              onChange={(e) => onChange(column.key, e.target.checked)}
            />
            <div className="w-11 h-6 bg-gray-700 peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
          </label>
        );

      case "select":
        return (
          <select
            className={inputClass}
            value={(value as string) ?? ""}
            onChange={(e) => onChange(column.key, e.target.value)}
          >
            <option value="">Select...</option>
            {column.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );

      case "json":
        return (
          <>
            <textarea
              rows={6}
              className={`${inputClass} font-mono`}
              placeholder={column.placeholder ?? '{ }'}
              value={
                typeof value === "string"
                  ? value
                  : value != null
                    ? JSON.stringify(value, null, 2)
                    : ""
              }
              onChange={(e) => handleJsonChange(e.target.value)}
            />
            {jsonError && (
              <p className="text-xs text-red-400 mt-1">{jsonError}</p>
            )}
          </>
        );

      default:
        return (
          <input
            type="text"
            className={inputClass}
            placeholder={column.placeholder ?? ""}
            value={(value as string) ?? ""}
            onChange={(e) => onChange(column.key, e.target.value)}
          />
        );
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-300 mb-1">
        {column.label}
        {column.required && <span className="text-red-400 ml-1">*</span>}
      </label>
      {renderInput()}
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  );
}
