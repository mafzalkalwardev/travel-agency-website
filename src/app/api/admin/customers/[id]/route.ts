import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/supabase/require-admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";

const ALLOWED_STATUSES = ["pending", "approved", "rejected"] as const;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  const { id } = await params;
  const body = await request.json();
  const approvalStatus = body.approval_status as (typeof ALLOWED_STATUSES)[number] | undefined;
  const approvalNotes = body.approval_notes as string | undefined;

  if (!approvalStatus || !ALLOWED_STATUSES.includes(approvalStatus)) {
    return NextResponse.json({ error: "Invalid approval status" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const patch = {
    approval_status: approvalStatus,
    approval_notes: approvalNotes ?? null,
    approved_at: approvalStatus === "approved" ? new Date().toISOString() : null,
    approved_by: approvalStatus === "approved" ? admin.id : null,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("customer_profiles").update(patch).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, approval_status: approvalStatus });
}
