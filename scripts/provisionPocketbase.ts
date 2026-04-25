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

import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import path from "node:path";

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
  // Trim trailing whitespace/CR — defensive against GH-secret-from-pipe bugs
  // (see feedback_secret_hygiene.md). Log a warning if trimming changes the
  // value so future debug sessions know the secret is malformed in storage.
  const trimmed = v.replace(/\s+$/u, "");
  if (trimmed.length !== v.length) {
    console.warn(
      `⚠ env var ${name} had ${v.length - trimmed.length} trailing whitespace char(s) — trimmed for use; consider re-setting the secret from a file`,
    );
  }
  return trimmed;
}

function renderTomlTemplate(tenant: string, region: string): string {
  const tplPath = path.resolve("infra/pocketbase/fly.toml.tpl");
  const tpl = readFileSync(tplPath, "utf-8");
  return tpl
    .replace(/\{\{APP_NAME\}\}/g, `mbg-pb-${tenant}`)
    .replace(/\{\{REGION\}\}/g, region)
    .replace(/\{\{VOLUME\}\}/g, `pb_data_${tenant.replace(/-/g, "_")}`);
}

function sh(
  cmd: string,
  env: Record<string, string> = {},
  cwd?: string,
): string {
  return execSync(cmd, {
    env: { ...process.env, ...env },
    cwd,
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

/**
 * Wait for the entrypoint's `pocketbase admin create` to finish.
 *
 * /api/health goes 200 the moment `pocketbase serve` binds the port — which
 * happens BEFORE the entrypoint's `admin create` runs (the entrypoint waits
 * on its own local health first). So there's a window where the instance
 * is "healthy" but no admin record exists yet, and adminLogin returns 400.
 *
 * Retry with backoff until adminLogin succeeds or we time out.
 */
async function waitForAdminAuth(
  url: string,
  email: string,
  password: string,
  timeoutMs = 60_000,
): Promise<void> {
  const { PocketbaseClient, PocketbaseError } = await import(
    "../admin/src/lib/pocketbase/client"
  );
  const start = Date.now();
  let lastErr: unknown;
  let attempts = 0;
  while (Date.now() - start < timeoutMs) {
    attempts++;
    const client = new PocketbaseClient({ url, adminEmail: email, adminPassword: password });
    try {
      await client.adminLogin();
      console.log(`  ✓ adminLogin succeeded on attempt ${attempts}`);
      return;
    } catch (err) {
      lastErr = err;
      // Only retry on "no admin yet" — any other error is permanent.
      const isTransient =
        err instanceof PocketbaseError &&
        (err.status === 400 || err.status === 404);
      if (!isTransient) throw err;
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error(
    `adminLogin did not succeed in ${timeoutMs}ms (${attempts} attempts). ` +
      `Last error: ${lastErr instanceof Error ? lastErr.message : String(lastErr)}`,
  );
}

async function seedSchema(
  url: string,
  template: Template,
  email: string,
  password: string,
): Promise<void> {
  const schemaPath = path.resolve(
    `infra/pocketbase/schemas/${template}.json`
  );
  const collections = JSON.parse(readFileSync(schemaPath, "utf-8"));

  const { PocketbaseClient } = await import(
    "../admin/src/lib/pocketbase/client"
  );
  const client = new PocketbaseClient({
    url,
    adminEmail: email,
    adminPassword: password,
  });
  await client.adminLogin();
  await client.importCollections(collections);
}

async function main() {
  const { tenant, template, region } = parseArgs();
  const appName = `mbg-pb-${tenant}`;
  const flyOrg = requireEnv("FLY_TENANTS_ORG");
  const flyToken = requireEnv("FLY_TENANTS_API_TOKEN");
  const pbAdminEmail = requireEnv("PB_ADMIN_EMAIL");
  const pbAdminPassword = requireEnv("PB_ADMIN_PASSWORD");

  console.log(`▶ Provisioning Pocketbase for tenant "${tenant}" (${template})`);
  console.log(`  Fly org: ${flyOrg}  app: ${appName}  region: ${region}`);
  console.log(`  PB admin email length: ${pbAdminEmail.length}, password length: ${pbAdminPassword.length}`);

  // 1. Write a transient fly.toml with tenant substitutions.
  const rendered = renderTomlTemplate(tenant, region);
  const tomlPath = path.resolve(`infra/pocketbase/fly.${tenant}.toml`);
  writeFileSync(tomlPath, rendered, "utf-8");
  console.log(`  ✓ Rendered fly.toml → ${tomlPath}`);

  // Set flyctl auth env var at the parent-process level so every flyctl
  // child inherits it naturally. (GA dispatch surfaced quirks with
  // per-call env overrides and the --access-token flag for some
  // subcommands — setting at parent level is the most reliable.)
  process.env.FLY_API_TOKEN = flyToken;
  process.env.FLY_ACCESS_TOKEN = flyToken;

  // 2. Create the Fly app in the tenant org (idempotent).
  console.log("▶ Creating Fly app...");
  let exists = false;
  try {
    const appsList = execSync(`flyctl apps list -o ${flyOrg} --json`, {
      stdio: ["inherit", "pipe", "inherit"],
      encoding: "utf-8",
    });
    const apps = JSON.parse(appsList) as Array<{ Name: string }>;
    exists = apps.some((a) => a.Name === appName);
  } catch {
    // If listing fails entirely, fall through and let `apps create` surface
    // the real error.
  }
  if (exists) {
    console.log(`  ○ App ${appName} already exists — reusing`);
  } else {
    sh(`flyctl apps create ${appName} --org ${flyOrg}`);
  }

  // 3. Set the admin password secret BEFORE deploy so PB picks it up on boot.
  console.log("▶ Setting PB_ADMIN_PASSWORD secret...");
  sh(
    `flyctl secrets set PB_ADMIN_PASSWORD="${pbAdminPassword}" --app ${appName} --stage`,
  );

  // 4. Deploy — builds the Dockerfile, creates the volume on first deploy.
  //    Run from infra/pocketbase/ so Docker's build context sees Dockerfile
  //    + entrypoint.sh as siblings.
  console.log("▶ Deploying Pocketbase instance (builds + starts)...");
  const infraDir = path.resolve("infra/pocketbase");
  sh(
    `flyctl deploy --remote-only --app ${appName} --config ${tomlPath}`,
    {},
    infraDir,
  );

  // 5. Wait for /api/health, then for admin bootstrap, then import schema.
  //    /api/health responds the moment `pocketbase serve` binds the port,
  //    but the entrypoint runs `admin create` AFTER its own local health
  //    wait — so there's a window where the instance is "live" but no admin
  //    exists. waitForAdminAuth bridges that race.
  const pbUrl = `https://${appName}.fly.dev`;
  console.log(`▶ Waiting for ${pbUrl}/api/health ...`);
  await waitForHealth(pbUrl);
  console.log(`  ✓ Instance is live`);

  console.log(`▶ Waiting for admin bootstrap (entrypoint admin create)...`);
  await waitForAdminAuth(pbUrl, pbAdminEmail, pbAdminPassword);

  console.log(`▶ Seeding "${template}" schema...`);
  await seedSchema(pbUrl, template, pbAdminEmail, pbAdminPassword);
  console.log(`  ✓ Collections imported`);

  // 6. Update admin DB tenant row via PostgREST (dep-free).
  const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const updateRes = await fetch(
    `${supabaseUrl}/rest/v1/tenants?id=eq.${encodeURIComponent(tenant)}`,
    {
      method: "PATCH",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        pocketbase_url: pbUrl,
        pocketbase_app_name: appName,
        backend: "pocketbase",
      }),
    }
  );
  if (!updateRes.ok) {
    const body = await updateRes.text();
    throw new Error(
      `Admin DB update failed: HTTP ${updateRes.status} ${body}`
    );
  }
  console.log(`▶ Admin DB updated — tenant "${tenant}" now on backend=pocketbase`);

  console.log("\n✅ Done.");
  console.log(`   PB admin UI: ${pbUrl}/_/`);
  console.log(`   PB API:      ${pbUrl}/api/`);
}

main().catch((err) => {
  console.error("✗ Provisioning failed:", err);
  process.exit(1);
});
