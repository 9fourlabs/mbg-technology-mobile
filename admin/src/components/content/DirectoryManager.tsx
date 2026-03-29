"use client";

import { DataTable } from "@/components/content/DataTable";
import { getSchemasForTemplate } from "@/lib/content-schemas";

const schemas = getSchemasForTemplate("directory");

export default function DirectoryManager({
  tenantId,
}: {
  tenantId: string;
}) {
  return <DataTable tenantId={tenantId} schema={schemas[0]} />;
}
