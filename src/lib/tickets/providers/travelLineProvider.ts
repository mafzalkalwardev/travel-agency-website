import { isTravelLineSyncEnabled } from "@/lib/travelline/env";
import { scrapeTravelLineTickets } from "@/lib/travelline/scraper";
import { upsertTickets } from "@/lib/sync/upsert-inventory";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { NormalizedTicket, TicketProvider, TicketSyncResult } from "./types";

export class TravelLineTicketProvider implements TicketProvider {
  name = "travelline";

  async fetchTickets(): Promise<NormalizedTicket[]> {
    if (!isTravelLineSyncEnabled()) return [];
    return scrapeTravelLineTickets();
  }

  async sync(): Promise<TicketSyncResult> {
    if (!isTravelLineSyncEnabled()) {
      return {
        provider: this.name,
        status: "failed",
        ticketsProcessed: 0,
        ticketsCreated: 0,
        ticketsUpdated: 0,
        ticketsDeactivated: 0,
        message: "Supplier sync not enabled",
      };
    }

    if (!isSupabaseConfigured()) {
      const tickets = await this.fetchTickets();
      return {
        provider: this.name,
        status: tickets.length ? "partial" : "failed",
        ticketsProcessed: tickets.length,
        ticketsCreated: 0,
        ticketsUpdated: 0,
        ticketsDeactivated: 0,
        message: "Supabase not configured — fetched only",
      };
    }

    try {
      const tickets = await this.fetchTickets();
      const { created, updated, deactivated, skipped, changes } = await upsertTickets(tickets, this.name);
      return {
        provider: this.name,
        status: tickets.length ? "success" : "partial",
        ticketsProcessed: tickets.length,
        ticketsCreated: created,
        ticketsUpdated: updated,
        ticketsDeactivated: deactivated,
        changes,
        message: tickets.length
          ? `Synced ${tickets.length} real tickets from Travel Line scraper (${created} new, ${updated} changed, ${deactivated} sold out, ${skipped || 0} incomplete skipped)`
          : "No tickets returned from Travel Line scraper",
      };
    } catch (e) {
      return {
        provider: this.name,
        status: "failed",
        ticketsProcessed: 0,
        ticketsCreated: 0,
        ticketsUpdated: 0,
        ticketsDeactivated: 0,
        message: e instanceof Error ? e.message : "Sync failed",
      };
    }
  }
}
