"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCreate } from "@refinedev/core";
import type { ResourceDefinition } from "@/lib/refine/resource-registry";
import { FormField } from "./CmsFieldRenderers";

interface Props {
  tenantId: string;
  resource: ResourceDefinition;
}

export function CmsCreate({ tenantId, resource }: Props) {
  const router = useRouter();
  const { mutate: create, mutation: createMutation } = useCreate();
  const isLoading = createMutation.isPending;
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const setField = (name: string, value: unknown) =>
    setValues((v) => ({ ...v, [name]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Required-field validation
    for (const f of resource.fields) {
      if (f.required) {
        const v = values[f.name];
        if (v === undefined || v === null || v === "") {
          setErrorMsg(`${f.label} is required.`);
          return;
        }
      }
    }

    create(
      {
        resource: resource.name,
        values,
      },
      {
        onSuccess: () => {
          router.push(`/client/${tenantId}/cms/${resource.name}`);
        },
        onError: (err) => {
          setErrorMsg(
            err instanceof Error ? err.message : "Failed to create record",
          );
        },
      },
    );
  };

  return (
    <div className="px-6 py-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">
        New {resource.label}
      </h1>
      <p className="text-sm text-gray-500 mb-6">{resource.description}</p>

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
                disabled={isLoading}
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
            disabled={isLoading}
            className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? "Saving…" : `Create ${resource.label}`}
          </button>
        </div>
      </form>
    </div>
  );
}
