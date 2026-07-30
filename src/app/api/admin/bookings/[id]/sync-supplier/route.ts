import { NextResponse } from "next/server";
import { syncSupplierBookingStatus } from "@/lib/booking/supplier-confirm";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { requireAdmin } from "@/lib/supabase/require-admin";

export const maxDuration = 120;

/** Refresh supplier RESERVED/CONFIRMED/CANCELLED onto our booking row. */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  const { id } = await params;
  const result = await syncSupplierBookingStatus(id);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error || "Could not sync supplier status", travellineStatus: result.status },
      { status: 502 }
    );
  }

  return NextResponse.json({ success: true, travellineStatus: result.status });
}
