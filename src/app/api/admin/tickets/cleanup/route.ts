import { NextResponse } from "next/server";
import { cleanupReturnLegTickets } from "@/lib/sync/cleanup-return-tickets";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { requireAdmin } from "@/lib/supabase/require-admin";

export async function POST() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  try {
    const result = await cleanupReturnLegTickets();
    return NextResponse.json({
      success: true,
      message:
        result.deactivated > 0
          ? `Deactivated ${result.deactivated} return-leg or invalid-direction tickets`
          : "No return-leg tickets to clean up",
      ...result,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Cleanup failed" },
      { status: 500 }
    );
  }
}
