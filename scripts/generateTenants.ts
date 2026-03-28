import { writeFileSync, mkdirSync, readdirSync } from "fs";
import { resolve, basename } from "path";

const srcDir = resolve(__dirname, "../configs/tenants-src");
const outDir = resolve(__dirname, "../configs/tenants");

async function main() {
  mkdirSync(outDir, { recursive: true });

  const files = readdirSync(srcDir)
    .filter((f) => f.endsWith(".ts") && !f.startsWith("_"))
    .sort();

  if (files.length === 0) {
    console.error("No tenant source files found in configs/tenants-src/");
    process.exit(1);
  }

  for (const file of files) {
    const tenantId = basename(file, ".ts");
    const mod = await import(resolve(srcDir, file));

    // Find the exported template (first exported value that looks like a template)
    const template = findTemplate(mod);
    if (!template) {
      console.error(
        `No template export found in ${file}. Export a const of type InformationalTemplate.`
      );
      process.exit(1);
    }

    const outPath = resolve(outDir, `${tenantId}.json`);
    const json = JSON.stringify(template, null, 2);
    writeFileSync(outPath, json + "\n", "utf8");
    // eslint-disable-next-line no-console
    console.log(`Wrote ${outPath}`);
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

main();
