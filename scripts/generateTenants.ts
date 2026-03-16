import { writeFileSync, mkdirSync } from "fs";
import { resolve } from "path";
import { mbgTemplate } from "../configs/tenants-src/mbg";
import { acmeDentalTemplate } from "../configs/tenants-src/acme-dental";

type TenantSource = {
  id: string;
  template: unknown;
};

const tenants: TenantSource[] = [
  { id: "mbg", template: mbgTemplate },
  { id: "acme-dental", template: acmeDentalTemplate },
];

function main() {
  const outDir = resolve(__dirname, "../configs/tenants");
  mkdirSync(outDir, { recursive: true });

  for (const t of tenants) {
    const outPath = resolve(outDir, `${t.id}.json`);
    const json = JSON.stringify(t.template, null, 2);
    writeFileSync(outPath, json + "\n", "utf8");
    // eslint-disable-next-line no-console
    console.log(`Wrote ${outPath}`);
  }
}

main();

