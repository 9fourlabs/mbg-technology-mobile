#!/usr/bin/env node
/**
 * Provision a new per-tenant Pocketbase instance on Fly.
 *
 * What this does:
 *   1. Renders `infra/pocketbase/fly.toml.tpl` for this tenant
 *   2. Runs `fly launch --copy-config --no-deploy` in the tenant org
 *   3. Creates the persistent volume (`pb_data_<tenant>`)
 *   4. Sets the PB admin password as a Fly secret
 *   5. Deploys — PB boots and auto-creates the SQLite DB on first start
 *   6. Waits for health, then seeds the collection schema via `importCollections()`
 *   7. Updates the admin DB `tenants` row: sets `pocketbase_url`, `pocketbase_app_name`, `backend = 'pocketbase'`
 *
 * Usage (from repo root):
 *   npx tsx scripts/provisionPocketbase.ts --tenant mbg --template content
 *
 * Env vars required:
 *   FLY_TENANTS_API_TOKEN  — org-scoped Fly API token for the tenant org
 *   FLY_TENANTS_ORG        — e.g. "mbg-tenants"
 *   PB_ADMIN_EMAIL         — admin account email, same across all PB instances
 *   PB_ADMIN_PASSWORD      — admin account password
 *   NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY — to update the tenant row
 *
 * Phase 0 note: this script is currently untested end-to-end. Phase 1 will
 * exercise it against a pilot tenant. Until then it's source code only.
 */

import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const TEMPLATES = [
  "content",
  "directory",
  "forms",
  "loyalty",
  "booking",
  "commerce",
  "events",
] as const;
type Template = (typeof TEMPLATES)[number];

interface Args {
  tenant: string;
  template: Template;
  region?: string;
}

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  const get = (flag: string) => {
    const i = argv.indexOf(flag);
    return i >= 0 ? argv[i + 1] : undefined;
  };

  const tenant = get("--tenant");
  const template = get("--template") as Template | undefined;
  const region = get("--region") ?? "iad";

  if (!tenant || !template) {
    console.error(
      "Usage: provisionPocketbase.ts --tenant <id> --template <type> [--region iad]"
    );
    process.exit(1);
  }
  if (!TEMPLATES.includes(template)) {
    console.error(`--template must be one of: ${TEMPLATES.join(", ")}`);
    process.exit(1);
  }
  return { tenant, template, region };
}

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    console.error(`Missing required env var: ${name}`);
    process.exit(1);
  }
  return v;
}

function renderTomlTemplate(tenant: string, region: string): string {
  const tplPath = path.resolve("infra/pocketbase/fly.toml.tpl");
  const tpl = readFileSync(tplPath, "utf-8");
  return tpl
    .replace(/\{\{APP_NAME\}\}/g, `mbg-pb-${tenant}`)
    .replace(/\{\{REGION\}\}/g, region)
    .replace(/\{\{VOLUME\}\}/g, `pb_data_${tenant.replace(/-/g, "_")}`);
}

function sh(cmd: string, env: Record<string, string> = {}): string {
  return execSync(cmd, {
    env: { ...process.env, ...env },
    encoding: "utf-8",
    stdio: ["inherit", "pipe", "inherit"],
  });
}

async function waitForHealth(url: string, timeoutMs = 60_000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${url}/api/health`);
      if (res.ok) return;
    } catch {
      // not ready yet
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error(`PB instance at ${url} did not become healthy in ${timeoutMs}ms`);
}

async function seedSchema(url: string, template: Template): Promise<void> {
  const schemaPath = path.resolve(
    `infra/pocketbase/schemas/${template}.json`
  );
  const collections = JSON.parse(readFileSync(schemaPath, "utf-8"));

  const { PocketbaseClient } = await import(
    "../admin/src/lib/pocketbase/client"
  );
  const client = new PocketbaseClient({
    url,
    adminEmail: requireEnv("PB_ADMIN_EMAIL"),
    adminPassword: requireEnv("PB_ADMIN_PASSWORD"),
  });
  await client.adminLogin();
  await client.importCollections(collections);
}

async function main() {
  const { tenant, template, region } = parseArgs();
  const appName = `mbg-pb-${tenant}`;
  const flyOrg = requireEnv("FLY_TENANTS_ORG");
  const flyToken = requireEnv("FLY_TENANTS_API_TOKEN");
  const pbAdminPassword = requireEnv("PB_ADMIN_PASSWORD");

  console.log(`▶ Provisioning Pocketbase for tenant "${tenant}" (${template})`);
  console.log(`  Fly org: ${flyOrg}  app: ${appName}  region: ${region}`);

  // 1. Write a transient fly.toml with tenant substitutions.
  const rendered = renderTomlTemplate(tenant, region);
  const tomlPath = path.resolve(`infra/pocketbase/fly.${tenant}.toml`);
  require("node:fs").writeFileSync(tomlPath, rendered, "utf-8");
  console.log(`  ✓ Rendered fly.toml → ${tomlPath}`);

  // 2. Create the Fly app in the tenant org.
  console.log("▶ Creating Fly app...");
  sh(
    `flyctl apps create ${appName} --org ${flyOrg}`,
    { FLY_ACCESS_TOKEN: flyToken }
  );

  // 3. Set the admin password secret BEFORE deploy so PB picks it up on boot.
  console.log("▶ Setting PB_ADMIN_PASSWORD secret...");
  sh(
    `flyctl secrets set PB_ADMIN_PASSWORD="${pbAdminPassword}" --app ${appName} --stage`,
    { FLY_ACCESS_TOKEN: flyToken }
  );

  // 4. Deploy — builds the Dockerfile, creates the volume on first deploy.
  console.log("▶ Deploying Pocketbase instance (builds + starts)...");
  sh(
    `flyctl deploy --remote-only --app ${appName} --config ${tomlPath} --dockerfile infra/pocketbase/Dockerfile`,
    { FLY_ACCESS_TOKEN: flyToken }
  );

  // 5. Wait for /api/health, then import the schema.
  const pbUrl = `https://${appName}.fly.dev`;
  console.log(`▶ Waiting for ${pbUrl}/api/health ...`);
  await waitForHealth(pbUrl);
  console.log(`  ✓ Instance is live`);

  console.log(`▶ Seeding "${template}" schema...`);
  await seedSchema(pbUrl, template);
  console.log(`  ✓ Collections imported`);

  // 6. Update admin DB tenant row.
  const supabase = createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY")
  );
  const { error } = await supabase
    .from("tenants")
    .update({
      pocketbase_url: pbUrl,
      pocketbase_app_name: appName,
      backend: "pocketbase",
    })
    .eq("id", tenant);
  if (error) throw error;
  console.log(`▶ Admin DB updated — tenant "${tenant}" now on backend=pocketbase`);

  console.log("\n✅ Done.");
  console.log(`   PB admin UI: ${pbUrl}/_/`);
  console.log(`   PB API:      ${pbUrl}/api/`);
}

main().catch((err) => {
  console.error("✗ Provisioning failed:", err);
  process.exit(1);
});
