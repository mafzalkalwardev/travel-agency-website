export type TicketStatus = "available" | "limited" | "sold_out" | "booked" | "cancelled";

export interface NormalizedTicket {
  externalId: string;
  airline: string;
  airlineCode: string;
  flightNumber: string;
  from: string;
  fromCity: string;
  to: string;
  toCity: string;
  sector: string;
  destination: string;
  date: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  price: number;
  currency: string;
  seatsLeft: number;
  status: TicketStatus;
  baggage?: string;
  meal?: string;
  tripType?: string;
  isDirect?: boolean;
  groupCategory?: string;
  aircraft?: string;
  refundable?: string;
  changeFeeApplicable?: string;
  groupPnr?: string;
  supplierUpdatedAt?: string;
  segments?: TicketSegment[];
  /**
   * TravelLine has no per-ticket image — this falls back to the
   * category's own imageUrl from GET /api/categories (see
   * docs/REDESIGN.md §3.6/§3.2).
   */
  imageUrl?: string;
}

export interface TicketSegment {
  flightNumber: string;
  airline: string;
  airlineCode: string;
  departureAirport: string;
  departureCode: string;
  departureCity: string;
  departureCountry?: string;
  departureTerminal?: string;
  departureDatetime: string;
  arrivalAirport: string;
  arrivalCode: string;
  arrivalCity: string;
  arrivalCountry?: string;
  arrivalTerminal?: string;
  arrivalDatetime: string;
  aircraft?: string;
  meal?: string;
  status?: string;
}

export interface TicketSyncResult {
  provider: string;
  status: "success" | "partial" | "failed";
  ticketsProcessed: number;
  ticketsCreated: number;
  ticketsUpdated: number;
  ticketsDeactivated: number;
  changes?: SyncChange[];
  message?: string;
}

export interface SyncChange {
  provider: string;
  entityType: "ticket" | "umrah_package" | "tour_package" | "promo";
  entityId?: string;
  externalId?: string;
  changeType: "created" | "updated" | "deactivated";
  fieldChanges?: Record<string, { old: unknown; new: unknown }>;
  oldValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
}

export interface TicketProvider {
  name: string;
  fetchTickets(): Promise<NormalizedTicket[]>;
  sync(): Promise<TicketSyncResult>;
}
