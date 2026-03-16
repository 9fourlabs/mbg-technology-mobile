import { mbgTemplate } from "../configs/tenants-src/mbg";
import { acmeDentalTemplate } from "../configs/tenants-src/acme-dental";
import type { InformationalTemplate } from "../src/templates/types";

type TenantSource = {
  id: string;
  template: InformationalTemplate;
};

const tenants: TenantSource[] = [
  { id: "mbg", template: mbgTemplate },
  { id: "acme-dental", template: acmeDentalTemplate },
];

function main() {
  const errors: string[] = [];

  for (const t of tenants) {
    validateTenant(t, errors);
  }

  if (errors.length > 0) {
    // eslint-disable-next-line no-console
    console.error("Tenant validation failed:\n" + errors.join("\n"));
    process.exit(1);
  } else {
    // eslint-disable-next-line no-console
    console.log("All tenants validated successfully.");
  }
}

function validateTenant({ id, template }: TenantSource, out: string[]) {
  if (template.templateId !== "informational") {
    out.push(`[${id}] templateId must be "informational".`);
  }

  if (!template.brand) {
    out.push(`[${id}] brand is missing.`);
  } else {
    checkColor(id, "primaryColor", template.brand.primaryColor, out);
    checkColor(id, "backgroundColor", template.brand.backgroundColor, out);
    checkColor(id, "textColor", template.brand.textColor, out);
    checkColor(id, "mutedTextColor", template.brand.mutedTextColor, out);
  }

  if (!Array.isArray(template.tabs) || template.tabs.length === 0) {
    out.push(`[${id}] tabs must be a non-empty array.`);
  } else {
    for (const tab of template.tabs) {
      if (!tab.id) out.push(`[${id}] tab missing id.`);
      if (!tab.label) out.push(`[${id}] tab "${tab.id}" missing label.`);
      if (!tab.headerTitle) out.push(`[${id}] tab "${tab.id}" missing headerTitle.`);
      if (!tab.headerBody) out.push(`[${id}] tab "${tab.id}" missing headerBody.`);

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

main();

