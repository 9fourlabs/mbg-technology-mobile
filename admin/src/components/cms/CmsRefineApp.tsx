"use client";

/**
 * Refine app shell for the customer-managed CMS at
 * `/client/[tenantId]/cms/[resource]`.
 *
 * Renders one of <CmsList | CmsCreate | CmsEdit> based on the URL action.
 * The Refine provider wires up data fetching, mutation, caching, and
 * navigation; the views themselves are plain React + Tailwind to match
 * the rest of the admin portal (no UI kit dependency).
 */

import { Refine, type Action } from "@refinedev/core";
import routerProvider from "@refinedev/nextjs-router";
import { useMemo } from "react";
import { buildTenantContentDataProvider } from "@/lib/refine/tenant-content-data-provider";
import {
  type ResourceDefinition,
  getResourcesForTemplate,
} from "@/lib/refine/resource-registry";
import { CmsList } from "./CmsList";
import { CmsCreate } from "./CmsCreate";
import { CmsEdit } from "./CmsEdit";

export interface CmsRefineAppProps {
  tenantId: string;
  templateType: string;
  resource: ResourceDefinition;
  /** Refine action: "list" (default), "create", or "edit". */
  action: Action;
  /** Record id when action is "edit". */
  recordId?: string;
}

export function CmsRefineApp({
  tenantId,
  templateType,
  resource,
  action,
  recordId,
}: CmsRefineAppProps) {
  const dataProvider = useMemo(
    () => buildTenantContentDataProvider({ tenantId }),
    [tenantId],
  );

  const resources = useMemo(
    () =>
      getResourcesForTemplate(templateType).map((r) => ({
        name: r.name,
        list: `/client/${tenantId}/cms/${r.name}`,
        create: `/client/${tenantId}/cms/${r.name}/create`,
        edit: `/client/${tenantId}/cms/${r.name}/edit/:id`,
        meta: { label: r.pluralLabel, canDelete: true },
      })),
    [templateType, tenantId],
  );

  return (
    <Refine
      dataProvider={dataProvider}
      routerProvider={routerProvider}
      resources={resources}
      options={{
        syncWithLocation: true,
        warnWhenUnsavedChanges: true,
        disableTelemetry: true,
      }}
    >
      {action === "list" && (
        <CmsList tenantId={tenantId} resource={resource} />
      )}
      {action === "create" && (
        <CmsCreate tenantId={tenantId} resource={resource} />
      )}
      {action === "edit" && recordId && (
        <CmsEdit
          tenantId={tenantId}
          resource={resource}
          recordId={recordId}
        />
      )}
    </Refine>
  );
}
