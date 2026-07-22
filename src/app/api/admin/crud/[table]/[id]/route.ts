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

type Ctx = { params: Promise<{ table: string; id: string }> };

function buildPayload(table: AdminCrudTable, body: Record<string, unknown>) {
  const config = adminCrudConfigs[table];
  const payload: Record<string, unknown> = {};
  for (const field of config.fields) {
    if (!(field.key in body)) continue;
    payload[field.key] = normalizeCrudValue(field, body[field.key]);
  }
  if ("slug" in payload && !payload.slug && typeof body.title === "string") {
    payload.slug = slugify(body.title);
  }
  if (table === "blog_posts" && payload.published === true && !body.published_at) {
    payload.published_at = new Date().toISOString();
  }
  payload.updated_at = new Date().toISOString();
  return payload;
}

export async function PATCH(request: Request, ctx: Ctx) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { table, id } = await ctx.params;
  if (!isAdminCrudTable(table)) {
    return NextResponse.json({ error: "Unknown table" }, { status: 404 });
  }
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const payload = buildPayload(table, body);
  const supabase = createAdminClient();
  const { data, error } = await supabase.from(table).update(payload).eq("id", id).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ row: data });
}

export async function DELETE(_request: Request, ctx: Ctx) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { table, id } = await ctx.params;
  if (!isAdminCrudTable(table)) {
    return NextResponse.json({ error: "Unknown table" }, { status: 404 });
  }
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const supabase = createAdminClient();
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
