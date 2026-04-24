export type TemplateAction =
  | { type: "open_url"; url: string; label: string; variant?: "primary" | "secondary" }
  | { type: "none" };

export type TemplateCard = {
  id: string;
  imageUri?: string;
  title: string;
  body: string;
  action?: TemplateAction;
};

export type TemplateTab = {
  id: string;
  label: string;
  headerTitle: string;
  headerBody: string;
  cards: TemplateCard[];
};

export type BrandConfig = {
  logoUri: string;
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  mutedTextColor: string;
  splashBackgroundColor?: string;
};

export type ThemePreset = "modern" | "classic" | "minimal" | "bold" | "elegant";

export type DesignConfig = {
  preset?: ThemePreset;
  cardStyle?: "rounded" | "sharp" | "flat";
  cardColumns?: 1 | 2;
  buttonRadius?: number;
  headerStyle?: "centered" | "left";
  tabBarStyle?: "pills" | "underline";
  typography?: {
    headingSize?: "small" | "medium" | "large";
    bodySize?: "small" | "medium" | "large";
  };
  secondaryColor?: string;
};

export type InformationalTemplate = {
  templateId: "informational";
  brand: BrandConfig;
  design?: DesignConfig;
  appStore?: AppStoreMetadata;
  tabs: TemplateTab[];
};

export type AuthConfig = {
  supabaseUrl: string;
  supabaseAnonKey: string;
  /**
   * Optional: if the tenant has been migrated to its own Pocketbase
   * instance, this URL routes per-tenant data reads (posts, bookmarks,
   * directory, etc.) to that PB instance instead of Supabase.
   *
   * End-user auth still goes through Supabase until Phase 3 of the
   * migration moves auth too. See docs/POCKETBASE_MIGRATION.md.
   */
  pocketbaseUrl?: string;
  /**
   * Backend selector for per-tenant data. Defaults to "supabase" for
   * backwards compatibility — only set to "pocketbase" once the tenant's
   * PB instance is provisioned and pocketbaseUrl is populated.
   */
  backend?: "supabase" | "pocketbase";
};

export type AuthenticatedTemplate = {
  templateId: "authenticated";
  brand: BrandConfig;
  design?: DesignConfig;
  appStore?: AppStoreMetadata;
  auth: AuthConfig;
  tabs: TemplateTab[];
  protectedTabs?: string[];
};

// BOOKING
export type BookingService = {
  id: string;
  name: string;
  duration: number;
  description?: string;
  price?: number;
};

export type BookingConfig = {
  services: BookingService[];
  businessHours: { day: number; start: string; end: string }[];
  slotDuration: number;
  advanceBookingDays: number;
  cancellationPolicy?: string;
};

export type BookingTemplate = {
  templateId: "booking";
  brand: BrandConfig;
  design?: DesignConfig;
  appStore?: AppStoreMetadata;
  auth: AuthConfig;
  booking: BookingConfig;
  tabs: TemplateTab[];
  protectedTabs?: string[];
};

// COMMERCE
export type CommerceConfig = {
  stripePublishableKey: string;
  currency: string;
  storeName: string;
  categories: { id: string; name: string; imageUri?: string }[];
  shippingEnabled: boolean;
  taxRate?: number;
};

export type CommerceTemplate = {
  templateId: "commerce";
  brand: BrandConfig;
  design?: DesignConfig;
  appStore?: AppStoreMetadata;
  auth: AuthConfig;
  commerce: CommerceConfig;
  tabs: TemplateTab[];
  protectedTabs?: string[];
};

// LOYALTY
export type LoyaltyTier = {
  id: string;
  name: string;
  minPoints: number;
  color: string;
  perks?: string[];
};

export type LoyaltyReward = {
  id: string;
  name: string;
  pointsCost: number;
  description?: string;
  imageUri?: string;
};

export type LoyaltyConfig = {
  pointsPerVisit: number;
  programName: string;
  tiers: LoyaltyTier[];
  rewards: LoyaltyReward[];
};

