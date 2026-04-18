// ---------------------------------------------------------------------------
// Content-management table schemas used by the admin panel to render generic
// CRUD UI for each template type.
// ---------------------------------------------------------------------------

export type ColumnDef = {
  key: string;
  label: string;
  type:
    | "text"
    | "number"
    | "decimal"
    | "boolean"
    | "date"
    | "datetime"
    | "textarea"
    | "select"
    | "json";
  tableVisible: boolean;
  formVisible: boolean;
  required: boolean;
  options?: { label: string; value: string }[];
  placeholder?: string;
};

export type TableSchema = {
  table: string;
  label: string;
  labelSingular: string;
  columns: ColumnDef[];
  readOnly: boolean;
  defaultSort: { column: string; ascending: boolean };
};

// ---------------------------------------------------------------------------
// Booking
// ---------------------------------------------------------------------------

const bookingServices: TableSchema = {
  table: "services",
  label: "Services",
  labelSingular: "Service",
  readOnly: false,
  defaultSort: { column: "sort_order", ascending: true },
  columns: [
    { key: "name", label: "Name", type: "text", tableVisible: true, formVisible: true, required: true },
    { key: "description", label: "Description", type: "textarea", tableVisible: false, formVisible: true, required: false },
    { key: "duration", label: "Duration (min)", type: "number", tableVisible: true, formVisible: true, required: true },
    { key: "price", label: "Price", type: "decimal", tableVisible: true, formVisible: true, required: true },
    { key: "active", label: "Active", type: "boolean", tableVisible: true, formVisible: true, required: false },
    { key: "sort_order", label: "Sort Order", type: "number", tableVisible: true, formVisible: true, required: false },
  ],
};

const bookingTimeSlots: TableSchema = {
  table: "time_slots",
  label: "Time Slots",
  labelSingular: "Time Slot",
  readOnly: false,
  defaultSort: { column: "date", ascending: true },
  columns: [
    { key: "service_id", label: "Service ID", type: "text", tableVisible: true, formVisible: true, required: true },
    { key: "date", label: "Date", type: "date", tableVisible: true, formVisible: true, required: true },
    { key: "start_time", label: "Start Time", type: "text", tableVisible: true, formVisible: true, required: true, placeholder: "09:00" },
    { key: "end_time", label: "End Time", type: "text", tableVisible: true, formVisible: true, required: true, placeholder: "09:30" },
    { key: "max_bookings", label: "Max Bookings", type: "number", tableVisible: true, formVisible: true, required: true },
  ],
};

const bookingBookings: TableSchema = {
  table: "bookings",
  label: "Bookings",
  labelSingular: "Booking",
  readOnly: true,
  defaultSort: { column: "created_at", ascending: false },
  columns: [
    { key: "user_id", label: "User ID", type: "text", tableVisible: true, formVisible: true, required: false },
    { key: "service_id", label: "Service ID", type: "text", tableVisible: true, formVisible: true, required: false },
    { key: "status", label: "Status", type: "text", tableVisible: true, formVisible: true, required: false },
    { key: "notes", label: "Notes", type: "textarea", tableVisible: false, formVisible: true, required: false },
    { key: "created_at", label: "Created At", type: "datetime", tableVisible: true, formVisible: false, required: false },
  ],
};

// ---------------------------------------------------------------------------
// Commerce
// ---------------------------------------------------------------------------

const commerceCategories: TableSchema = {
  table: "categories",
  label: "Categories",
  labelSingular: "Category",
  readOnly: false,
  defaultSort: { column: "sort_order", ascending: true },
  columns: [
    { key: "name", label: "Name", type: "text", tableVisible: true, formVisible: true, required: true },
    { key: "slug", label: "Slug", type: "text", tableVisible: true, formVisible: true, required: true },
    { key: "image_url", label: "Image URL", type: "text", tableVisible: false, formVisible: true, required: false },
    { key: "sort_order", label: "Sort Order", type: "number", tableVisible: true, formVisible: true, required: false },
  ],
};

const commerceProducts: TableSchema = {
  table: "products",
  label: "Products",
  labelSingular: "Product",
  readOnly: false,
  defaultSort: { column: "name", ascending: true },
  columns: [
    { key: "name", label: "Name", type: "text", tableVisible: true, formVisible: true, required: true },
    { key: "description", label: "Description", type: "textarea", tableVisible: false, formVisible: true, required: false },
    { key: "price", label: "Price", type: "decimal", tableVisible: true, formVisible: true, required: true },
    { key: "image_url", label: "Image URL", type: "text", tableVisible: false, formVisible: true, required: false },
    { key: "category_id", label: "Category ID", type: "text", tableVisible: true, formVisible: true, required: false },
    { key: "active", label: "Active", type: "boolean", tableVisible: true, formVisible: true, required: false },
    { key: "stock", label: "Stock", type: "number", tableVisible: true, formVisible: true, required: false },
  ],
};

