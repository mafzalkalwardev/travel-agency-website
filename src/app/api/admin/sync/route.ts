import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { requireAdmin } from "@/lib/supabase/require-admin";
import { TravelLineTicketProvider } from "@/lib/tickets/providers/travelLineProvider";
import { syncTravelLinePackages } from "@/lib/sync/sync-packages";
import { writeSyncLog } from "@/lib/sync/log-sync";
import { acquireSyncLock, releaseSyncLock } from "@/lib/sync/sync-lock";
import { TICKET_SYNC_LOCK_NAME } from "@/lib/sync/run-ticket-sync";
import { isTravelLineConfigured } from "@/lib/travelline/env";

export const dynamic = "force-dynamic";
export const maxDuration = 180;

export async function POST() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isTravelLineConfigured()) {
    return NextResponse.json({ error: "Supplier credentials not configured" }, { status: 400 });
  }

  // Shares the scheduled sync's lock so an admin-triggered "Sync Now"
  // can't run concurrently with a background sync — see docs/REDESIGN.md §7.
  const locksEnabled = isSupabaseConfigured();
  if (locksEnabled) {
    const acquired = await acquireSyncLock(TICKET_SYNC_LOCK_NAME);
    if (!acquired) {
      return NextResponse.json(
        { error: "A sync is already in progress. Try again shortly." },
        { status: 409 }
      );
    }
  }

  try {
    const ticketProvider = new TravelLineTicketProvider();
    const ticketResult = await ticketProvider.sync();

    // Packages are best-effort: ticket inventory must still succeed even if
    // the umrah scrape fails (common on Vercel without Playwright).
    let packageResult: Awaited<ReturnType<typeof syncTravelLinePackages>>;
    try {
      packageResult = await syncTravelLinePackages();
    } catch (e) {
      packageResult = {
        provider: "travelline",
        status: "failed",
        umrahProcessed: 0,
        toursProcessed: 0,
        promosProcessed: 0,
        changes: [],
        message: e instanceof Error ? e.message : "Package sync failed",
      };
    }

    const overallStatus =
      ticketResult.status === "failed"
        ? "failed"
        : packageResult.status === "failed"
          ? "partial"
          : ticketResult.status;

    if (isSupabaseConfigured()) {
      await writeSyncLog({
        provider: "supplier-manual",
        status: overallStatus,
        processed: ticketResult.ticketsProcessed,
        created: ticketResult.ticketsCreated,
        updated: ticketResult.ticketsUpdated,
        deactivated: ticketResult.ticketsDeactivated,
        message: `Manual sync: ${ticketResult.message}; ${packageResult.message}`,
        changes: [...(ticketResult.changes || []), ...(packageResult.changes || [])],
      });
    }

    return NextResponse.json({
      tickets: ticketResult,
      packages: packageResult,
      status: overallStatus,
    });
  } finally {
    if (locksEnabled) {
      await releaseSyncLock(TICKET_SYNC_LOCK_NAME);
    }
  }
}
