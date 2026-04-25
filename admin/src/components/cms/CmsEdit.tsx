"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useOne, useUpdate } from "@refinedev/core";
import type { ResourceDefinition } from "@/lib/refine/resource-registry";
import { FormField } from "./CmsFieldRenderers";

interface Props {
  tenantId: string;
  resource: ResourceDefinition;
  recordId: string;
}

export function CmsEdit({ tenantId, resource, recordId }: Props) {
  const router = useRouter();
  const { query, result } = useOne({
    resource: resource.name,
    id: recordId,
  });
  const loading = query.isLoading;
  const error = query.error;
  const { mutate: update, mutation: updateMutation } = useUpdate();
  const saving = updateMutation.isPending;

  const [values, setValues] = useState<Record<string, unknown>>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Hydrate form when the record arrives.
  useEffect(() => {
    if (result) {
      setValues(result as Record<string, unknown>);
    }
  }, [result]);

  const setField = (name: string, value: unknown) =>
    setValues((v) => ({ ...v, [name]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    for (const f of resource.fields) {
      if (f.required) {
        const v = values[f.name];
        if (v === undefined || v === null || v === "") {
          setErrorMsg(`${f.label} is required.`);
          return;
        }
      }
    }

    // Strip system fields PB returns but doesn't accept on updates.
    const editable = Object.fromEntries(
      Object.entries(values).filter(
        ([k]) =>
          ![
            "id",
            "created",
            "updated",
            "created_at",
            "updated_at",
            "collectionId",
            "collectionName",
          ].includes(k),
      ),
    );

    update(
      {
        resource: resource.name,
        id: recordId,
        values: editable,
      },
      {
        onSuccess: () => {
          router.push(`/client/${tenantId}/cms/${resource.name}`);
        },
        onError: (err) => {
          setErrorMsg(
            err instanceof Error ? err.message : "Failed to save changes",
          );
        },
      },
    );
  };

  if (loading) {
    return (
      <div className="px-6 py-8 max-w-3xl mx-auto text-gray-500 text-sm">
        Loading…
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-6 py-8 max-w-3xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-md p-4 text-sm text-red-700">
          {String(error)}
        </div>
      </div>
    );
  }

  const titleField = resource.titleField ?? "title";
  const headerLabel =
    typeof values[titleField] === "string" && values[titleField]
      ? String(values[titleField])
      : `Edit ${resource.label}`;

  return (
    <div className="px-6 py-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">
        {headerLabel}
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        Editing {resource.label.toLowerCase()} · ID {recordId}
      </p>

      {errorMsg && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4 text-sm text-red-700">
          {errorMsg}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-md border border-gray-200 p-6 space-y-5"
      >
        <div className="grid grid-cols-2 gap-x-4 gap-y-5">
          {resource.fields.map((f) => (
            <div
              key={f.name}
              className={f.span === "half" ? "col-span-1" : "col-span-2"}
            >
              <label
                htmlFor={`field-${f.name}`}
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                {f.label}
                {f.required && <span className="text-red-500 ml-0.5">*</span>}
              </label>
              <FormField
                field={f}
                value={values[f.name]}
                onChange={(v) => setField(f.name, v)}
                disabled={saving}
              />
            </div>
          ))}
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={() =>
              router.push(`/client/${tenantId}/cms/${resource.name}`)
            }
            disabled={saving}
            className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
