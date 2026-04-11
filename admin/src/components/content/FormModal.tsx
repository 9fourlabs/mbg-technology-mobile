"use client";

import { useState } from "react";
import FormField from "./FormField";

type ColumnDef = {
  key: string;
  label: string;
  type: string;
  formVisible: boolean;
  required: boolean;
  options?: { label: string; value: string }[];
  placeholder?: string;
};

type Props = {
  title: string;
  columns: ColumnDef[];
  initialValues?: Record<string, unknown>;
  onSave: (values: Record<string, unknown>) => Promise<void>;
  onClose: () => void;
  saving?: boolean;
  tenantId?: string;
};

export default function FormModal({
  title,
  columns,
  initialValues,
  onSave,
  onClose,
  saving,
  tenantId,
}: Props) {
  const visibleColumns = columns.filter((c) => c.formVisible);

  const [values, setValues] = useState<Record<string, unknown>>(() => {
    const init: Record<string, unknown> = {};
    for (const col of visibleColumns) {
      init[col.key] = initialValues?.[col.key] ?? (col.type === "boolean" ? false : "");
    }
    return init;
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (key: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleSubmit = async () => {
    const newErrors: Record<string, string> = {};

    for (const col of visibleColumns) {
      if (col.required) {
        const v = values[col.key];
        if (v === undefined || v === null || v === "") {
          newErrors[col.key] = `${col.label} is required`;
        }
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    await onSave(values);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-80 overflow-x-hidden overflow-y-auto bg-gray-900/60 backdrop-blur-sm flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white border border-gray-200 shadow-xl rounded-xl w-full max-w-lg m-4 max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center py-3 px-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-800">{title}</h3>
          <button
            type="button"
            className="size-8 inline-flex justify-center items-center gap-x-2 rounded-full border border-transparent bg-gray-100 text-gray-800 hover:bg-gray-200 focus:outline-none focus:bg-gray-200"
            onClick={onClose}
          >
            <span className="sr-only">Close</span>
            <svg className="shrink-0 size-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-4 overflow-y-auto flex flex-col gap-4">
          {visibleColumns.map((col) => (
            <FormField
              key={col.key}
              column={col}
              value={values[col.key]}
              onChange={handleChange}
              error={errors[col.key]}
              tenantId={tenantId}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="flex justify-end items-center gap-x-2 py-3 px-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-2xs hover:bg-gray-50 focus:outline-none focus:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-transparent bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
