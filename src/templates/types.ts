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

export type InformationalTemplate = {
  templateId: "informational";
  brand: {
    logoUri: string;
    primaryColor: string;
    backgroundColor: string;
    textColor: string;
    mutedTextColor: string;
  };
  tabs: TemplateTab[];
};

