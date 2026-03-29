import { mkdirSync, existsSync, writeFileSync, readFileSync } from "fs";
import { resolve } from "path";

const TEMPLATE_FLAGS = [
  "informational",
  "authenticated",
  "booking",
  "commerce",
  "loyalty",
  "content",
  "forms",
  "directory",
] as const;

type TemplateType = (typeof TEMPLATE_FLAGS)[number];

const args = process.argv.slice(2);
const rawTenantId = args.find((a) => !a.startsWith("--"));
const templateType: TemplateType =
  (TEMPLATE_FLAGS.find((t) => args.includes(`--${t}`)) as TemplateType) ?? "informational";

if (!rawTenantId) {
  console.error(
    `Usage: npm run new-tenant <tenant-id> [--${TEMPLATE_FLAGS.join(" | --")}]`
  );
  process.exit(1);
}

const tenantId = rawTenantId.trim();
const srcDir = resolve(__dirname, "../configs/tenants-src");
const tenantPath = resolve(srcDir, `${tenantId}.ts`);
const projectsPath = resolve(__dirname, "tenantProjects.ts");

function main() {
  mkdirSync(srcDir, { recursive: true });

  if (existsSync(tenantPath)) {
    console.error(`Tenant source already exists: ${tenantPath}`);
    process.exit(1);
  }

  const constName = toConstName(tenantId);
  const scaffold = getScaffold(templateType, constName);

  writeFileSync(tenantPath, scaffold, "utf8");
  console.log(`✅ Created ${templateType} tenant: ${tenantPath}`);

  // Add placeholder entry to tenantProjects.ts
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

  // Build
  console.log(`\n🔨 Building tenant configs...`);
  const { execSync } = require("child_process");
  try {
    execSync("npm run build:tenants", { stdio: "inherit", cwd: resolve(__dirname, "..") });
    console.log(`\n✅ Tenant "${tenantId}" is fully registered.`);
    printNextSteps();
  } catch {
    console.error(`\n⚠️  Build failed. Check the error above and fix configs/tenants-src/${tenantId}.ts`);
    process.exit(1);
  }
}

function printNextSteps() {
  console.log(`\nNext steps:`);
  console.log(`  1) Edit configs/tenants-src/${tenantId}.ts with client branding`);

  if (templateType !== "informational") {
    console.log(`  2) Create a Supabase project and update auth.supabaseUrl + auth.supabaseAnonKey`);

    const migrationMap: Partial<Record<TemplateType, string>> = {
      content: "001_content.sql",
      directory: "002_directory.sql",
      forms: "003_forms.sql",
      loyalty: "004_loyalty.sql",
      booking: "005_booking.sql",
      commerce: "006_commerce.sql",
    };
    const migration = migrationMap[templateType];
    if (migration) {
      console.log(`  3) Run supabase/migrations/${migration} against the tenant's Supabase project`);
      console.log(`  4) Run: APP_TENANT=${tenantId} npm run start`);
      console.log(`  5) Open a PR to trigger a preview build`);
    } else {
      console.log(`  3) Run: APP_TENANT=${tenantId} npm run start`);
      console.log(`  4) Open a PR to trigger a preview build`);
    }
  } else {
    console.log(`  2) Run: APP_TENANT=${tenantId} npm run start`);
    console.log(`  3) Open a PR to trigger a preview build`);
  }
}

function getScaffold(type: TemplateType, constName: string): string {
  const authBlock = `  auth: {
    supabaseUrl: "https://YOUR_PROJECT.supabase.co",
    supabaseAnonKey: "YOUR_ANON_KEY",
  },`;

  const brandBlock = `  brand: {
    logoUri: "https://example.com/logo.png",
    primaryColor: "#2563EB",
    backgroundColor: "#0F172A",
    textColor: "#F8FAFC",
    mutedTextColor: "#94A3B8",
  },`;

  const homeTab = `    {
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
          action: { type: "open_url", url: "https://example.com", label: "Learn more", variant: "primary" },
        },
      ],
    }`;

  const profileTab = `    {
      id: "profile",
      label: "Profile",
      headerTitle: "Your Account",
      headerBody: "Manage your profile and settings.",
      cards: [],
    }`;

  switch (type) {
    case "informational":
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
${homeTab},
  ],
};
`;

    case "authenticated":
      return `import type { AuthenticatedTemplate } from "../../src/templates/types";

export const ${constName}Template: AuthenticatedTemplate = {
  templateId: "authenticated",
${authBlock}
${brandBlock}
  tabs: [
${homeTab},
    {
      id: "dashboard",
      label: "Dashboard",
      headerTitle: "Dashboard",
      headerBody: "Your account activity and resources.",
      cards: [{ id: "overview", title: "Overview", body: "View your latest activity." }],
    },
${profileTab},
  ],
  protectedTabs: ["dashboard", "profile"],
};
`;

    case "booking":
      return `import type { BookingTemplate } from "../../src/templates/types";

export const ${constName}Template: BookingTemplate = {
  templateId: "booking",
${authBlock}
${brandBlock}
  booking: {
    services: [
      { id: "service-1", name: "Standard Service", duration: 30, price: 50 },
      { id: "service-2", name: "Premium Service", duration: 60, price: 100 },
    ],
    businessHours: [
      { day: 1, start: "09:00", end: "17:00" },
      { day: 2, start: "09:00", end: "17:00" },
      { day: 3, start: "09:00", end: "17:00" },
      { day: 4, start: "09:00", end: "17:00" },
      { day: 5, start: "09:00", end: "17:00" },
    ],
    slotDuration: 30,
    advanceBookingDays: 14,
    cancellationPolicy: "Cancel at least 24 hours in advance.",
  },
  tabs: [
${homeTab},
    { id: "book", label: "Book", headerTitle: "Book Appointment", headerBody: "Choose a service and pick your time.", cards: [] },
    { id: "appointments", label: "My Appts", headerTitle: "My Appointments", headerBody: "View and manage your bookings.", cards: [] },
${profileTab},
  ],
  protectedTabs: ["book", "appointments", "profile"],
};
`;

    case "commerce":
      return `import type { CommerceTemplate } from "../../src/templates/types";

