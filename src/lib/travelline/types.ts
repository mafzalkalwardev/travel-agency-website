import type { NormalizedTicket } from "@/lib/tickets/providers/types";

export interface TravelLineSession {
  cookies: { name: string; value: string; domain?: string; path?: string }[];
  token?: string;
  expiresAt?: string;
}

export interface TravelLineRawFlight {
  id?: string | number;
  flightId?: string | number;
  airline?: string;
  airlineName?: string;
  airlineCode?: string;
  flightNumber?: string;
  flightNo?: string;
  from?: string;
  fromCity?: string;
  origin?: string;
  originCity?: string;
  to?: string;
  toCity?: string;
  destination?: string;
  destinationCity?: string;
  departureDate?: string;
  date?: string;
  departureTime?: string;
  arrivalTime?: string;
  duration?: string;
  price?: number;
  fare?: number;
  seatsLeft?: number;
  availableSeats?: number;
  seats?: number;
  status?: string;
  baggage?: string;
  meal?: string;
  tripType?: string;
  isDirect?: boolean;
  sector?: string;
  imageUrl?: string;
  [key: string]: unknown;
}

export interface TravelLineRawPackage {
  id?: string | number;
  title?: string;
  name?: string;
  slug?: string;
  price?: number;
  fare?: number;
  duration?: string;
  departureCity?: string;
  airline?: string;
  seatsLeft?: number;
  highlights?: string[];
  image?: string;
  imageUrl?: string;
  category?: string;
  featured?: boolean;
  type?: string;
  [key: string]: unknown;
}

export interface TravelLineRawPromo {
  id?: string | number;
  title?: string;
  message?: string;
  image?: string;
  imageUrl?: string;
  link?: string;
  active?: boolean;
  [key: string]: unknown;
}

export interface TravelLineFetchResult {
  tickets: NormalizedTicket[];
  rawTickets: TravelLineRawFlight[];
}

export interface TravelLinePackageFetchResult {
  umrah: TravelLineRawPackage[];
  tours: TravelLineRawPackage[];
  promos: TravelLineRawPromo[];
}

export interface TravelLineBookingInput {
  externalProductId: string;
  productType: "ticket" | "umrah" | "tour";
  passengers: number;
  passengerDetails: Record<string, unknown>;
  quotedPrice: number;
  currency: string;
}

export interface TravelLineBookingResult {
  success: boolean;
  bookingRef?: string;
  raw?: unknown;
  error?: string;
}
