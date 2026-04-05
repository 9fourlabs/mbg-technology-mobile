import type { AppTemplate, TemplateId } from "./types";

// ---------------------------------------------------------------------------
// Default configs
// ---------------------------------------------------------------------------

const authBlock = {
  supabaseUrl: "https://YOUR_PROJECT.supabase.co",
  supabaseAnonKey: "YOUR_ANON_KEY",
};

const defaultBrand = {
  logoUri: "https://example.com/logo.png",
  primaryColor: "#2563EB",
  backgroundColor: "#0F172A",
  textColor: "#F8FAFC",
  mutedTextColor: "#94A3B8",
};

const homeTab = {
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
        type: "open_url" as const,
        url: "https://example.com",
        label: "Learn more",
        variant: "primary" as const,
      },
    },
  ],
};

const profileTab = {
  id: "profile",
  label: "Profile",
  headerTitle: "Your Account",
  headerBody: "Manage your profile and settings.",
  cards: [],
};

/**
 * Returns a fully-populated default config for the given template type.
 */
export function generateDefaultConfig(templateType: TemplateId): AppTemplate {
  switch (templateType) {
    case "informational":
      return {
        templateId: "informational",
        brand: { ...defaultBrand, primaryColor: "#FF9900", backgroundColor: "#000000", textColor: "#FFFFFF", mutedTextColor: "#999999" },
        design: { preset: "modern" },
        appStore: {
          appName: "My App",
          appDescription: "Built with MBG Technology",
        },
        tabs: [homeTab],
      };

    case "authenticated":
      return {
        templateId: "authenticated",
        auth: { ...authBlock },
        brand: { ...defaultBrand },
        design: { preset: "modern" },
        appStore: {
          appName: "My Portal",
          appDescription: "Built with MBG Technology",
        },
        tabs: [
          homeTab,
          {
            id: "dashboard",
            label: "Dashboard",
            headerTitle: "Dashboard",
            headerBody: "Your account activity and resources.",
            cards: [{ id: "overview", title: "Overview", body: "View your latest activity." }],
          },
          profileTab,
        ],
        protectedTabs: ["dashboard", "profile"],
      };

    case "booking":
      return {
        templateId: "booking",
        auth: { ...authBlock },
        brand: { ...defaultBrand },
        design: { preset: "modern" },
        appStore: {
          appName: "My Salon",
          appDescription: "Built with MBG Technology",
        },
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
          homeTab,
          { id: "book", label: "Book", headerTitle: "Book Appointment", headerBody: "Choose a service and pick your time.", cards: [] },
          { id: "appointments", label: "My Appts", headerTitle: "My Appointments", headerBody: "View and manage your bookings.", cards: [] },
          profileTab,
        ],
        protectedTabs: ["book", "appointments", "profile"],
      };

    case "commerce":
      return {
        templateId: "commerce",
        auth: { ...authBlock },
        brand: { ...defaultBrand },
        design: { preset: "modern" },
        appStore: {
          appName: "My Store",
          appDescription: "Built with MBG Technology",
        },
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
          homeTab,
          { id: "shop", label: "Shop", headerTitle: "Shop", headerBody: "Browse our products.", cards: [] },
          { id: "cart", label: "Cart", headerTitle: "Your Cart", headerBody: "Review your items.", cards: [] },
          { id: "orders", label: "Orders", headerTitle: "Order History", headerBody: "Your past orders.", cards: [] },
          profileTab,
        ],
        protectedTabs: ["cart", "orders", "profile"],
      };

    case "loyalty":
      return {
        templateId: "loyalty",
        auth: { ...authBlock },
        brand: { ...defaultBrand },
        design: { preset: "modern" },
        appStore: {
          appName: "My Rewards",
          appDescription: "Built with MBG Technology",
        },
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
          homeTab,
          { id: "card", label: "My Card", headerTitle: "Loyalty Card", headerBody: "Your points and rewards.", cards: [] },
          { id: "rewards", label: "Rewards", headerTitle: "Rewards", headerBody: "Redeem your points.", cards: [] },
          { id: "history", label: "History", headerTitle: "Points History", headerBody: "Your earning and redemption history.", cards: [] },
          profileTab,
        ],
        protectedTabs: ["card", "rewards", "history", "profile"],
      };

    case "content":
      return {
        templateId: "content",
        auth: { ...authBlock },
        brand: { ...defaultBrand },
        design: { preset: "modern" },
        appStore: {
          appName: "My Content",
          appDescription: "Built with MBG Technology",
        },
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
          homeTab,
          { id: "feed", label: "Articles", headerTitle: "Articles", headerBody: "Latest posts and updates.", cards: [] },
          { id: "bookmarks", label: "Saved", headerTitle: "Saved Articles", headerBody: "Your bookmarked articles.", cards: [] },
          profileTab,
        ],
        protectedTabs: ["bookmarks", "profile"],
      };

    case "forms":
      return {
        templateId: "forms",
        auth: { ...authBlock },
        brand: { ...defaultBrand },
        design: { preset: "modern" },
        appStore: {
          appName: "My Forms",
          appDescription: "Built with MBG Technology",
        },
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
          homeTab,
          { id: "forms", label: "Forms", headerTitle: "Forms", headerBody: "Submit information.", cards: [] },
          { id: "submissions", label: "Submitted", headerTitle: "My Submissions", headerBody: "Track your submissions.", cards: [] },
          profileTab,
        ],
        protectedTabs: ["forms", "submissions", "profile"],
      };

    case "directory":
      return {
        templateId: "directory",
        auth: { ...authBlock },
        brand: { ...defaultBrand },
        design: { preset: "modern" },
        appStore: {
          appName: "My Directory",
          appDescription: "Built with MBG Technology",
        },
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
          homeTab,
          { id: "browse", label: "Browse", headerTitle: "Directory", headerBody: "Search and browse.", cards: [] },
          profileTab,
        ],
        protectedTabs: ["browse", "profile"],
      };
  }
}

// ---------------------------------------------------------------------------
// TypeScript code generation
// ---------------------------------------------------------------------------

/** Map from templateId to the TypeScript type name used in the mobile repo. */
const typeNameMap: Record<TemplateId, string> = {
  informational: "InformationalTemplate",
  authenticated: "AuthenticatedTemplate",
  booking: "BookingTemplate",
  commerce: "CommerceTemplate",
  loyalty: "LoyaltyTemplate",
  content: "ContentTemplate",
  forms: "FormsTemplate",
  directory: "DirectoryTemplate",
};

/**
 * Converts a tenant ID (e.g. "acme-dental") to a camelCase const name
 * (e.g. "acmeDental"). Matches the convention used by the mobile repo's
 * newTenant script.
 */
function toConstName(id: string): string {
  return id
    .replace(/[^a-zA-Z0-9]+(.)/g, (_m, chr: string) => chr.toUpperCase())
    .replace(/[^a-zA-Z0-9]/g, "")
    .replace(/^\d+/, "");
}

/**
 * Generates the TypeScript source file that would be committed to the mobile
 * repo at configs/tenants-src/{tenantId}.ts.
 */
export function configToTypeScript(
  tenantId: string,
  config: AppTemplate
): string {
  const typeName = typeNameMap[config.templateId];
  const constName = toConstName(tenantId);

  const jsonBody = JSON.stringify(config, null, 2)
    // Indent the JSON body by 2 to sit inside the `export const` block
    // (first line doesn't need extra indent since it follows the `= `)
    ;

  return `import type { ${typeName} } from "../../src/templates/types";

export const ${constName}Template: ${typeName} = ${jsonBody};
`;
}
