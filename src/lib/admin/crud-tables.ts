export type FieldType = "text" | "textarea" | "number" | "boolean" | "select";

export interface FieldConfig {
  key: string;
  label: string;
  type?: FieldType;
  required?: boolean;
  options?: string[];
  hint?: string;
}

export interface TableConfig {
  fields: FieldConfig[];
  titleKey: string;
  statusKey?: string;
  orderBy?: string;
  ascending?: boolean;
  /** Tables fed by TravelLine sync — warn before overwrite/delete */
  syncAware?: boolean;
}

export const ADMIN_CRUD_TABLES = [
  "announcements",
  "flyers",
  "umrah_packages",
  "tour_packages",
  "blog_posts",
  "gallery_items",
  "airlines",
  "site_settings",
] as const;

export type AdminCrudTable = (typeof ADMIN_CRUD_TABLES)[number];

export function isAdminCrudTable(table: string): table is AdminCrudTable {
  return (ADMIN_CRUD_TABLES as readonly string[]).includes(table);
}

export const adminCrudConfigs: Record<AdminCrudTable, TableConfig> = {
  announcements: {
    titleKey: "message",
    statusKey: "active",
    orderBy: "priority",
    ascending: true,
    fields: [
      { key: "message", label: "Message", type: "textarea", required: true },
      { key: "priority", label: "Priority", type: "number" },
      { key: "active", label: "Active", type: "boolean" },
    ],
  },
  flyers: {
    titleKey: "title",
    statusKey: "active",
    orderBy: "display_order",
    ascending: true,
    fields: [
      { key: "title", label: "Title", required: true },
      { key: "category", label: "Category" },
      { key: "image_url", label: "Image URL", required: true },
      { key: "link", label: "Link" },
      { key: "display_order", label: "Display order", type: "number" },
      { key: "active", label: "Active", type: "boolean" },
    ],
  },
  umrah_packages: {
    titleKey: "title",
    statusKey: "status",
    orderBy: "updated_at",
    ascending: false,
    syncAware: true,
    fields: [
      { key: "title", label: "Title", required: true },
      { key: "slug", label: "Slug", required: true, hint: "URL path segment; auto-fills from title if blank" },
      { key: "package_code", label: "Package code" },
      { key: "category", label: "Category" },
      { key: "price", label: "Price", type: "number", required: true },
      { key: "currency", label: "Currency" },
      { key: "duration", label: "Duration", required: true },
      { key: "departure_city", label: "Departure city" },
      { key: "airline", label: "Airline" },
      { key: "hotel_makkah", label: "Makkah hotel" },
      { key: "hotel_madinah", label: "Madinah hotel" },
      { key: "image_url", label: "Image URL" },
      { key: "featured", label: "Featured", type: "boolean" },
      {
        key: "status",
        label: "Status",
        type: "select",
        options: ["active", "inactive", "sold_out"],
        required: true,
      },
    ],
  },
  tour_packages: {
    titleKey: "title",
    statusKey: "status",
    orderBy: "updated_at",
    ascending: false,
    syncAware: true,
    fields: [
      { key: "title", label: "Title", required: true },
      { key: "slug", label: "Slug", required: true },
      { key: "destination", label: "Destination" },
      { key: "price", label: "Price", type: "number" },
      { key: "currency", label: "Currency" },
      { key: "duration", label: "Duration", required: true },
      { key: "image_url", label: "Image URL" },
      { key: "featured", label: "Featured", type: "boolean" },
      {
        key: "status",
        label: "Status",
        type: "select",
        options: ["active", "inactive", "sold_out"],
        required: true,
      },
    ],
  },
  blog_posts: {
    titleKey: "title",
    statusKey: "published",
    orderBy: "created_at",
    ascending: false,
    fields: [
      { key: "title", label: "Title", required: true },
      { key: "slug", label: "Slug", required: true },
      { key: "excerpt", label: "Excerpt", type: "textarea" },
      { key: "content", label: "Content", type: "textarea", required: true },
      { key: "cover_image_url", label: "Cover image URL" },
      { key: "category", label: "Category" },
      { key: "author", label: "Author" },
      { key: "published", label: "Published", type: "boolean" },
    ],
  },
  gallery_items: {
    titleKey: "title",
    statusKey: "active",
    orderBy: "display_order",
    ascending: true,
    fields: [
      { key: "title", label: "Title" },
      { key: "image_url", label: "Image URL", required: true },
      { key: "alt", label: "Alt text" },
      { key: "category", label: "Category" },
      { key: "display_order", label: "Display order", type: "number" },
      { key: "active", label: "Active", type: "boolean" },
    ],
  },
  airlines: {
    titleKey: "name",
    statusKey: "active",
    orderBy: "name",
    ascending: true,
    fields: [
      { key: "code", label: "Code", required: true },
      { key: "name", label: "Name", required: true },
      { key: "logo_url", label: "Logo URL" },
      { key: "active", label: "Active", type: "boolean" },
    ],
  },
  site_settings: {
    titleKey: "business_name",
    orderBy: "updated_at",
    ascending: false,
    fields: [
      { key: "business_name", label: "Business name", required: true },
      { key: "tagline", label: "Tagline" },
      { key: "whatsapp_number", label: "WhatsApp number" },
      { key: "email", label: "Email" },
    ],
  },
};

export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function defaultFieldValue(field: FieldConfig) {
  if (field.type === "boolean") return field.key === "published" ? false : true;
  if (field.type === "select") return field.options?.[0] || "active";
  if (field.type === "number") return "";
  if (field.key === "currency") return "PKR";
  if (field.key === "status") return "active";
  return "";
}

export function emptyCrudForm(config: TableConfig) {
  return Object.fromEntries(config.fields.map((field) => [field.key, defaultFieldValue(field)]));
}

export function normalizeCrudValue(field: FieldConfig, value: unknown) {
  if (field.type === "boolean") return Boolean(value);
  if (field.type === "number") {
    if (value === "" || value === null || value === undefined) return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed === "" ? null : trimmed;
  }
  return value ?? null;
}
