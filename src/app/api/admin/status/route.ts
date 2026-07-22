import { NextResponse } from "next/server";
import {
  isEmailConfigured,
  isResendSandboxMode,
  getBookingAdminEmail,
  getBookingFromEmail,
  getAuthFromEmail,
} from "@/lib/email/resend";
import { isTravelLineConfigured, isTravelLineSyncEnabled } from "@/lib/travelline/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { requireAdmin } from "@/lib/supabase/require-admin";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let lastSync: { completed_at: string | null; status: string | null; message: string | null } | null =
    null;
  let recentSyncLogs: Array<{
    completed_at: string | null;
    status: string | null;
    message: string | null;
    tickets_processed: number | null;
  }> = [];
  let outboundTickets = 0;
  let pendingCustomers = 0;

  if (isSupabaseConfigured()) {
    try {
      const supabase = createAdminClient();
      const [{ data: sync }, { data: syncHistory }, { count: tickets }, { count: customers }] =
        await Promise.all([
        supabase
          .from("sync_logs")
          .select("completed_at, status, message")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("sync_logs")
          .select("completed_at, status, message, tickets_processed")
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("tickets")
          .select("id", { count: "exact", head: true })
          .eq("active", true)
          .in("from_code", ["ISB", "LHE", "KHI", "PEW", "SKT", "MUX"]),
        supabase
          .from("customer_profiles")
          .select("id", { count: "exact", head: true })
          .eq("approval_status", "pending"),
      ]);
      lastSync = sync;
      recentSyncLogs = syncHistory || [];
      outboundTickets = tickets ?? 0;
      pendingCustomers = customers ?? 0;
    } catch {
      /* partial status ok */
    }
  }

  return NextResponse.json({
    supabase: isSupabaseConfigured(),
    travelline: isTravelLineConfigured(),
    travellineSync: isTravelLineSyncEnabled(),
    email: isEmailConfigured(),
    emailFrom: isEmailConfigured() ? getBookingFromEmail() : null,
    authFrom: isEmailConfigured() ? getAuthFromEmail() : null,
    emailAdmin: getBookingAdminEmail(),
    emailSandbox: isEmailConfigured() && isResendSandboxMode(),
    lastSync,
    recentSyncLogs,
    outboundTickets,
    pendingCustomers,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || null,
  });
}
