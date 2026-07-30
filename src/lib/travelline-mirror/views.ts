import type { TravelLineGroupFlight, TravelLineUmrahApiItem } from "@/lib/travelline/mappers";
import { EXPLORE_CATEGORIES } from "@/lib/travelline/categories";
import type { MirrorExploreCard, MirrorFlightView, TravelLineMirrorSnapshot } from "./types";

const MIRROR_IMAGES: Record<string, string> = {
  umrah: "/assets/destinations/umrah-makkah.jpg",
  umrahGroups: "/assets/destinations/umrah-makkah.jpg",
  uae: "/assets/destinations/uae-dubai.jpg",
  oman: "/assets/destinations/oman-muscat.jpg",
  ksa: "/assets/destinations/ksa-jeddah.jpg",
  bahrain: "/assets/destinations/bahrain.jpg",
};

function formatDateTime(datetime?: string): { time: string; label: string } {
  if (!datetime) return { time: "—", label: "—" };
  const d = new Date(datetime);
  if (Number.isNaN(d.getTime())) return { time: "—", label: datetime };
  return {
    time: d.toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Karachi" }),
    label: d.toLocaleDateString("en-PK", {
      weekday: "short",
      day: "numeric",
      month: "short",
      timeZone: "Asia/Karachi",
    }),
  };
}

function stopsLabel(segments: number): string {
  if (segments <= 1) return "Direct";
  if (segments === 2) return "1 Stop";
  return `${segments - 1} Stops`;
}

export function flightToView(flight: TravelLineGroupFlight, category: string): MirrorFlightView | null {
  const itinerary = flight.itineraries?.[0];
  const segments = itinerary?.segments || [];
  if (!segments.length) return null;

  const first = segments[0];
  const last = segments[segments.length - 1];
  const dep = first.departure;
  const arr = last.arrival;
  const fromCode = dep?.airport?.iataCode || "";
  const toCode = arr?.airport?.iataCode || "";
  const fromCity = dep?.airport?.city || fromCode;
  const toCity = arr?.airport?.city || toCode;

  const depFmt = formatDateTime(dep?.datetime);
  const arrFmt = formatDateTime(arr?.datetime);

  const codes = segments.map((s) => s.departure?.airport?.iataCode).filter(Boolean);
  if (last.arrival?.airport?.iataCode) codes.push(last.arrival.airport.iataCode);
  const sectorCodes = [...new Set(codes)].join("-");

  return {
    id: flight._id,
    category,
    airlineName: first.airline?.carrierName || "Airline",
    airlineCode: first.airline?.carrierCode || "XX",
    airlineLogo: first.airline?.logo,
    routeLabel: `${fromCity} to ${toCity}`,
    sectorCodes,
    fromCity,
    toCity,
    fromCode,
    toCode,
    departureTime: depFmt.time,
    departureDate: dep?.datetime?.slice(0, 10) || "",
    departureDateLabel: depFmt.label,
    arrivalTime: arrFmt.time,
    arrivalDateLabel: arrFmt.label,
    duration: itinerary?.duration || "",
    stopsLabel: stopsLabel(segments.length),
    price: flight.fares?.salePrice ?? 0,
    currency: (flight.fares as { currencyCode?: string; currency?: string })?.currencyCode
      || flight.fares?.currency
      || "RS",
    baggage: (flight.fares as { baggage?: { maxWeight?: string } })?.baggage?.maxWeight,
    meal: (first as { meal?: string }).meal || (segments.some((s) => (s as { meal?: string }).meal === "Yes") ? "Yes" : "No"),
    seats: flight.availableSeats ?? 0,
    segments: segments.length,
  };
}

export function getCategoryFlights(snapshot: TravelLineMirrorSnapshot, apiCategory: string): MirrorFlightView[] {
  const raw = snapshot.groups[apiCategory] || [];
  return raw
    .map((f) => flightToView(f, apiCategory))
    .filter((f): f is MirrorFlightView => Boolean(f))
    .sort((a, b) => a.departureDate.localeCompare(b.departureDate) || a.departureTime.localeCompare(b.departureTime));
}

export function getExploreCards(snapshot: TravelLineMirrorSnapshot): MirrorExploreCard[] {
  return EXPLORE_CATEGORIES.map((cat) => {
    const count =
      cat.kind === "umrah-packages"
        ? snapshot.counts.umrahPackages
        : snapshot.counts.byCategory[cat.apiCategory || ""] || 0;

    return {
      slug: cat.slug,
      label: cat.label,
      subtitle: cat.subtitle,
      href: cat.kind === "umrah-packages" ? "/tl-mirror/umrah-packages/" : `/tl-mirror/groups/${cat.slug}/`,
      count,
      image: MIRROR_IMAGES[cat.imageKey],
    };
  });
}

export function getAirlineFilters(flights: MirrorFlightView[]): string[] {
  return [...new Set(flights.map((f) => f.airlineName))].sort();
}

export function getSectorFilters(flights: MirrorFlightView[]): string[] {
  return [...new Set(flights.map((f) => `${f.fromCity} - ${f.toCity}${f.stopsLabel === "Direct" ? "" : " (via)"}`))].sort();
}

export function filterFlights(
  flights: MirrorFlightView[],
  opts: { airlines?: string[]; sectors?: string[] }
): MirrorFlightView[] {
  return flights.filter((f) => {
    if (opts.airlines?.length && !opts.airlines.includes(f.airlineName)) return false;
    if (opts.sectors?.length) {
      const sector = `${f.fromCity} - ${f.toCity}${f.stopsLabel === "Direct" ? "" : " (via)"}`;
      if (!opts.sectors.includes(sector)) return false;
    }
    return true;
  });
}

export function getUmrahPackages(snapshot: TravelLineMirrorSnapshot): TravelLineUmrahApiItem[] {
  return [...snapshot.umrahPackages].sort(
    (a, b) => (a.departureDate || "").localeCompare(b.departureDate || "") || a.price - b.price
  );
}
