import { isSupabaseConfigured } from "@/lib/supabase/env";
import { writeSyncLog } from "@/lib/sync/log-sync";
import { acquireSyncLock, releaseSyncLock } from "@/lib/sync/sync-lock";
import { ManualTicketProvider } from "@/lib/tickets/providers/manualProvider";
import { TravelLineTicketProvider } from "@/lib/tickets/providers/travelLineProvider";
import { isTravelLineSyncEnabled } from "@/lib/travelline/env";
import type { TicketSyncResult } from "@/lib/tickets/providers/types";

export const TICKET_SYNC_LOCK_NAME = "travelline-tickets";

export type TicketSyncOutcome =
  | { skipped: true; reason: string }
  | { skipped: false; result: TicketSyncResult };

/**
 * Single entry point for a ticket sync run, shared by every trigger
 * (Vercel cron route, the GitHub Actions 1-minute scheduler, and the
 * admin "Sync Now" button) so lock/log behavior can't drift between them.
 * See docs/REDESIGN.md §7 — sync duration is close to the 1-minute
 * cadence, so the overlap lock matters here specifically.
 */
export async function runTicketSync(): Promise<TicketSyncOutcome> {
  const locksEnabled = isSupabaseConfigured();

  if (locksEnabled) {
    const acquired = await acquireSyncLock(TICKET_SYNC_LOCK_NAME);
    if (!acquired) {
      return { skipped: true, reason: "A sync is already in progress — skipping this run to avoid overlap." };
    }
  }

  try {
    const provider = isTravelLineSyncEnabled() ? new TravelLineTicketProvider() : new ManualTicketProvider();
    const result = await provider.sync();

    if (isSupabaseConfigured()) {
      await writeSyncLog({
        provider: result.provider,
        status: result.status,
        processed: result.ticketsProcessed,
        created: result.ticketsCreated,
        updated: result.ticketsUpdated,
        deactivated: result.ticketsDeactivated,
        message: result.message,
        changes: result.changes,
      });
    }

    return { skipped: false, result };
  } finally {
    if (locksEnabled) {
      await releaseSyncLock(TICKET_SYNC_LOCK_NAME);
    }
  }
}
