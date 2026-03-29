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
};

export default function FormModal({
  title,
  columns,
  initialValues,
  onSave,
  onClose,
  saving,
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
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-white mb-4">{title}</h2>

        <div className="flex flex-col gap-4">
          {visibleColumns.map((col) => (
            <FormField
              key={col.key}
              column={col}
              value={values[col.key]}
              onChange={handleChange}
              error={errors[col.key]}
            />
          ))}
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-800">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors rounded-lg border border-gray-700 hover:border-gray-600"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-lg"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
