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

export type AppTemplate = InformationalTemplate | AuthenticatedTemplate;
