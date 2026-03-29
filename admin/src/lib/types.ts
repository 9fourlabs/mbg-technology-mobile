// Mirrored from mobile repo: src/templates/types.ts — keep in sync

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
};

export type InformationalTemplate = {
  templateId: "informational";
  brand: BrandConfig;
  tabs: TemplateTab[];
};

export type AuthConfig = {
  supabaseUrl: string;
  supabaseAnonKey: string;
};

export type AuthenticatedTemplate = {
  templateId: "authenticated";
  brand: BrandConfig;
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
  auth: AuthConfig;
  content: ContentConfig;
  tabs: TemplateTab[];
  protectedTabs?: string[];
};

// FORMS
export type FormFieldType =
  | "text"
  | "email"
  | "phone"
  | "textarea"
  | "select"
  | "checkbox"
  | "date"
  | "file";

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
  auth: AuthConfig;
  directory: DirectoryConfig;
  tabs: TemplateTab[];
  protectedTabs?: string[];
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

// ---------------------------------------------------------------------------
// Admin-specific types
// ---------------------------------------------------------------------------

export type TenantStatus = "draft" | "preview" | "production";

export type TenantRecord = {
  id: string;
  template_type: TemplateId;
  config: AppTemplate;
  status: TenantStatus;
  expo_project_id: string | null;
  supabase_project_id: string | null;
  supabase_url: string | null;
  supabase_anon_key: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type BuildRecord = {
  id: string;
  tenant_id: string;
  profile: string;
  platform: string | null;
  status: string;
  eas_build_id: string | null;
  eas_workflow_url: string | null;
  download_url: string | null;
  error: string | null;
  triggered_by: string | null;
  created_at: string;
  updated_at: string;
};
