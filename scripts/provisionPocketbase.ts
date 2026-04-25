#!/usr/bin/env node
/**
 * Provision a Pocketbase instance on Fly. Two modes:
 *
 *   1. Tenant mode (default): `--tenant <id> --template <type>`
 *      Provisions `mbg-pb-<id>` for one tenant's content. Updates the admin
 *      DB `tenants` row to set `pocketbase_url` + `backend='pocketbase'`.
 *
 *   2. Admin mode: `--admin`
 *      Provisions `mbg-pb-admin` — the central admin DB replacement (Supabase
 *      → Pocketbase migration, Phase A). Seeds `admin.json` schema. Skips
 *      tenant-row update (it IS the tenant registry).
 *
 * What it does, both modes:
 *   1. Renders `infra/pocketbase/fly.toml.tpl` with substituted app name + volume
 *   2. Creates the Fly app in the target org (idempotent)
 *   3. Sets PB_ADMIN_PASSWORD as a Fly secret
 *   4. Deploys — PB boots and auto-creates the SQLite DB on first start
 *   5. Waits for /api/health + admin auth, then seeds the collection schema
 *
 * Usage (from repo root):
 *   # Tenant mode
 *   npx tsx scripts/provisionPocketbase.ts --tenant mbg --template content
 *
 *   # Admin mode (Supabase replacement)
 *   npx tsx scripts/provisionPocketbase.ts --admin
 *
 * Env vars required:
 *   FLY_TENANTS_API_TOKEN  — Fly API token (token must reach the target org)
 *   FLY_TENANTS_ORG        — Fly org slug (admin mode reuses the same token/org
 *                            today; later phases may move admin to 9four-labs)
 *   PB_ADMIN_PASSWORD      — admin account password (1Password: Pocketbase Admin)
 *   NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY — only required in
 *                            tenant mode for the post-deploy tenant-row update
 *
 * Email is sourced from `admin/src/lib/pocketbase/constants.ts` (project
 * constant, not a GH secret).
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

type Args =
  | { mode: "tenant"; tenant: string; template: Template; region: string }
  | { mode: "admin"; region: string };

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  const get = (flag: string) => {
    const i = argv.indexOf(flag);
    return i >= 0 ? argv[i + 1] : undefined;
  };

  const region = get("--region") ?? "iad";

  if (argv.includes("--admin")) {
    return { mode: "admin", region };
  }

  const tenant = get("--tenant");
  const template = get("--template") as Template | undefined;

  if (!tenant || !template) {
    console.error(
      "Usage:\n" +
        "  provisionPocketbase.ts --tenant <id> --template <type> [--region iad]\n" +
        "  provisionPocketbase.ts --admin [--region iad]"
    );
    process.exit(1);
  }
  if (!TEMPLATES.includes(template)) {
    console.error(`--template must be one of: ${TEMPLATES.join(", ")}`);
    process.exit(1);
  }
  return { mode: "tenant", tenant, template, region };
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

function renderTomlTemplate(
  appName: string,
  volumeName: string,
  region: string,
): string {
  const tplPath = path.resolve("infra/pocketbase/fly.toml.tpl");
  const tpl = readFileSync(tplPath, "utf-8");
  return tpl
    .replace(/\{\{APP_NAME\}\}/g, appName)
    .replace(/\{\{REGION\}\}/g, region)
    .replace(/\{\{VOLUME\}\}/g, volumeName);
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
  schemaName: Template | "admin",
  email: string,
  password: string,
): Promise<void> {
  const schemaPath = path.resolve(
    `infra/pocketbase/schemas/${schemaName}.json`
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

interface ProvisionParams {
  appName: string;
  volumeName: string;
  region: string;
  flyOrg: string;
  flyToken: string;
  pbAdminEmail: string;
  pbAdminPassword: string;
  schemaName: Template | "admin";
  /** A label like "tenant \"mbg\" (content)" for log lines. */
  label: string;
}

/**
 * Core provisioning routine — shared by tenant and admin modes.
 * Returns the live PB URL on success.
 */
