/**
 * Per-template-type resource registry.
 *
 * For each template_type a tenant might be on, defines which collections
 * the customer can manage from the in-portal CMS, and what each field
 * looks like in the UI. The shape here drives:
 *
 *   - The list view (which columns to show)
 *   - The create/edit form (which inputs and what kind)
 *   - The available navigation in /client/[tenantId]/cms
 *
 * Mirrors the ALLOWLIST in `admin/src/app/api/tenants/[id]/content/route.ts`
 * — adding a new collection to the API allowlist without registering it
 * here means it's still server-CRUD-able but won't appear in the UI.
 */

export type FieldKind =
  | "text"
  | "textarea"
  | "richtext"
  | "url"
  | "email"
  | "number"
  | "boolean"
  | "date"
  | "datetime"
  | "select";

export interface ResourceField {
  /** DB column name. */
  name: string;
  /** Friendly label for the UI. */
  label: string;
  kind: FieldKind;
  /** For select fields, the options. */
  options?: string[];
  /** Whether the field is required at create time. */
  required?: boolean;
  /** Whether to show this column in the list view. */
  showInList?: boolean;
  /** Width hint for the form (full row vs half row). */
  span?: "full" | "half";
}

export interface ResourceDefinition {
  /** Collection / table name (matches the API route's `?table=` param). */
  name: string;
  /** Customer-facing label, e.g. "Posts", "Events". */
  label: string;
  /** Plural label for the list view header. */
  pluralLabel: string;
  /** Short description shown on the CMS dashboard. */
  description: string;
  /** Lucide-style icon name; rendered by the dashboard tile. */
  icon: string;
  fields: ResourceField[];
  /**
   * Field name to use as the "title" in list rows and as the page heading
   * for individual records. Defaults to "title" when present.
   */
  titleField?: string;
}