const commerceOrders: TableSchema = {
  table: "orders",
  label: "Orders",
  labelSingular: "Order",
  readOnly: true,
  defaultSort: { column: "created_at", ascending: false },
  columns: [
    { key: "user_id", label: "User ID", type: "text", tableVisible: true, formVisible: true, required: false },
    { key: "status", label: "Status", type: "text", tableVisible: true, formVisible: true, required: false },
    { key: "subtotal", label: "Subtotal", type: "decimal", tableVisible: true, formVisible: true, required: false },
    { key: "tax", label: "Tax", type: "decimal", tableVisible: true, formVisible: true, required: false },
    { key: "total", label: "Total", type: "decimal", tableVisible: true, formVisible: true, required: false },
    { key: "created_at", label: "Created At", type: "datetime", tableVisible: true, formVisible: false, required: false },
  ],
};

// ---------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------

const contentPosts: TableSchema = {
  table: "posts",
  label: "Posts",
  labelSingular: "Post",
  readOnly: false,
  defaultSort: { column: "published_at", ascending: false },
  columns: [
    { key: "title", label: "Title", type: "text", tableVisible: true, formVisible: true, required: true },
    { key: "slug", label: "Slug", type: "text", tableVisible: true, formVisible: true, required: true },
    { key: "excerpt", label: "Excerpt", type: "textarea", tableVisible: false, formVisible: true, required: false },
    { key: "body", label: "Body", type: "textarea", tableVisible: false, formVisible: true, required: true },
    { key: "image_url", label: "Image URL", type: "text", tableVisible: false, formVisible: true, required: false },
    { key: "category_id", label: "Category ID", type: "text", tableVisible: true, formVisible: true, required: false },
    { key: "published", label: "Published", type: "boolean", tableVisible: true, formVisible: true, required: false },
    { key: "published_at", label: "Published At", type: "datetime", tableVisible: true, formVisible: true, required: false },
  ],
};

const contentEvents: TableSchema = {
  table: "events",
  label: "Events",
  labelSingular: "Event",
  readOnly: false,
  defaultSort: { column: "starts_at", ascending: true },
  columns: [
    { key: "title", label: "Title", type: "text", tableVisible: true, formVisible: true, required: true },
    { key: "description", label: "Description", type: "textarea", tableVisible: false, formVisible: true, required: false },
    { key: "starts_at", label: "Starts", type: "datetime", tableVisible: true, formVisible: true, required: true },
    { key: "ends_at", label: "Ends", type: "datetime", tableVisible: true, formVisible: true, required: false },
    { key: "location", label: "Location", type: "text", tableVisible: true, formVisible: true, required: false, placeholder: "123 Main St" },
    { key: "image_url", label: "Image URL", type: "text", tableVisible: false, formVisible: true, required: false },
    { key: "rsvp_url", label: "RSVP URL", type: "text", tableVisible: false, formVisible: true, required: false },
    { key: "category", label: "Category", type: "text", tableVisible: true, formVisible: true, required: false },
    { key: "published", label: "Published", type: "boolean", tableVisible: true, formVisible: true, required: false },
  ],
};

// ---------------------------------------------------------------------------
// Directory
// ---------------------------------------------------------------------------

const directoryItems: TableSchema = {
  table: "directory_items",
  label: "Directory Items",
  labelSingular: "Directory Item",
  readOnly: false,
  defaultSort: { column: "name", ascending: true },
  columns: [
    { key: "name", label: "Name", type: "text", tableVisible: true, formVisible: true, required: true },
    { key: "category_id", label: "Category ID", type: "text", tableVisible: true, formVisible: true, required: false },
    { key: "image_url", label: "Image URL", type: "text", tableVisible: false, formVisible: true, required: false },
    { key: "data", label: "Data", type: "json", tableVisible: false, formVisible: true, required: false },
    { key: "latitude", label: "Latitude", type: "decimal", tableVisible: true, formVisible: true, required: false },
    { key: "longitude", label: "Longitude", type: "decimal", tableVisible: true, formVisible: true, required: false },
    { key: "active", label: "Active", type: "boolean", tableVisible: true, formVisible: true, required: false },
  ],
};

// ---------------------------------------------------------------------------
// Forms
// ---------------------------------------------------------------------------

