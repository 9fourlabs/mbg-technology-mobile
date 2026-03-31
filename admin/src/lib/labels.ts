/**
 * Human-friendly labels for template types and statuses.
 * Use these everywhere in the UI instead of raw database values.
 */

export const TEMPLATE_LABELS: Record<string, string> = {
  informational: "Info Pages",
  authenticated: "Member Portal",
  booking: "Booking & Scheduling",
  commerce: "Online Store",
  loyalty: "Loyalty & Rewards",
  content: "Blog & Articles",
  forms: "Forms & Surveys",
  directory: "Directory & Listings",
  custom: "Custom App",
};

export const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  preview: "In Preview",
  production: "Live",
};

export const BUILD_STATUS_LABELS: Record<string, string> = {
  pending: "Queued",
  queued: "Queued",
  building: "Building",
  completed: "Complete",
  failed: "Failed",
  cancelled: "Cancelled",
};

/** Friendly template descriptions for the creation wizard. */
export const TEMPLATE_DESCRIPTIONS: Record<string, string> = {
  informational: "Simple branded app with pages of content",
  authenticated: "Content with user login and accounts",
  booking: "Appointment and scheduling system",
  commerce: "E-commerce store with payments",
  loyalty: "Digital loyalty program with points and rewards",
  content: "Article feed with categories and bookmarks",
  forms: "Custom data collection forms",
  directory: "Searchable directory with categories",
};
