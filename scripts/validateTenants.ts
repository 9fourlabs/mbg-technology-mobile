import { readdirSync } from "fs";
import { resolve, basename } from "path";
import type { AppTemplate } from "../src/templates/types";
import { tenantProjects, MBG_PROJECT_ID } from "./tenantProjects";

type TenantSource = {
  id: string;
  template: AppTemplate;
};

const srcDir = resolve(__dirname, "../configs/tenants-src");

async function main() {
  const files = readdirSync(srcDir)
    .filter((f) => f.endsWith(".ts") && !f.startsWith("_"))
    .sort();

  if (files.length === 0) {
    console.error("No tenant source files found in configs/tenants-src/");
    process.exit(1);
  }

  const tenants: TenantSource[] = [];

  for (const file of files) {
    const tenantId = basename(file, ".ts");
    const mod = await import(resolve(srcDir, file));
    const template = findTemplate(mod);
    if (!template) {
      console.error(
        `No template export found in ${file}. Export a const of type InformationalTemplate or AuthenticatedTemplate.`
      );
      process.exit(1);
    }
    tenants.push({ id: tenantId, template: template as AppTemplate });
  }

  const errors: string[] = [];

  for (const t of tenants) {
    validateTenant(t, errors);
  }

  validateProjectIsolation(tenants, errors);

  if (errors.length > 0) {
    console.error("Tenant validation failed:\n" + errors.join("\n"));
    process.exit(1);
  } else {
    console.log("All tenants validated successfully.");
  }
}

function findTemplate(mod: Record<string, unknown>): unknown | null {
  for (const key of Object.keys(mod)) {
    const val = mod[key];
    if (
      val &&
      typeof val === "object" &&
      "templateId" in val &&
      "brand" in val &&
      "tabs" in val
    ) {
      return val;
    }
  }
  return null;
}

function validateTenant({ id, template }: TenantSource, out: string[]) {
  const validTypes = ["informational", "authenticated", "booking", "commerce", "loyalty", "content", "forms", "directory"];
  if (!validTypes.includes(template.templateId)) {
    out.push(`[${id}] templateId must be one of: ${validTypes.join(", ")}. Got "${template.templateId}".`);
  }

  // Brand validation (shared by all template types)
  if (!template.brand) {
    out.push(`[${id}] brand is missing.`);
  } else {
    checkColor(id, "primaryColor", template.brand.primaryColor, out);
    checkColor(id, "backgroundColor", template.brand.backgroundColor, out);
    checkColor(id, "textColor", template.brand.textColor, out);
    checkColor(id, "mutedTextColor", template.brand.mutedTextColor, out);
  }

  // Auth validation (all templates except informational)
  const authTemplates = ["authenticated", "booking", "commerce", "loyalty", "content", "forms", "directory"];
  if (authTemplates.includes(template.templateId)) {
    const auth = (template as any).auth;
    if (!auth) {
      out.push(`[${id}] ${template.templateId} template missing "auth" config.`);
    } else {
      if (!auth.supabaseUrl || !auth.supabaseUrl.startsWith("https://")) {
        out.push(`[${id}] auth.supabaseUrl must be a valid HTTPS URL.`);
      }
      if (!auth.supabaseAnonKey || typeof auth.supabaseAnonKey !== "string") {
        out.push(`[${id}] auth.supabaseAnonKey must be a non-empty string.`);
      }
    }

    // Validate protectedTabs reference actual tab IDs
    const protectedTabs: string[] = (template as any).protectedTabs ?? [];
    const tabIds = new Set(template.tabs.map((t) => t.id));
    for (const pt of protectedTabs) {
      if (!tabIds.has(pt)) {
        out.push(`[${id}] protectedTabs references "${pt}" but no tab with that ID exists.`);
      }
    }
  }

  // Per-template config validation
  if (template.templateId === "booking") {
    const cfg = (template as any).booking;
    if (!cfg) { out.push(`[${id}] booking template missing "booking" config.`); }
    else {
      if (!Array.isArray(cfg.services) || cfg.services.length === 0) out.push(`[${id}] booking.services must be non-empty.`);
      if (!cfg.slotDuration || cfg.slotDuration <= 0) out.push(`[${id}] booking.slotDuration must be > 0.`);
      if (!Array.isArray(cfg.businessHours) || cfg.businessHours.length === 0) out.push(`[${id}] booking.businessHours must be non-empty.`);
    }
  }
  if (template.templateId === "commerce") {
    const cfg = (template as any).commerce;
    if (!cfg) { out.push(`[${id}] commerce template missing "commerce" config.`); }
    else {
      if (!cfg.stripePublishableKey) out.push(`[${id}] commerce.stripePublishableKey is required.`);
      if (!cfg.currency) out.push(`[${id}] commerce.currency is required.`);
    }
  }
  if (template.templateId === "loyalty") {
    const cfg = (template as any).loyalty;
    if (!cfg) { out.push(`[${id}] loyalty template missing "loyalty" config.`); }
    else {
      if (!cfg.pointsPerVisit || cfg.pointsPerVisit <= 0) out.push(`[${id}] loyalty.pointsPerVisit must be > 0.`);
      if (!Array.isArray(cfg.tiers) || cfg.tiers.length === 0) out.push(`[${id}] loyalty.tiers must be non-empty.`);
    }
  }
  if (template.templateId === "content") {
    const cfg = (template as any).content;
    if (!cfg) { out.push(`[${id}] content template missing "content" config.`); }
    else {
      if (!Array.isArray(cfg.categories)) out.push(`[${id}] content.categories must be an array.`);
    }
  }
  if (template.templateId === "forms") {
    const cfg = (template as any).forms;
    if (!cfg) { out.push(`[${id}] forms template missing "forms" config.`); }
    else {
      if (!Array.isArray(cfg.forms) || cfg.forms.length === 0) out.push(`[${id}] forms.forms must have at least one form.`);
      for (const form of (cfg.forms ?? [])) {
        if (!Array.isArray(form.fields) || form.fields.length === 0) out.push(`[${id}] form "${form.id}" must have at least one field.`);
      }
    }
  }
  if (template.templateId === "directory") {
    const cfg = (template as any).directory;
    if (!cfg) { out.push(`[${id}] directory template missing "directory" config.`); }
    else {
      if (!cfg.itemLabel) out.push(`[${id}] directory.itemLabel is required.`);
      if (!Array.isArray(cfg.fields) || cfg.fields.length === 0) out.push(`[${id}] directory.fields must be non-empty.`);
    }
  }

  // Tab/card validation (shared by all template types)
  if (!Array.isArray(template.tabs) || template.tabs.length === 0) {
    out.push(`[${id}] tabs must be a non-empty array.`);
  } else {
    for (const tab of template.tabs) {
      if (!tab.id) out.push(`[${id}] tab missing id.`);
      if (!tab.label) out.push(`[${id}] tab "${tab.id}" missing label.`);
      if (!tab.headerTitle) out.push(`[${id}] tab "${tab.id}" missing headerTitle.`);
      if (!tab.headerBody) out.push(`[${id}] tab "${tab.id}" missing headerBody.`);

      // Template-specific tabs can have empty cards (custom screens render instead)
      const customTabIds = ["profile", "book", "appointments", "shop", "cart", "orders", "feed", "bookmarks", "browse", "card", "rewards", "history", "forms", "submissions", "dashboard"];
      if (customTabIds.includes(tab.id)) continue;

      if (!Array.isArray(tab.cards) || tab.cards.length === 0) {
        out.push(`[${id}] tab "${tab.id}" must have at least one card.`);
      } else {
        for (const card of tab.cards) {
          if (!card.id) out.push(`[${id}] tab "${tab.id}" card missing id.`);
          if (!card.title) out.push(`[${id}] tab "${tab.id}" card "${card.id}" missing title.`);
          if (!card.body) out.push(`[${id}] tab "${tab.id}" card "${card.id}" missing body.`);
          if (card.action && card.action.type === "open_url") {
            if (!card.action.url) {
              out.push(
                `[${id}] tab "${tab.id}" card "${card.id}" has open_url action but missing url.`
              );
            }
            if (!card.action.label) {
              out.push(
                `[${id}] tab "${tab.id}" card "${card.id}" has open_url action but missing label.`
              );
            }
          }
        }
      }
    }
  }
}

