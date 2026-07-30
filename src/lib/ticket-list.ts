import type { Ticket } from "@/types";

/**
 * Strip heavy detail fields from tickets before shipping them to list clients.
 * Segment payloads can dominate RSC JSON for large inventories.
 */
export function toTicketListItems(tickets: Ticket[]): Ticket[] {
  return tickets.map((ticket) => ({
    ...ticket,
    segments: undefined,
    supplierUpdatedAt: undefined,
    imageUrl: undefined,
  }));
}
