import { mkdirSync, existsSync, writeFileSync, readFileSync } from "fs";
import { resolve } from "path";

const args = process.argv.slice(2);
const isAuthenticated = args.includes("--authenticated");
const rawTenantId = args.find((a) => !a.startsWith("--"));

if (!rawTenantId) {
  console.error("Usage: npm run new-tenant <tenant-id> [--authenticated]");
  process.exit(1);
}

const tenantId = rawTenantId.trim();

const srcDir = resolve(__dirname, "../configs/tenants-src");
const tenantPath = resolve(srcDir, `${tenantId}.ts`);
const projectsPath = resolve(__dirname, "tenantProjects.ts");

function main() {
  mkdirSync(srcDir, { recursive: true });

  // 1. Create the tenant source file
  if (existsSync(tenantPath)) {
    console.error(`Tenant source already exists: ${tenantPath}`);
    process.exit(1);
  }

  const constName = toConstName(tenantId);
  const template = isAuthenticated
    ? getAuthenticatedScaffold(constName)
    : getInformationalScaffold(constName);

  writeFileSync(tenantPath, template, "utf8");
  console.log(`✅ Created ${isAuthenticated ? "authenticated" : "informational"} tenant: ${tenantPath}`);

  // 2. Add placeholder entry to tenantProjects.ts
  const projectsSource = readFileSync(projectsPath, "utf8");
  if (projectsSource.includes(`"${tenantId}"`)) {
    console.log(`ℹ️  Tenant "${tenantId}" already exists in tenantProjects.ts`);
  } else {
    const updatedSource = projectsSource.replace(
      /};(\s*)$/,
      `  "${tenantId}": "PLACEHOLDER_CREATE_EXPO_PROJECT",\n};$1`
    );
    writeFileSync(projectsPath, updatedSource, "utf8");
    console.log(`✅ Added placeholder project ID to tenantProjects.ts`);
  }

  // 3. Build and validate
  console.log(`\n🔨 Building tenant configs...`);
  const { execSync } = require("child_process");
  try {
    execSync("npm run build:tenants", { stdio: "inherit", cwd: resolve(__dirname, "..") });
    console.log(`\n✅ Tenant "${tenantId}" is fully registered. No manual file edits needed.`);
    console.log(`\nNext steps:`);
    console.log(`  1) Edit configs/tenants-src/${tenantId}.ts with client branding`);
    if (isAuthenticated) {
      console.log(`  2) Create a Supabase project and update auth.supabaseUrl + auth.supabaseAnonKey`);
      console.log(`  3) Run: APP_TENANT=${tenantId} npm run start`);
      console.log(`  4) Open a PR to trigger a preview build`);
    } else {
      console.log(`  2) Run: APP_TENANT=${tenantId} npm run start`);
      console.log(`  3) Open a PR to trigger a preview build`);
    }
  } catch {
    console.error(`\n⚠️  Build failed. Check the error above and fix configs/tenants-src/${tenantId}.ts`);
    process.exit(1);
  }
}

function getInformationalScaffold(constName: string): string {
  return `import type { InformationalTemplate } from "../../src/templates/types";

export const ${constName}Template: InformationalTemplate = {
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
}

function getAuthenticatedScaffold(constName: string): string {
  return `import type { AuthenticatedTemplate } from "../../src/templates/types";

export const ${constName}Template: AuthenticatedTemplate = {
  templateId: "authenticated",
  auth: {
    supabaseUrl: "https://YOUR_PROJECT.supabase.co",
    supabaseAnonKey: "YOUR_ANON_KEY",
  },
  brand: {
    logoUri: "https://example.com/logo.png",
    primaryColor: "#2563EB",
    backgroundColor: "#0F172A",
    textColor: "#F8FAFC",
    mutedTextColor: "#94A3B8",
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
    {
      id: "dashboard",
      label: "Dashboard",
      headerTitle: "Dashboard",
      headerBody: "Your account activity and resources.",
      cards: [
        {
          id: "overview",
          title: "Overview",
          body: "View your latest activity and reports.",
        },
      ],
    },
    {
      id: "profile",
      label: "Profile",
      headerTitle: "Your Account",
      headerBody: "Manage your profile and settings.",
      cards: [],
    },
  ],
  protectedTabs: ["dashboard", "profile"],
};
`;
}

function toConstName(id: string) {
  return id
    .replace(/[^a-zA-Z0-9]+(.)/g, (_m, chr) => String(chr).toUpperCase())
    .replace(/[^a-zA-Z0-9]/g, "")
    .replace(/^\d+/, "");
}

main();
