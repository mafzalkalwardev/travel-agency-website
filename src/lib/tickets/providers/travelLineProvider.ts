import { isTravelLineSyncEnabled } from "@/lib/travelline/env";
import { scrapeTravelLineTickets, scrapeTravelLineTicketsWithCategories } from "@/lib/travelline/scraper";
import { recordNewCategories } from "@/lib/travelline/category-discovery";
import { cleanupReturnLegTickets } from "@/lib/sync/cleanup-return-tickets";
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
      // Single login, reused for both the ticket fetch and the category
      // list (used for ticket imagery + new-category detection) — a
      // second independent login here previously pushed sync past
      // Vercel's function timeout.
      const { tickets, categories } = await scrapeTravelLineTicketsWithCategories();
      const { created, updated, deactivated, skipped, changes } = await upsertTickets(tickets, this.name);
      const cleanup = await cleanupReturnLegTickets();
      const cleanupNote =
        cleanup.deactivated > 0 ? `, ${cleanup.deactivated} wrong-direction cleaned` : "";

      // Non-blocking: a category-discovery failure should never fail the
      // primary ticket sync. See docs/REDESIGN.md §6.
      let categoryNote = "";
      try {
        const discovery = await recordNewCategories(categories);
        if (discovery.newCategories.length) {
          categoryNote = `, ${discovery.newCategories.length} new category(s) flagged for review`;
        }
      } catch {
        /* category discovery is best-effort */
      }

      return {
        provider: this.name,
        status: tickets.length ? "success" : "partial",
        ticketsProcessed: tickets.length,
        ticketsCreated: created,
        ticketsUpdated: updated,
        ticketsDeactivated: deactivated + cleanup.deactivated,
        changes,
        message: tickets.length
          ? `Synced ${tickets.length} real tickets from Travel Line scraper (${created} new, ${updated} changed, ${deactivated} sold out, ${skipped || 0} incomplete skipped${cleanupNote}${categoryNote})`
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