function checkColor(
  tenantId: string,
  field: string,
  value: string | undefined,
  out: string[]
) {
  if (!value) {
    out.push(`[${tenantId}] brand.${field} is missing.`);
    return;
  }
  if (!/^#[0-9a-fA-F]{6}$/.test(value)) {
    out.push(`[${tenantId}] brand.${field} must be a 6-digit hex color, got "${value}".`);
  }
}

function validateProjectIsolation(tenants: TenantSource[], out: string[]) {
  for (const t of tenants) {
    if (!(t.id in tenantProjects)) {
      out.push(
        `[project-isolation] Tenant "${t.id}" has no entry in scripts/tenantProjects.ts. ` +
          `Add a dedicated Expo project ID before building.`
      );
    }
  }

  for (const [id, projectId] of Object.entries(tenantProjects)) {
    if (projectId.startsWith("PLACEHOLDER")) {
      console.warn(
        `⚠️  [project-isolation] Tenant "${id}" has a placeholder project ID. ` +
          `Create a dedicated Expo project before production release.`
      );
    }
  }

  const seen = new Map<string, string>();
  for (const [id, projectId] of Object.entries(tenantProjects)) {
    if (projectId.startsWith("PLACEHOLDER")) continue;

    const existing = seen.get(projectId);
    if (existing) {
      if (projectId === MBG_PROJECT_ID) {
        const nonMbg = id === "mbg" ? existing : id;
        out.push(
          `[project-isolation] Tenant "${nonMbg}" shares the MBG project ID. ` +
            `Each client tenant must have its own dedicated Expo project.`
        );
      } else {
        out.push(
          `[project-isolation] Tenants "${existing}" and "${id}" share project ID "${projectId}". ` +
            `Each tenant must have a unique Expo project.`
        );
      }
    } else {
      seen.set(projectId, id);
    }
  }
}

main();
