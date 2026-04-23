/**
 * Canonical hash of a tenant config, used to detect unpublished changes
 * between the draft in `tenants.config` and what was stamped onto the
 * most recent successful build in `builds.config_hash`.
 *
 * Must produce identical output in browser and Node — both ship Web Crypto
 * in the runtimes we target (Node 20+, all modern browsers).
 */

function canonicalize(value: unknown): string {
  if (value === null || value === undefined) return "null";
  if (typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map(canonicalize).join(",")}]`;
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys
    .map((k) => `${JSON.stringify(k)}:${canonicalize(obj[k])}`)
    .join(",")}}`;
}

export async function hashConfig(config: unknown): Promise<string> {
  const canonical = canonicalize(config ?? {});
  const data = new TextEncoder().encode(canonical);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .slice(0, 8)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
