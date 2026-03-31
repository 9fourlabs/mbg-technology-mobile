"use client";

import { DataTable } from "@/components/content/DataTable";
import { getSchemasForTemplate } from "@/lib/content-schemas";

const schemas = getSchemasForTemplate("forms");

export default function FormsManager({ tenantId }: { tenantId: string }) {
  return (
    <div>
      <p className="text-sm text-gray-500 mb-4">
        Update submission status by clicking Edit.
      </p>
      <DataTable tenantId={tenantId} schema={schemas[0]} />
    </div>
  );
}