export type LoyaltyTemplate = {
  templateId: "loyalty";
  brand: BrandConfig;
  design?: DesignConfig;
  appStore?: AppStoreMetadata;
  auth: AuthConfig;
  loyalty: LoyaltyConfig;
  tabs: TemplateTab[];
  protectedTabs?: string[];
};

// CONTENT
export type ContentConfig = {
  categories: { id: string; name: string }[];
  displayMode: "feed" | "grid";
  allowBookmarks: boolean;
};

export type ContentTemplate = {
  templateId: "content";
  brand: BrandConfig;
  design?: DesignConfig;
  appStore?: AppStoreMetadata;
  auth: AuthConfig;
  content: ContentConfig;
  tabs: TemplateTab[];
  protectedTabs?: string[];
};

// FORMS
export type FormFieldType = "text" | "email" | "phone" | "textarea" | "select" | "checkbox" | "date" | "file";

export type FormField = {
  id: string;
  label: string;
  type: FormFieldType;
  required?: boolean;
  placeholder?: string;
  options?: { label: string; value: string }[];
  validation?: { pattern?: string; message?: string; maxLength?: number };
};

export type FormDefinition = {
  id: string;
  title: string;
  description?: string;
  fields: FormField[];
};

export type FormsConfig = {
  forms: FormDefinition[];
  allowFileUploads: boolean;
  maxFileSizeMb?: number;
};

export type FormsTemplate = {
  templateId: "forms";
  brand: BrandConfig;
  design?: DesignConfig;
  appStore?: AppStoreMetadata;
  auth: AuthConfig;
  forms: FormsConfig;
  tabs: TemplateTab[];
  protectedTabs?: string[];
};

// DIRECTORY
export type DirectoryFieldDef = {
  key: string;
  label: string;
  type: "text" | "email" | "phone" | "url" | "address";
  searchable?: boolean;
};

export type DirectoryConfig = {
  itemLabel: string;
  itemLabelPlural: string;
  fields: DirectoryFieldDef[];
  categories: { id: string; name: string }[];
  enableMap: boolean;
};

export type DirectoryTemplate = {
  templateId: "directory";
  brand: BrandConfig;
  design?: DesignConfig;
  appStore?: AppStoreMetadata;
  auth: AuthConfig;
  directory: DirectoryConfig;
  tabs: TemplateTab[];
  protectedTabs?: string[];
};

// APP STORE METADATA
export type AppStoreMetadata = {
  appName: string;
  appDescription?: string;
  appKeywords?: string[];
  iconUri?: string;
  adaptiveIconBackgroundColor?: string;
  splashBackgroundColor?: string;

  // --- Submission identifiers (captured when the tenant's app is registered
  // in App Store Connect / Play Console). Used by scripts/getSubmitEnv.ts
  // to populate eas.json's `submit.production` block at submit time.

  /**
   * App Store Connect numeric App ID (found on the app's ASC page, aka
   * "Apple ID" — not to be confused with the bundle identifier). Required
   * for `eas submit --platform ios`.
   */
  iosAscAppId?: string;

  /**
   * Google Play Console package name. Defaults to the Android `package` field
   * derived from `NATIVE_ID_MODE`, but can be overridden here if the package
   * was registered under a different name for a specific tenant.
   */
  androidPackageName?: string;

  /**
   * If true, builds for this tenant will include the `expo-notifications`
   * native module (sets EXPO_PUSH_ENABLED=1 in the build env). Requires the
   * iOS provisioning profile to have the Push Notifications capability —
   * see docs/PUSH_NOTIFICATIONS.md. Defaults to false to keep builds safe
   * for tenants that haven't yet set up push capability.
   */
  pushEnabled?: boolean;
};

// UNION
export type AppTemplate =
  | InformationalTemplate
  | AuthenticatedTemplate
  | BookingTemplate
  | CommerceTemplate
  | LoyaltyTemplate
  | ContentTemplate
  | FormsTemplate
  | DirectoryTemplate;

export type TemplateId = AppTemplate["templateId"];
