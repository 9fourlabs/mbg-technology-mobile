"use client";

import { useCallback, useEffect, useState } from "react";
import FormModal from "./FormModal";

type ColumnDef = {
  key: string;
  label: string;
  type: string;
  tableVisible?: boolean;
  formVisible: boolean;
  required: boolean;
  options?: { label: string; value: string }[];
  placeholder?: string;
};

type TableSchema = {
  table: string;
  label: string;
  labelSingular: string;
  columns: ColumnDef[];
  readOnly: boolean;
  defaultSort: { column: string; ascending: boolean };
};

type Props = {
  tenantId: string;
  schema: TableSchema;
};

type ApiResponse = {
  data: Record<string, unknown>[];
  total: number;
  page: number;
  pageSize: number;
};

const PAGE_SIZE = 25;

function formatCellValue(value: unknown, type: string): React.ReactNode {
  if (value === null || value === undefined) {
    return <span className="text-gray-600">--</span>;
  }

  switch (type) {
    case "boolean":
      return (
        <span
          className={`inline-block w-2.5 h-2.5 rounded-full ${
            value ? "bg-green-500" : "bg-red-500"
          }`}
        />
      );

    case "json":
      try {
        const str =
          typeof value === "string" ? value : JSON.stringify(value);
        return (
          <span className="font-mono text-xs text-gray-500">
            {str.length > 50 ? str.slice(0, 50) + "..." : str}
          </span>
        );
      } catch {
        return String(value);
      }

    case "date":
    case "datetime":
      try {
        return new Date(value as string).toLocaleString();
      } catch {
        return String(value);
      }

    default:
      return String(value);
  }
}

export function DataTable({ tenantId, schema }: Props) {
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingRow, setEditingRow] = useState<Record<string, unknown> | null>(
    null
  );
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const visibleColumns = schema.columns.filter((c) => c.tableVisible !== false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/tenants/${tenantId}/content?table=${schema.table}&page=${page}&pageSize=${PAGE_SIZE}`
      );
      if (!res.ok) throw new Error("Failed to fetch");
      const json: ApiResponse = await res.json();
      setData(json.data);
      setTotal(json.total);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  }, [tenantId, schema.table, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreate = () => {
    setEditingRow(null);
    setShowModal(true);
  };

  const handleEdit = (row: Record<string, unknown>) => {
    setEditingRow(row);
    setShowModal(true);
  };

  const handleSave = async (values: Record<string, unknown>) => {
    setSaving(true);
    try {
      const isEdit = editingRow !== null;
      const url = `/api/tenants/${tenantId}/content`;
      const body = isEdit
        ? { table: schema.table, rowId: editingRow.id, ...values }
        : { table: schema.table, ...values };

      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Failed to save");
      await fetchData();
    } catch (err) {
      console.error("Error saving:", err);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (rowId: string) => {
    try {
      const res = await fetch(`/api/tenants/${tenantId}/content`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table: schema.table, rowId }),
      });
      if (!res.ok) throw new Error("Failed to delete");
      setDeleteConfirm(null);
      await fetchData();
    } catch (err) {
      console.error("Error deleting:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <svg
          className="animate-spin h-6 w-6 text-gray-500"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      {!schema.readOnly && (
        <div className="flex justify-end mb-4">
          <button
            onClick={handleCreate}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Add {schema.labelSingular}
          </button>
        </div>
      )}

      {/* Table */}
      {data.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400 text-sm">No {schema.label} found</p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                {visibleColumns.map((col) => (
                  <th
                    key={col.key}
                    className="text-xs font-medium text-gray-500 uppercase text-left px-4 py-3"
                  >
                    {col.label}
                  </th>
                ))}
                {!schema.readOnly && (
                  <th className="text-xs font-medium text-gray-500 uppercase text-right px-4 py-3">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr
                  key={(row.id as string) ?? i}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  {visibleColumns.map((col) => (
                    <td
                      key={col.key}
                      className="text-sm text-gray-600 px-4 py-3"
                    >
                      {formatCellValue(row[col.key], col.type)}
                    </td>
                  ))}
                  {!schema.readOnly && (
                    <td className="text-right px-4 py-3">
                      {deleteConfirm === (row.id as string) ? (
                        <span className="flex items-center justify-end gap-2">
                          <span className="text-xs text-gray-500">
                            Delete?
                          </span>
                          <button
                            onClick={() =>
                              handleDelete(row.id as string)
                            }
                            className="text-xs text-red-600 hover:text-red-500 font-medium"
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="text-xs text-gray-400 hover:text-gray-600"
                          >
                            No
                          </button>
                        </span>
                      ) : (
                        <span className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(row)}
                            className="text-xs text-blue-600 hover:text-blue-500 font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() =>
                              setDeleteConfirm(row.id as string)
                            }
                            className="text-xs text-red-600 hover:text-red-500 font-medium"
                          >
                            Delete
                          </button>
                        </span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-900 border border-gray-300 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <span className="text-sm text-gray-400">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-900 border border-gray-300 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <FormModal
          title={
            editingRow
              ? `Edit ${schema.labelSingular}`
              : `Add ${schema.labelSingular}`
          }
          columns={schema.columns}
          initialValues={editingRow ?? undefined}
          onSave={handleSave}
          onClose={() => setShowModal(false)}
          saving={saving}
          tenantId={tenantId}
        />
      )}
    </div>
  );
}

export default DataTable;
