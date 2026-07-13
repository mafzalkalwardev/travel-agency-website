import { TRAVELLINE_GROUP_CATEGORIES } from "./categories";
import type { TravelLineUmrahApiItem } from "./mappers";
import type { TravelLineGroupFlight } from "./mappers";

export { TRAVELLINE_GROUP_CATEGORIES };

function normFlight(no?: string): string {
  return (no || "").replace(/\s+/g, "").toUpperCase();
}

function segmentCode(point?: { iataCode?: string; airport?: { iataCode?: string } }): string {
  return (point?.iataCode || point?.airport?.iataCode || "").toUpperCase();
}

function segmentDate(point?: { datetime?: string; at?: string }): string {
  const raw = point?.datetime || point?.at || "";
  return raw.slice(0, 10);
}

export function matchGroupFlightToPackage(
  flights: TravelLineGroupFlight[],
  pkg: Pick<
    TravelLineUmrahApiItem,
    "departureFlightNo" | "departureSectorFrom" | "departureSectorTo" | "departureDate"
  >
): TravelLineGroupFlight | undefined {
  const pkgDate = pkg.departureDate?.slice(0, 10);
  const pkgFrom = (pkg.departureSectorFrom || "").toUpperCase();
  const pkgTo = (pkg.departureSectorTo || "").toUpperCase();
  const pkgFlight = normFlight(pkg.departureFlightNo);

  const withSeats = flights.filter((f) => (f.availableSeats ?? 0) > 0);

  if (pkgFrom && pkgTo) {
    const sectorMatch = withSeats.find((flight) => {
      const seg = flight.itineraries?.[0]?.segments?.[0];
      if (!seg) return false;
      const from = segmentCode(seg.departure);
      const to = segmentCode(seg.arrival);
      const date = segmentDate(seg.departure);
      return from === pkgFrom && to === pkgTo && (!pkgDate || date === pkgDate);
    });
    if (sectorMatch) return sectorMatch;
  }

  if (pkgFlight) {
    return withSeats.find(
      (flight) =>
        normFlight(flight.itineraries?.[0]?.segments?.[0]?.flightNumber) === pkgFlight
    );
  }

  return undefined;
}
