import type { NormalizedTicket } from "@/lib/tickets/providers/types";
import type { TravelLineRawFlight, TravelLineRawPackage, TravelLineRawPromo } from "./types";
import type { TicketStatus } from "@/types";
import { resolveAirport, isOutboundGroupTicket } from "@/lib/airport-codes";
import { FALLBACK_IMAGES, normalizeImageUrl } from "@/lib/image-utils";

/** Live response shape from GET /api/umrah-packages */
export interface TravelLineUmrahApiItem {
  _id?: string;
  id: string;
  slug: string;
  title: string;
  shortDescription?: string;
  longDescription?: string;
  images?: string[];
  price: number;
  currency: string;
  durationDays?: number;
  durationNights?: number;
  fromCity?: string;
  toCity?: string;
  airline?: string;
  airlineLogo?: string;
  departureDate?: string;
  returnDate?: string;
  departureFlightNo?: string;
  departureSectorFrom?: string;
  departureSectorTo?: string;
  departureTime?: string;
  departureArrivalTime?: string;
  returnFlightNo?: string;
  returnSectorFrom?: string;
  returnSectorTo?: string;
  returnDepartureTime?: string;
  returnArrivalTime?: string;
  makkahNights?: number;
  madinahNights?: number;
  seatsTotal?: number;
  seatsAvailable?: number;
  status?: string;
  hotel?: {
    name?: string;
    city?: string;
    rating?: number;
    makkahName?: string;
    makkahDistance?: string;
    madinahName?: string;
  };
  inclusions?: string[];
  ziyaraa?: boolean;
  [key: string]: unknown;
}

function applyMarkup(price: number, markupPercent: number): number {
  if (!markupPercent) return price;
  return Math.round(price * (1 + markupPercent / 100));
}

