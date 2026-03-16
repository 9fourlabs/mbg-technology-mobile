import { mkdirSync, existsSync, writeFileSync } from "fs";
import { resolve } from "path";

const [, , rawTenantId] = process.argv;

if (!rawTenantId) {
  // eslint-disable-next-line no-console
  console.error("Usage: npm run new-tenant <tenant-id>");
  process.exit(1);
}

const tenantId = rawTenantId.trim();

const srcDir = resolve(__dirname, "../configs/tenants-src");
const templatePath = resolve(srcDir, "_template.ts");
const tenantPath = resolve(srcDir, `${tenantId}.ts`);

function main() {
  mkdirSync(srcDir, { recursive: true });

  if (!existsSync(templatePath)) {
    const template = `import type { InformationalTemplate } from "../../src/templates/types";

export const ${toConstName(
      tenantId
    )}Template: InformationalTemplate = {
  templateId: "informational",
  brand: {
    logoUri: "https://example.com/logo.png",
    primaryColor: "#FF9900",
    backgroundColor: "#000000",
    textColor: "#FFFFFF",
    mutedTextColor: "#999999",
  },
  tabs: [
    {
      id: "home",
      label: "Home",
      headerTitle: "Home",
      headerBody: "Short intro about this app.",
      cards: [
        {
          id: "hero",
          imageUri: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d",
          title: "Welcome",
          body: "Describe what this app does for the client.",
          action: {
            type: "open_url",
            url: "https://example.com",
            label: "Learn more",
            variant: "primary",
          },
        },
      ],
    },
  ],
};
`;
    writeFileSync(templatePath, template, "utf8");
  }

  if (existsSync(tenantPath)) {
    // eslint-disable-next-line no-console
    console.error(`Tenant source already exists: ${tenantPath}`);
    process.exit(1);
  }

  const templateSource = readFileSyncSafe(templatePath);
  const tenantSource = templateSource.replace(
    /export const .*Template:/,
    `export const ${toConstName(tenantId)}Template:`
  );

  writeFileSync(tenantPath, tenantSource, "utf8");

  // eslint-disable-next-line no-console
  console.log(`Created tenant source: ${tenantPath}`);
  // eslint-disable-next-line no-console
  console.log(
    `Next steps:\n` +
      `1) Add { id: "${tenantId}", template: ${toConstName(
        tenantId
      )}Template } to the tenants array in scripts/generateTenants.ts.\n` +
      `2) Run: npm run build:tenants\n` +
      `3) Add an import + entry for "${tenantId}" in src/templates/informational/index.ts.\n` +
      `4) Optionally add an Expo projectId mapping for "${tenantId}" in the CI workflows.`
  );
}

function toConstName(id: string) {
  return id
    .replace(/[^a-zA-Z0-9]+(.)/g, (_m, chr) => String(chr).toUpperCase())
    .replace(/[^a-zA-Z0-9]/g, "")
    .replace(/^\d+/, "");
}

function readFileSyncSafe(path: string): string {
  try {
    const fs = require("fs") as typeof import("fs");
    return fs.readFileSync(path, "utf8");
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(`Failed to read ${path}`, e);
    process.exit(1);
  }
}

main();

