"use client";

import { useCallback, useEffect, useState } from "react";
import ImageUploader from "@/components/ImageUploader";

interface Asset {
  name: string;
  path: string;
  url: string;
  category: string;
  size: number;
  createdAt: string;
}

const CATEGORIES = [
  "logo",
  "card",
  "product",
  "post",
  "directory",
  "app-icon",
  "splash",
  "hero",
];

export default function AssetsManager({ tenantId }: { tenantId: string }) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);
  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/tenants/${tenantId}/assets`);
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to load assets");
        return;
      }
      const data = await res.json();
      setAssets(data);
    } catch {
      setError("Failed to load assets");
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const handleUpload = useCallback(() => {
    fetchAssets();
  }, [fetchAssets]);

  const handleDelete = useCallback(
    async (asset: Asset) => {
      if (!window.confirm(`Delete "${asset.name}"? This cannot be undone.`)) {
        return;
      }
      setDeleting(asset.path);
      try {
        const res = await fetch(`/api/tenants/${tenantId}/assets`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ path: asset.path }),
        });
        if (!res.ok) {
          const data = await res.json();
          alert(data.error ?? "Delete failed");
          return;
        }
        fetchAssets();
      } catch {
        alert("Delete failed. Please try again.");
      } finally {
        setDeleting(null);
      }
    },
    [tenantId, fetchAssets]
  );

  const handleCopy = useCallback((url: string, path: string) => {
    navigator.clipboard.writeText(url);
    setCopiedPath(path);
    setTimeout(() => setCopiedPath(null), 2000);
  }, []);

  // Group assets by category
  const grouped: Record<string, Asset[]> = {};
  for (const asset of assets) {
    if (!grouped[asset.category]) {
      grouped[asset.category] = [];
    }
    grouped[asset.category].push(asset);
  }

  const categoryKeys = Object.keys(grouped).sort();

  return (
    <div className="space-y-8">
      {/* Upload section */}
      <div className="rounded-xl bg-white border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">
          Upload Asset
        </h2>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-500">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <ImageUploader
              tenantId={tenantId}
              category={selectedCategory}
              onUpload={handleUpload}
              label="Image"
            />
          </div>
        </div>
      </div>

      {/* Assets list */}
      {loading ? (
        <div className="text-sm text-gray-500">Loading assets...</div>
      ) : error ? (
        <div className="rounded-xl bg-red-50 border border-red-200 p-6">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      ) : assets.length === 0 ? (
        <div className="rounded-xl bg-gray-50 border border-gray-200 p-8 text-center">
          <p className="text-sm text-gray-500">
            No assets uploaded yet. Use the uploader above to add images.
          </p>
        </div>
      ) : (
        categoryKeys.map((category) => (
          <div key={category}>
            <h3 className="text-sm font-semibold text-gray-900 mb-3 capitalize">
              {category}
            </h3>
            <div className="rounded-xl bg-white border border-gray-200 divide-y divide-gray-100">
              {grouped[category].map((asset) => (
                <div
                  key={asset.path}
                  className="flex items-center gap-4 px-4 py-3"
                >
                  {/* Thumbnail */}
                  <img
                    src={asset.url}
                    alt={asset.name}
                    className="w-12 h-12 rounded-lg object-cover border border-gray-200 bg-gray-50 flex-shrink-0"
                  />

                  {/* File name */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 truncate">
                      {asset.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {asset.size > 0
                        ? `${(asset.size / 1024).toFixed(1)} KB`
                        : ""}
                    </p>
                  </div>

                  {/* Copy URL */}
                  <button
                    onClick={() => handleCopy(asset.url, asset.path)}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium flex-shrink-0"
                  >
                    {copiedPath === asset.path ? "Copied!" : "Copy URL"}
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(asset)}
                    disabled={deleting === asset.path}
                    className="text-xs text-red-500 hover:text-red-700 font-medium flex-shrink-0 disabled:opacity-50"
                  >
                    {deleting === asset.path ? "Deleting..." : "Delete"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