export const RESOURCES_BY_TEMPLATE: Record<string, ResourceDefinition[]> = {
  content: [
    {
      name: "posts",
      label: "Post",
      pluralLabel: "Posts",
      description: "Articles, news updates, blog entries.",
      icon: "FileText",
      titleField: "title",
      fields: [
        { name: "title", label: "Title", kind: "text", required: true, showInList: true, span: "full" },
        { name: "slug", label: "URL Slug", kind: "text", required: true, showInList: true, span: "half" },
        { name: "category_id", label: "Category", kind: "text", span: "half" },
        { name: "excerpt", label: "Excerpt (preview text)", kind: "textarea", span: "full" },
        { name: "body", label: "Body", kind: "richtext", span: "full" },
        { name: "image_url", label: "Cover Image URL", kind: "url", span: "full" },
        { name: "published", label: "Published", kind: "boolean", showInList: true, span: "half" },
        { name: "published_at", label: "Publish Date", kind: "datetime", showInList: true, span: "half" },
      ],
    },
    {
      name: "events",
      label: "Event",
      pluralLabel: "Events",
      description: "Calendar events, programs, scheduled activities.",
      icon: "Calendar",
      titleField: "title",
      fields: [
        { name: "title", label: "Title", kind: "text", required: true, showInList: true, span: "full" },
        { name: "starts_at", label: "Starts at", kind: "datetime", required: true, showInList: true, span: "half" },
        { name: "ends_at", label: "Ends at", kind: "datetime", showInList: true, span: "half" },
        { name: "location", label: "Location", kind: "text", showInList: true, span: "full" },
        { name: "description", label: "Description", kind: "textarea", span: "full" },
        { name: "image_url", label: "Image URL", kind: "url", span: "half" },
        { name: "rsvp_url", label: "RSVP / Tickets URL", kind: "url", span: "half" },
        { name: "category", label: "Category", kind: "text", span: "half" },
        { name: "published", label: "Published", kind: "boolean", showInList: true, span: "half" },
      ],
    },
  ],
  directory: [
    {
      name: "directory_items",
      label: "Listing",
      pluralLabel: "Listings",
      description: "Directory entries — businesses, members, services, places.",
      icon: "MapPin",
      titleField: "name",
      fields: [
        { name: "name", label: "Name", kind: "text", required: true, showInList: true, span: "full" },
        { name: "category", label: "Category", kind: "text", showInList: true, span: "half" },
        { name: "subcategory", label: "Subcategory", kind: "text", span: "half" },
        { name: "description", label: "Description", kind: "textarea", span: "full" },
        { name: "address", label: "Address", kind: "text", span: "full" },
        { name: "phone", label: "Phone", kind: "text", span: "half" },
        { name: "email", label: "Email", kind: "email", span: "half" },
        { name: "website", label: "Website", kind: "url", span: "full" },
        { name: "image_url", label: "Image URL", kind: "url", span: "full" },
        { name: "published", label: "Published", kind: "boolean", showInList: true, span: "half" },
      ],
    },
  ],
  booking: [
    {
      name: "services",
      label: "Service",
      pluralLabel: "Services",
      description: "Bookable offerings — appointments, classes, sessions.",
      icon: "Briefcase",
      titleField: "name",
      fields: [
        { name: "name", label: "Name", kind: "text", required: true, showInList: true, span: "full" },
        { name: "description", label: "Description", kind: "textarea", span: "full" },
        { name: "duration_minutes", label: "Duration (minutes)", kind: "number", showInList: true, span: "half" },
        { name: "price_cents", label: "Price (cents USD)", kind: "number", showInList: true, span: "half" },
        { name: "image_url", label: "Image URL", kind: "url", span: "full" },
        { name: "active", label: "Active", kind: "boolean", showInList: true, span: "half" },
      ],
    },
  ],
  commerce: [
    {
      name: "categories",
      label: "Category",
      pluralLabel: "Categories",
      description: "Product groupings.",
      icon: "Folder",
      titleField: "name",
      fields: [
        { name: "name", label: "Name", kind: "text", required: true, showInList: true, span: "full" },
        { name: "slug", label: "URL Slug", kind: "text", required: true, showInList: true, span: "half" },
        { name: "image_url", label: "Image URL", kind: "url", span: "half" },
      ],
    },
    {
      name: "products",
      label: "Product",
      pluralLabel: "Products",
      description: "Items for sale.",
      icon: "Package",
      titleField: "name",
      fields: [
        { name: "name", label: "Name", kind: "text", required: true, showInList: true, span: "full" },
        { name: "description", label: "Description", kind: "textarea", span: "full" },
        { name: "price_cents", label: "Price (cents USD)", kind: "number", required: true, showInList: true, span: "half" },
        { name: "category_id", label: "Category", kind: "text", span: "half" },
        { name: "image_url", label: "Image URL", kind: "url", span: "full" },
        { name: "in_stock", label: "In Stock", kind: "boolean", showInList: true, span: "half" },
      ],
    },
  ],
  loyalty: [
    {
      name: "loyalty_rewards",
      label: "Reward",
      pluralLabel: "Rewards",
      description: "Loyalty rewards customers can redeem points for.",
      icon: "Gift",
      titleField: "name",
      fields: [
        { name: "name", label: "Name", kind: "text", required: true, showInList: true, span: "full" },
        { name: "description", label: "Description", kind: "textarea", span: "full" },
        { name: "points_required", label: "Points Required", kind: "number", required: true, showInList: true, span: "half" },
        { name: "active", label: "Active", kind: "boolean", showInList: true, span: "half" },
      ],
    },
  ],
};

export function getResourcesForTemplate(
  templateType: string,
): ResourceDefinition[] {
  return RESOURCES_BY_TEMPLATE[templateType] ?? [];
}

export function getResourceDefinition(
  templateType: string,
  resourceName: string,
): ResourceDefinition | null {
  return (
    RESOURCES_BY_TEMPLATE[templateType]?.find((r) => r.name === resourceName) ??
    null
  );
}
