import { NextResponse } from "next/server";
import {
  adminCrudConfigs,
  isAdminCrudTable,
  normalizeCrudValue,
  slugify,
  type AdminCrudTable,
} from "@/lib/admin/crud-tables";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/supabase/require-admin";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ table: string }> };

function buildPayload(table: AdminCrudTable, body: Record<string, unknown>) {
  const config = adminCrudConfigs[table];
  const payload: Record<string, unknown> = {};
  for (const field of config.fields) {
    payload[field.key] = normalizeCrudValue(field, body[field.key]);
  }

  if ("slug" in payload) {
    const slug = payload.slug;
    if (!slug && typeof payload.title === "string") {
      payload.slug = slugify(payload.title);
    }
  }

  if (table === "umrah_packages" || table === "tour_packages") {
    if (!body.id) {
      payload.source_provider = payload.source_provider || "manual";
    }
  }

  if (table === "blog_posts" && payload.published === true && !body.published_at) {
    payload.published_at = new Date().toISOString();
  }

  payload.updated_at = new Date().toISOString();
  return payload;
}

export async function GET(_request: Request, ctx: Ctx) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { table } = await ctx.params;
  if (!isAdminCrudTable(table)) {
    return NextResponse.json({ error: "Unknown table" }, { status: 404 });
  }

  const config = adminCrudConfigs[table];
  const supabase = createAdminClient();
  const orderBy = config.orderBy || "created_at";
  const ascending = config.ascending ?? orderBy !== "created_at";

  const { data, error } = await supabase
    .from(table)
    .select("*")
    .order(orderBy, { ascending })
    .limit(250);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ rows: data || [], config });
}

export async function POST(request: Request, ctx: Ctx) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { table } = await ctx.params;
  if (!isAdminCrudTable(table)) {
    return NextResponse.json({ error: "Unknown table" }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const config = adminCrudConfigs[table];
  for (const field of config.fields) {
    if (!field.required) continue;
    const value = normalizeCrudValue(field, body[field.key]);
    if (value === null || value === undefined || value === "") {
      // slug can be derived from title
      if (field.key === "slug" && typeof body.title === "string" && body.title.trim()) continue;
      return NextResponse.json({ error: `${field.label} is required` }, { status: 400 });
    }
  }

  const payload = buildPayload(table, body);
  const supabase = createAdminClient();
  const { data, error } = await supabase.from(table).insert(payload).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ row: data });
}