function mapStatus(seats: number, status?: string): TicketStatus {
  if (status === "sold_out" || status === "soldOut" || seats <= 0) return "sold_out";
  if (status === "limited" || seats <= 5) return "limited";
  return "available";
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function airlineToCode(airline?: string, flightNo?: string): string {
  if (flightNo) {
    const m = flightNo.match(/^([A-Z0-9]{2})/i);
    if (m) return m[1].toUpperCase();
  }
  const map: Record<string, string> = {
    "fly jinnah": "9P",
    pia: "PK",
    saudia: "SV",
    emirates: "EK",
    airblue: "PA",
    airsial: "PF",
    "qatar airways": "QR",
  };
  return map[(airline || "").toLowerCase()] || "XX";
}

export function mapFlightToTicket(
  raw: TravelLineRawFlight,
  markupPercent = 0
): NormalizedTicket {
  const id = String(raw.id ?? raw.flightId ?? "");
  const fromResolved = resolveAirport(String(raw.from ?? raw.origin ?? raw.fromCity ?? ""));
  const toResolved = resolveAirport(String(raw.to ?? raw.destination ?? raw.toCity ?? ""));
  const fromCode = fromResolved.code;
  const toCode = toResolved.code;
  const fromCity = String(raw.fromCity ?? raw.originCity ?? fromResolved.city);
  const toCity = String(raw.toCity ?? raw.destinationCity ?? toResolved.city);
  const seats = Number(raw.seatsLeft ?? raw.availableSeats ?? raw.seats ?? 0);
  const price = applyMarkup(Number(raw.price ?? raw.fare ?? 0), markupPercent);

  return {
    externalId: id || `${fromCode}-${toCode}-${raw.departureDate ?? raw.date}`,
    airline: String(raw.airlineName ?? raw.airline ?? "Unknown"),
    airlineCode: String(raw.airlineCode ?? (fromCode.slice(0, 2) || "XX")),
    flightNumber: String(raw.flightNumber ?? raw.flightNo ?? ""),
    from: fromCode,
    fromCity,
    to: toCode,
    toCity,
    sector: String(raw.sector ?? `${fromCode}-${toCode}`),
    destination: toCity,
    date: String(raw.departureDate ?? raw.date ?? "").slice(0, 10),
    departureTime: String(raw.departureTime ?? ""),
    arrivalTime: String(raw.arrivalTime ?? ""),
    duration: String(raw.duration ?? ""),
    price,
    currency: "PKR",
    seatsLeft: seats,
    status: mapStatus(seats, raw.status),
    baggage: raw.baggage as string | undefined,
    meal: raw.meal as string | undefined,
    tripType: (raw.tripType as NormalizedTicket["tripType"]) || "oneway",
    isDirect: raw.isDirect !== false,
  };
}

export function mapFlights(
  items: TravelLineRawFlight[],
  markupPercent = 0
): NormalizedTicket[] {
  return items
    .map((item) => mapFlightToTicket(item, markupPercent))
    .filter((t) => t.externalId && t.date);
}

/** Outbound group flight tickets from supplier package API (PK → KSA/UAE, not return legs). */
export function ticketsFromUmrahApiItems(
  items: TravelLineUmrahApiItem[],
  markupPercent = 0
): NormalizedTicket[] {
  const tickets: NormalizedTicket[] = [];

  for (const item of items) {
    if (!item.departureFlightNo || !item.departureDate) continue;

    const seats = Number(item.seatsAvailable ?? 0);
    const halfPrice = applyMarkup(Math.round(item.price / 2), markupPercent);
    const airline = item.airline || "Unknown";
    const code = airlineToCode(airline, item.departureFlightNo);
    const fromResolved = resolveAirport(item.departureSectorFrom || item.fromCity);
    const toResolved = resolveAirport(item.departureSectorTo || item.toCity);

    tickets.push(
      mapFlightToTicket(
        {
          id: `${item.id}-out`,
          airlineName: airline,
          airlineCode: code,
          flightNumber: item.departureFlightNo,
          from: fromResolved.code,
          fromCity: fromResolved.city,
          to: toResolved.code,
          toCity: toResolved.city,
          departureDate: item.departureDate,
          departureTime: item.departureTime,
          arrivalTime: item.departureArrivalTime,
          price: halfPrice,
          seatsLeft: seats,
          status: item.status,
          tripType: "umrah",
          sector: `${fromResolved.code}-${toResolved.code}`,
        },
        0
      )
    );
  }

  return tickets
    .filter((t) => t.externalId && t.date && isOutboundGroupTicket(t.from, t.to))
    .sort((a, b) => b.date.localeCompare(a.date) || a.departureTime.localeCompare(b.departureTime));
}

export interface TravelLineGroupFlight {
  _id: string;
  availableSeats?: number;
  groupCategory?: string;
  fares?: { salePrice?: number; currency?: string };
  itineraries?: Array<{
    duration?: string;
    segments?: Array<{
      flightNumber?: string;
      departure?: {
        iataCode?: string;
        at?: string;
        datetime?: string;
        airport?: { iataCode?: string; city?: string };
      };
      arrival?: {
        iataCode?: string;
        at?: string;
        datetime?: string;
        airport?: { iataCode?: string; city?: string };
      };
      duration?: string;
      airline?: { carrierCode?: string; carrierName?: string };
    }>;
  }>;
}

function segmentAirport(point?: {
  iataCode?: string;
  at?: string;
  datetime?: string;
  airport?: { iataCode?: string; city?: string };
}): { code: string; city: string; datetime: string } {
  const airport = point?.airport;
  const code = String(airport?.iataCode || point?.iataCode || "").toUpperCase();
  const city = String(airport?.city || resolveAirport(code).city || code);
  const datetime = String(point?.datetime || point?.at || "");
  return { code, city, datetime };
}

export function ticketsFromGroupFlights(
  flights: TravelLineGroupFlight[],
  markupPercent = 0
): NormalizedTicket[] {
  const tickets: NormalizedTicket[] = [];

  for (const group of flights) {
    const segment = group.itineraries?.[0]?.segments?.[0];
    if (!segment) continue;

    const dep = segmentAirport(segment.departure);
    const arr = segmentAirport(segment.arrival);
    if (!dep.code || !arr.code) continue;

    const seats = Number(group.availableSeats ?? 0);
    const airline = segment.airline?.carrierName || "Unknown";
    const flightNumber = (segment.flightNumber || "").replace(/\s+/g, " ").trim();
    const price = applyMarkup(Number(group.fares?.salePrice ?? 0), markupPercent);

    tickets.push(
      mapFlightToTicket(
        {
          id: group._id,
          airlineName: airline,
          airlineCode: segment.airline?.carrierCode || airlineToCode(airline, flightNumber),
          flightNumber,
          from: dep.code,
          fromCity: dep.city,
          to: arr.code,
          toCity: arr.city,
          departureDate: dep.datetime.slice(0, 10),
          departureTime: dep.datetime.slice(11, 16),
          arrivalTime: arr.datetime.slice(11, 16),
          duration: group.itineraries?.[0]?.duration || segment.duration || "",
          price,
          seatsLeft: seats,
          tripType: "group",
          sector: `${dep.code}-${arr.code}`,
        },
        0
      )
    );
  }

  return tickets
    .filter((t) => t.externalId && t.date)
    .sort((a, b) => b.date.localeCompare(a.date) || a.departureTime.localeCompare(b.departureTime));
}

export function mapTravelLineUmrahApiItem(item: TravelLineUmrahApiItem, markupPercent = 0) {
  const image = normalizeImageUrl(item.images?.[0], FALLBACK_IMAGES.umrah);

  const highlights: string[] = [];
  if (item.hotel?.makkahName) highlights.push(`Makkah: ${item.hotel.makkahName}`);
  if (item.hotel?.madinahName) highlights.push(`Madinah: ${item.hotel.madinahName}`);
  if (item.inclusions?.length) highlights.push(...item.inclusions.slice(0, 3));

  return {
    external_id: item.id,
    source_provider: "travelline",
    title: item.title,
    slug: item.slug || slugify(item.title),
    package_code: item.id,
    category: "standard",
    price: applyMarkup(item.price, markupPercent),
    currency: item.currency || "PKR",
    duration: item.durationDays ? `${item.durationDays} Days` : "15 Days",
    departure_city: item.fromCity,
    airline: item.airline,
    hotel_makkah: item.hotel?.makkahName || item.hotel?.name,
    hotel_madinah: item.hotel?.madinahName,
    distance_from_haram: item.hotel?.makkahDistance,
    transport: true,
    visa: false,
    ziyarat: Boolean(item.ziyaraa),
    seats_left: item.seatsAvailable ?? null,
    highlights,
    image_url: image,
    featured: (item.seatsAvailable ?? 0) > 10,
    status: item.status === "active" ? "active" : "sold_out",
    raw_payload: item,
  };
}

export function mapUmrahPackage(raw: TravelLineRawPackage, markupPercent = 0) {
  const title = String(raw.title ?? raw.name ?? "Umrah Package");
  const id = String(raw.id ?? slugify(title));
  return {
    external_id: id,
    source_provider: "travelline",
    title,
    slug: String(raw.slug ?? slugify(title)),
    package_code: String(raw.id ?? ""),
    category: String(raw.category ?? "standard"),
    price: applyMarkup(Number(raw.price ?? raw.fare ?? 0), markupPercent),
    currency: "PKR",
    duration: String(raw.duration ?? "15 Days"),
    departure_city: raw.departureCity as string | undefined,
    airline: raw.airline as string | undefined,
    seats_left: Number(raw.seatsLeft ?? 0) || null,
    highlights: (raw.highlights as string[]) || [],
    image_url: normalizeImageUrl(raw.imageUrl ?? raw.image, FALLBACK_IMAGES.umrah),
    featured: Boolean(raw.featured),
    status: "active",
    raw_payload: raw,
  };
}

export function mapTourPackage(raw: TravelLineRawPackage, markupPercent = 0) {
  const title = String(raw.title ?? raw.name ?? "Tour Package");
  const id = String(raw.id ?? slugify(title));
  return {
    external_id: id,
    source_provider: "travelline",
    title,
    slug: String(raw.slug ?? slugify(title)),
    destination: String(raw.destination ?? raw.departureCity ?? ""),
    price: applyMarkup(Number(raw.price ?? raw.fare ?? 0), markupPercent),
    currency: "PKR",
    duration: String(raw.duration ?? "7 Days"),
    highlights: (raw.highlights as string[]) || [],
    image_url: normalizeImageUrl(raw.imageUrl ?? raw.image, FALLBACK_IMAGES.tour),
    featured: Boolean(raw.featured),
    status: "active",
    raw_payload: raw,
  };
}

export function mapPromoToFlyer(raw: TravelLineRawPromo, index: number) {
  return {
    title: String(raw.title ?? raw.message ?? `Offer ${index + 1}`),
    category: "umrah",
    image_url: normalizeImageUrl(raw.imageUrl ?? raw.image, FALLBACK_IMAGES.flyer),
    link: raw.link as string | undefined,
    display_order: index,
    active: raw.active !== false,
    source_external_id: String(raw.id ?? index),
  };
}

export function mapPromoToAnnouncement(raw: TravelLineRawPromo, index: number) {
  return {
    message: String(raw.message ?? raw.title ?? ""),
    priority: index + 1,
    active: raw.active !== false,
    source_external_id: String(raw.id ?? index),
  };
}

export function announcementsFromUmrahItems(items: TravelLineUmrahApiItem[]) {
  const active = items.filter((i) => i.status === "active").length;
  return [
    {
      message: `Umrah & group flights — ${active} packages live from Al Qibla`,
      priority: 1,
      active: true,
      source_external_id: "tl-live-count",
    },
  ];
}
