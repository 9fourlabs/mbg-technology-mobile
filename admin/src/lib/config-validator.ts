import type { AppTemplate } from "./types";

/**
 * Validates a tenant config and returns an array of error messages.
 * An empty array means the config is valid.
 */
export function validateConfig(
  tenantId: string,
  config: AppTemplate
): string[] {
  const errors: string[] = [];

  // Template ID
  const validTypes = [
    "informational",
    "authenticated",
    "booking",
    "commerce",
    "loyalty",
    "content",
    "forms",
    "directory",
  ];
  if (!validTypes.includes(config.templateId)) {
    errors.push(
      `[${tenantId}] templateId must be one of: ${validTypes.join(", ")}. Got "${config.templateId}".`
    );
  }

  // Brand validation
  if (!config.brand) {
    errors.push(`[${tenantId}] brand is missing.`);
  } else {
    checkColor(tenantId, "primaryColor", config.brand.primaryColor, errors);
    checkColor(tenantId, "backgroundColor", config.brand.backgroundColor, errors);
    checkColor(tenantId, "textColor", config.brand.textColor, errors);
    checkColor(tenantId, "mutedTextColor", config.brand.mutedTextColor, errors);
  }

  // Auth validation (all templates except informational)
  const authTemplates = [
    "authenticated",
    "booking",
    "commerce",
    "loyalty",
    "content",
    "forms",
    "directory",
  ];

  if (authTemplates.includes(config.templateId)) {
    const auth = (config as Record<string, unknown>).auth as
      | { supabaseUrl?: string; supabaseAnonKey?: string }
      | undefined;

    if (!auth) {
      errors.push(
        `[${tenantId}] ${config.templateId} template missing "auth" config.`
      );
    } else {
      if (!auth.supabaseUrl || !auth.supabaseUrl.startsWith("https://")) {
        errors.push(
          `[${tenantId}] auth.supabaseUrl must be a valid HTTPS URL.`
        );
      }
      if (!auth.supabaseAnonKey || typeof auth.supabaseAnonKey !== "string") {
        errors.push(
          `[${tenantId}] auth.supabaseAnonKey must be a non-empty string.`
        );
      }
    }

    // protectedTabs must reference real tab IDs
    const protectedTabs: string[] =
      ((config as Record<string, unknown>).protectedTabs as string[]) ?? [];
    const tabIds = new Set(config.tabs.map((t) => t.id));
    for (const pt of protectedTabs) {
      if (!tabIds.has(pt)) {
        errors.push(
          `[${tenantId}] protectedTabs references "${pt}" but no tab with that ID exists.`
        );
      }
    }
  }

  // Per-template config validation
  validatePerTemplate(tenantId, config, errors);

  // Tab/card validation
  validateTabs(tenantId, config, errors);

  return errors;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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
    out.push(
      `[${tenantId}] brand.${field} must be a 6-digit hex color, got "${value}".`
    );
  }
}

function validatePerTemplate(
  id: string,
  config: AppTemplate,
  out: string[]
) {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const c = config as any;

  if (config.templateId === "booking") {
    if (!c.booking) {
      out.push(`[${id}] booking template missing "booking" config.`);
    } else {
      if (!Array.isArray(c.booking.services) || c.booking.services.length === 0)
        out.push(`[${id}] booking.services must be non-empty.`);
      if (!c.booking.slotDuration || c.booking.slotDuration <= 0)
        out.push(`[${id}] booking.slotDuration must be > 0.`);
      if (
        !Array.isArray(c.booking.businessHours) ||
        c.booking.businessHours.length === 0
      )
        out.push(`[${id}] booking.businessHours must be non-empty.`);
    }
  }

  if (config.templateId === "commerce") {
    if (!c.commerce) {
      out.push(`[${id}] commerce template missing "commerce" config.`);
    } else {
      if (!c.commerce.stripePublishableKey)
        out.push(`[${id}] commerce.stripePublishableKey is required.`);
      if (!c.commerce.currency)
        out.push(`[${id}] commerce.currency is required.`);
    }
  }

  if (config.templateId === "loyalty") {
    if (!c.loyalty) {
      out.push(`[${id}] loyalty template missing "loyalty" config.`);
    } else {
      if (!c.loyalty.pointsPerVisit || c.loyalty.pointsPerVisit <= 0)
        out.push(`[${id}] loyalty.pointsPerVisit must be > 0.`);
      if (!Array.isArray(c.loyalty.tiers) || c.loyalty.tiers.length === 0)
        out.push(`[${id}] loyalty.tiers must be non-empty.`);
    }
  }

  if (config.templateId === "content") {
    if (!c.content) {
      out.push(`[${id}] content template missing "content" config.`);
    } else {
      if (!Array.isArray(c.content.categories))
        out.push(`[${id}] content.categories must be an array.`);
    }
  }

  if (config.templateId === "forms") {
    if (!c.forms) {
      out.push(`[${id}] forms template missing "forms" config.`);
    } else {
      if (!Array.isArray(c.forms.forms) || c.forms.forms.length === 0)
        out.push(`[${id}] forms.forms must have at least one form.`);
      for (const form of c.forms.forms ?? []) {
        if (!Array.isArray(form.fields) || form.fields.length === 0)
          out.push(
            `[${id}] form "${form.id}" must have at least one field.`
          );
      }
    }
  }

  if (config.templateId === "directory") {
    if (!c.directory) {
      out.push(`[${id}] directory template missing "directory" config.`);
    } else {
      if (!c.directory.itemLabel)
        out.push(`[${id}] directory.itemLabel is required.`);
      if (
        !Array.isArray(c.directory.fields) ||
        c.directory.fields.length === 0
      )
        out.push(`[${id}] directory.fields must be non-empty.`);
    }
  }
  /* eslint-enable @typescript-eslint/no-explicit-any */
}

function validateTabs(
  id: string,
  config: AppTemplate,
  out: string[]
) {
  if (!Array.isArray(config.tabs) || config.tabs.length === 0) {
    out.push(`[${id}] tabs must be a non-empty array.`);
    return;
  }

  // Tab IDs that have custom screens and are allowed to have empty cards
  const customTabIds = new Set([
    "profile",
    "book",
    "appointments",
    "shop",
    "cart",
    "orders",
    "feed",
    "bookmarks",
    "browse",
    "card",
    "rewards",
    "history",
    "forms",
    "submissions",
    "dashboard",
  ]);

  for (const tab of config.tabs) {
    if (!tab.id) out.push(`[${id}] tab missing id.`);
    if (!tab.label) out.push(`[${id}] tab "${tab.id}" missing label.`);
    if (!tab.headerTitle)
      out.push(`[${id}] tab "${tab.id}" missing headerTitle.`);
    if (!tab.headerBody)
      out.push(`[${id}] tab "${tab.id}" missing headerBody.`);

    if (customTabIds.has(tab.id)) continue;

    if (!Array.isArray(tab.cards) || tab.cards.length === 0) {
      out.push(`[${id}] tab "${tab.id}" must have at least one card.`);
    } else {
      for (const card of tab.cards) {
        if (!card.id)
          out.push(`[${id}] tab "${tab.id}" card missing id.`);
        if (!card.title)
          out.push(
            `[${id}] tab "${tab.id}" card "${card.id}" missing title.`
          );
        if (!card.body)
          out.push(
            `[${id}] tab "${tab.id}" card "${card.id}" missing body.`
          );
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