async function provisionInstance(p: ProvisionParams): Promise<string> {
  console.log(`▶ Provisioning Pocketbase for ${p.label}`);
  console.log(`  Fly org: ${p.flyOrg}  app: ${p.appName}  region: ${p.region}`);
  console.log(
    `  PB admin email: ${p.pbAdminEmail} (password length: ${p.pbAdminPassword.length})`,
  );

  // 1. Write a transient fly.toml with the right substitutions.
  const rendered = renderTomlTemplate(p.appName, p.volumeName, p.region);
  const tomlPath = path.resolve(`infra/pocketbase/fly.${p.appName}.toml`);
  writeFileSync(tomlPath, rendered, "utf-8");
  console.log(`  ✓ Rendered fly.toml → ${tomlPath}`);

  // Set flyctl auth env var at the parent-process level so every flyctl
  // child inherits it naturally. (GA dispatch surfaced quirks with
  // per-call env overrides and the --access-token flag for some
  // subcommands — setting at parent level is the most reliable.)
  process.env.FLY_API_TOKEN = p.flyToken;
  process.env.FLY_ACCESS_TOKEN = p.flyToken;

  // 2. Create the Fly app in the target org (idempotent).
  console.log("▶ Creating Fly app...");
  let exists = false;
  try {
    const appsList = execSync(`flyctl apps list -o ${p.flyOrg} --json`, {
      stdio: ["inherit", "pipe", "inherit"],
      encoding: "utf-8",
    });
    const apps = JSON.parse(appsList) as Array<{ Name: string }>;
    exists = apps.some((a) => a.Name === p.appName);
  } catch {
    // If listing fails entirely, fall through and let `apps create` surface
    // the real error.
  }
  if (exists) {
    console.log(`  ○ App ${p.appName} already exists — reusing`);
  } else {
    sh(`flyctl apps create ${p.appName} --org ${p.flyOrg}`);
  }

  // 3. Set the admin password secret BEFORE deploy so PB picks it up on boot.
  console.log("▶ Setting PB_ADMIN_PASSWORD secret...");
  sh(
    `flyctl secrets set PB_ADMIN_PASSWORD="${p.pbAdminPassword}" --app ${p.appName} --stage`,
  );

  // 4. Deploy — builds the Dockerfile, creates the volume on first deploy.
  //    Run from infra/pocketbase/ so Docker's build context sees Dockerfile
  //    + entrypoint.sh as siblings.
  console.log("▶ Deploying Pocketbase instance (builds + starts)...");
  const infraDir = path.resolve("infra/pocketbase");
  sh(
    `flyctl deploy --remote-only --app ${p.appName} --config ${tomlPath}`,
    {},
    infraDir,
  );

  // 5. Wait for /api/health, then for admin bootstrap, then import schema.
  //    /api/health responds the moment `pocketbase serve` binds the port,
  //    but the entrypoint runs `admin create` AFTER its own local health
  //    wait — so there's a window where the instance is "live" but no admin
  //    exists. waitForAdminAuth bridges that race.
  const pbUrl = `https://${p.appName}.fly.dev`;
  console.log(`▶ Waiting for ${pbUrl}/api/health ...`);
  await waitForHealth(pbUrl);
  console.log(`  ✓ Instance is live`);

  console.log(`▶ Waiting for admin bootstrap (entrypoint admin create)...`);
  await waitForAdminAuth(pbUrl, p.pbAdminEmail, p.pbAdminPassword);

  console.log(`▶ Seeding "${p.schemaName}" schema...`);
  await seedSchema(pbUrl, p.schemaName, p.pbAdminEmail, p.pbAdminPassword);
  console.log(`  ✓ Collections imported`);

  return pbUrl;
}

async function main() {
  const args = parseArgs();
  const flyOrg = requireEnv("FLY_TENANTS_ORG");
  const flyToken = requireEnv("FLY_TENANTS_API_TOKEN");
  const pbAdminPassword = requireEnv("PB_ADMIN_PASSWORD");

  // Email is a non-sensitive project constant — sourced from the same TS
  // module the future admin-side PB code will use. Reading it from a GH
  // secret is what bit us in run 24931587641: secret was corrupted to 1
  // char by a pipe-set, the entrypoint kept using fly.toml.tpl's hardcoded
  // value, and the script auth'd with the corrupt env var → 400.
  const { PB_ADMIN_EMAIL: pbAdminEmail } = await import(
    "../admin/src/lib/pocketbase/constants"
  );

  if (args.mode === "admin") {
    const pbUrl = await provisionInstance({
      appName: "mbg-pb-admin",
      volumeName: "pb_data_admin",
      region: args.region,
      flyOrg,
      flyToken,
      pbAdminEmail,
      pbAdminPassword,
      schemaName: "admin",
      label: "central admin DB (Supabase replacement)",
    });
    console.log("\n✅ Admin Pocketbase instance ready.");
    console.log(`   PB admin UI: ${pbUrl}/_/`);
    console.log(`   PB API:      ${pbUrl}/api/`);
    console.log(
      "   Next: build admin/src/lib/pocketbase/admin-client.ts + flip ADMIN_BACKEND flag.",
    );
    return;
  }

  // Tenant mode
  const { tenant, template } = args;
  const pbUrl = await provisionInstance({
    appName: `mbg-pb-${tenant}`,
    volumeName: `pb_data_${tenant.replace(/-/g, "_")}`,
    region: args.region,
    flyOrg,
    flyToken,
    pbAdminEmail,
    pbAdminPassword,
    schemaName: template,
    label: `tenant "${tenant}" (${template})`,
  });

  // Update admin DB tenant row via PostgREST (dep-free). Tenant mode only.
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
        pocketbase_app_name: `mbg-pb-${tenant}`,
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
