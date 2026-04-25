"use client";

import Link from "next/link";
import { useTable, useDelete } from "@refinedev/core";
import type { ResourceDefinition } from "@/lib/refine/resource-registry";
import { renderCellValue } from "./CmsFieldRenderers";

interface Props {
  tenantId: string;
  resource: ResourceDefinition;
}

export function CmsList({ tenantId, resource }: Props) {
  const {
    tableQuery,
    currentPage,
    setCurrentPage,
    pageCount,
    pageSize,
    result,
  } = useTable({
    resource: resource.name,
    pagination: { currentPage: 1, pageSize: 25 },
    sorters: { initial: [{ field: "created_at", order: "desc" }] },
  });

  const { mutate: deleteRow, mutation: deleteMutation } = useDelete();
  const deleting = deleteMutation.isPending;

  const visibleFields = resource.fields.filter((f) => f.showInList);
  const records = (result.data ?? []) as Array<Record<string, unknown>>;
  const total = result.total ?? 0;

  const handleDelete = (id: string) => {
    if (
      !confirm(
        `Delete this ${resource.label.toLowerCase()}? This cannot be undone.`,
      )
    ) {
      return;
    }
    deleteRow({ resource: resource.name, id });
  };

  return (
    <div className="px-6 py-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {resource.pluralLabel}
          </h1>
          <p className="text-sm text-gray-500 mt-1">{resource.description}</p>
        </div>
        <Link
          href={`/client/${tenantId}/cms/${resource.name}/create`}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition"
        >
          + New {resource.label}
        </Link>
      </div>

      {tableQuery.isLoading ? (
        <div className="text-gray-500 text-sm py-8 text-center">Loading…</div>
      ) : tableQuery.error ? (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-700 text-sm">
          Failed to load: {String(tableQuery.error)}
        </div>
      ) : records.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-md p-12 text-center">
          <p className="text-gray-600 mb-4">
            No {resource.pluralLabel.toLowerCase()} yet.
          </p>
          <Link
            href={`/client/${tenantId}/cms/${resource.name}/create`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition"
          >
            Create your first {resource.label.toLowerCase()}
          </Link>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-md border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {visibleFields.map((f) => (
                    <th
                      key={f.name}
                      className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {f.label}
                    </th>
                  ))}
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {records.map((row) => {
                  const id = String(row.id);
                  return (
                    <tr key={id} className="hover:bg-gray-50">
                      {visibleFields.map((f) => (
                        <td
                          key={f.name}
                          className="px-4 py-3 text-sm text-gray-900"
                        >
                          {renderCellValue(row[f.name], f.kind)}
                        </td>
                      ))}
                      <td className="px-4 py-3 text-right text-sm">
                        <Link
                          href={`/client/${tenantId}/cms/${resource.name}/edit/${id}`}
                          className="text-blue-600 hover:text-blue-700 font-medium mr-4"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(id)}
                          disabled={deleting}
                          className="text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {pageCount > 1 && (
            <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
              <div>
                Showing {(currentPage - 1) * pageSize + 1}–
                {Math.min(currentPage * pageSize, total)} of {total}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    setCurrentPage(Math.max(1, currentPage - 1))
                  }
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-200 rounded disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="px-3 py-1">
                  Page {currentPage} of {pageCount}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage(Math.min(pageCount, currentPage + 1))
                  }
                  disabled={currentPage === pageCount}
                  className="px-3 py-1 border border-gray-200 rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