const formSubmissions: TableSchema = {
  table: "form_submissions",
  label: "Form Submissions",
  labelSingular: "Form Submission",
  readOnly: true,
  defaultSort: { column: "created_at", ascending: false },
  columns: [
    { key: "user_id", label: "User ID", type: "text", tableVisible: true, formVisible: true, required: false },
    { key: "form_id", label: "Form ID", type: "text", tableVisible: true, formVisible: true, required: false },
    { key: "data", label: "Data", type: "json", tableVisible: false, formVisible: true, required: false },
    {
      key: "status",
      label: "Status",
      type: "select",
      tableVisible: true,
      formVisible: true,
      required: false,
      options: [
        { label: "Submitted", value: "submitted" },
        { label: "In Review", value: "in_review" },
        { label: "Approved", value: "approved" },
        { label: "Rejected", value: "rejected" },
      ],
    },
    { key: "created_at", label: "Created At", type: "datetime", tableVisible: true, formVisible: false, required: false },
  ],
};

// ---------------------------------------------------------------------------
// Loyalty
// ---------------------------------------------------------------------------

const loyaltyRewards: TableSchema = {
  table: "loyalty_rewards",
  label: "Loyalty Rewards",
  labelSingular: "Reward",
  readOnly: false,
  defaultSort: { column: "name", ascending: true },
  columns: [
    { key: "name", label: "Name", type: "text", tableVisible: true, formVisible: true, required: true },
    { key: "description", label: "Description", type: "textarea", tableVisible: false, formVisible: true, required: false },
    { key: "points_cost", label: "Points Cost", type: "number", tableVisible: true, formVisible: true, required: true },
    { key: "image_url", label: "Image URL", type: "text", tableVisible: false, formVisible: true, required: false },
    { key: "active", label: "Active", type: "boolean", tableVisible: true, formVisible: true, required: false },
    { key: "stock", label: "Stock", type: "number", tableVisible: true, formVisible: true, required: false },
  ],
};

const loyaltyTransactions: TableSchema = {
  table: "loyalty_transactions",
  label: "Loyalty Transactions",
  labelSingular: "Transaction",
  readOnly: true,
  defaultSort: { column: "created_at", ascending: false },
  columns: [
    { key: "user_id", label: "User ID", type: "text", tableVisible: true, formVisible: true, required: false },
    { key: "type", label: "Type", type: "text", tableVisible: true, formVisible: true, required: false },
    { key: "points", label: "Points", type: "number", tableVisible: true, formVisible: true, required: false },
    { key: "description", label: "Description", type: "text", tableVisible: true, formVisible: true, required: false },
    { key: "created_at", label: "Created At", type: "datetime", tableVisible: true, formVisible: false, required: false },
  ],
};

const loyaltyAccounts: TableSchema = {
  table: "loyalty_accounts",
  label: "Loyalty Accounts",
  labelSingular: "Account",
  readOnly: true,
  defaultSort: { column: "points_balance", ascending: false },
  columns: [
    { key: "user_id", label: "User ID", type: "text", tableVisible: true, formVisible: true, required: false },
    { key: "points_balance", label: "Points Balance", type: "number", tableVisible: true, formVisible: true, required: false },
    { key: "lifetime_points", label: "Lifetime Points", type: "number", tableVisible: true, formVisible: true, required: false },
    { key: "tier", label: "Tier", type: "text", tableVisible: true, formVisible: true, required: false },
  ],
};

// ---------------------------------------------------------------------------
// Schema registry
// ---------------------------------------------------------------------------

const SCHEMAS_BY_TEMPLATE: Record<string, TableSchema[]> = {
  booking: [bookingServices, bookingTimeSlots, bookingBookings],
  commerce: [commerceCategories, commerceProducts, commerceOrders],
  content: [contentPosts, contentEvents],
  directory: [directoryItems],
  forms: [formSubmissions],
  loyalty: [loyaltyRewards, loyaltyTransactions, loyaltyAccounts],
};

/**
 * Maps each template type to the set of table names the admin panel is allowed
 * to read/write for that template. Used as a server-side allowlist to prevent
 * arbitrary table access.
 */
export const TEMPLATE_TABLE_ALLOWLIST: Record<string, string[]> = Object.fromEntries(
  Object.entries(SCHEMAS_BY_TEMPLATE).map(([template, schemas]) => [
    template,
    schemas.map((s) => s.table),
  ]),
);

/**
 * Returns the table schemas relevant to a given template type, or an empty
 * array if the template has no content tables.
 */
export function getSchemasForTemplate(templateType: string): TableSchema[] {
  return SCHEMAS_BY_TEMPLATE[templateType] ?? [];
}