export const ${constName}Template: CommerceTemplate = {
  templateId: "commerce",
${authBlock}
${brandBlock}
  commerce: {
    stripePublishableKey: "pk_test_YOUR_KEY",
    currency: "usd",
    storeName: "My Store",
    categories: [
      { id: "all", name: "All" },
      { id: "featured", name: "Featured" },
    ],
    shippingEnabled: false,
    taxRate: 0.0825,
  },
  tabs: [
${homeTab},
    { id: "shop", label: "Shop", headerTitle: "Shop", headerBody: "Browse our products.", cards: [] },
    { id: "cart", label: "Cart", headerTitle: "Your Cart", headerBody: "Review your items.", cards: [] },
    { id: "orders", label: "Orders", headerTitle: "Order History", headerBody: "Your past orders.", cards: [] },
${profileTab},
  ],
  protectedTabs: ["cart", "orders", "profile"],
};
`;

    case "loyalty":
      return `import type { LoyaltyTemplate } from "../../src/templates/types";

export const ${constName}Template: LoyaltyTemplate = {
  templateId: "loyalty",
${authBlock}
${brandBlock}
  loyalty: {
    pointsPerVisit: 10,
    programName: "Rewards Program",
    tiers: [
      { id: "bronze", name: "Bronze", minPoints: 0, color: "#CD7F32" },
      { id: "silver", name: "Silver", minPoints: 100, color: "#C0C0C0" },
      { id: "gold", name: "Gold", minPoints: 500, color: "#FFD700" },
    ],
    rewards: [
      { id: "free-item", name: "Free Item", pointsCost: 50, description: "Redeem for any item." },
      { id: "discount", name: "20% Off", pointsCost: 30, description: "20% off your next visit." },
    ],
  },
  tabs: [
${homeTab},
    { id: "card", label: "My Card", headerTitle: "Loyalty Card", headerBody: "Your points and rewards.", cards: [] },
    { id: "rewards", label: "Rewards", headerTitle: "Rewards", headerBody: "Redeem your points.", cards: [] },
    { id: "history", label: "History", headerTitle: "Points History", headerBody: "Your earning and redemption history.", cards: [] },
${profileTab},
  ],
  protectedTabs: ["card", "rewards", "history", "profile"],
};
`;

    case "content":
      return `import type { ContentTemplate } from "../../src/templates/types";

export const ${constName}Template: ContentTemplate = {
  templateId: "content",
${authBlock}
${brandBlock}
  content: {
    categories: [
      { id: "news", name: "News" },
      { id: "updates", name: "Updates" },
      { id: "tips", name: "Tips" },
    ],
    displayMode: "feed",
    allowBookmarks: true,
  },
  tabs: [
${homeTab},
    { id: "feed", label: "Articles", headerTitle: "Articles", headerBody: "Latest posts and updates.", cards: [] },
    { id: "bookmarks", label: "Saved", headerTitle: "Saved Articles", headerBody: "Your bookmarked articles.", cards: [] },
${profileTab},
  ],
  protectedTabs: ["bookmarks", "profile"],
};
`;

    case "forms":
      return `import type { FormsTemplate } from "../../src/templates/types";

export const ${constName}Template: FormsTemplate = {
  templateId: "forms",
${authBlock}
${brandBlock}
  forms: {
    forms: [
      {
        id: "contact",
        title: "Contact Form",
        description: "Send us a message.",
        fields: [
          { id: "name", label: "Full Name", type: "text", required: true },
          { id: "email", label: "Email", type: "email", required: true },
          { id: "message", label: "Message", type: "textarea", required: true },
        ],
      },
    ],
    allowFileUploads: false,
  },
  tabs: [
${homeTab},
    { id: "forms", label: "Forms", headerTitle: "Forms", headerBody: "Submit information.", cards: [] },
    { id: "submissions", label: "Submitted", headerTitle: "My Submissions", headerBody: "Track your submissions.", cards: [] },
${profileTab},
  ],
  protectedTabs: ["forms", "submissions", "profile"],
};
`;

    case "directory":
      return `import type { DirectoryTemplate } from "../../src/templates/types";

export const ${constName}Template: DirectoryTemplate = {
  templateId: "directory",
${authBlock}
${brandBlock}
  directory: {
    itemLabel: "Member",
    itemLabelPlural: "Members",
    fields: [
      { key: "name", label: "Name", type: "text", searchable: true },
      { key: "email", label: "Email", type: "email" },
      { key: "phone", label: "Phone", type: "phone" },
    ],
    categories: [
      { id: "all", name: "All" },
      { id: "active", name: "Active" },
    ],
    enableMap: false,
  },
  tabs: [
${homeTab},
    { id: "browse", label: "Browse", headerTitle: "Directory", headerBody: "Search and browse.", cards: [] },
${profileTab},
  ],
  protectedTabs: ["browse", "profile"],
};
`;
  }
}

function toConstName(id: string) {
  return id
    .replace(/[^a-zA-Z0-9]+(.)/g, (_m, chr) => String(chr).toUpperCase())
    .replace(/[^a-zA-Z0-9]/g, "")
    .replace(/^\d+/, "");
}

main();
