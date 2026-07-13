import type { TravelLineGroupFlight, TravelLineUmrahApiItem } from "@/lib/travelline/mappers";

export interface TravelLineMirrorSnapshot {
  scrapedAt: string;
  baseUrl: string;
  sessionOk: boolean;
  umrahPackages: TravelLineUmrahApiItem[];
  groups: Record<string, TravelLineGroupFlight[]>;
  counts: {
    umrahPackages: number;
    byCategory: Record<string, number>;
    totalFlights: number;
  };
}

export interface MirrorExploreCard {
  slug: string;
  label: string;
  subtitle?: string;
  href: string;
  count: number;
  image: string;
}

export interface MirrorFlightView {
  id: string;
  category: string;
  airlineName: string;
  airlineCode: string;
  airlineLogo?: string;
  routeLabel: string;
  sectorCodes: string;
  fromCity: string;
  toCity: string;
  fromCode: string;
  toCode: string;
  departureTime: string;
  departureDate: string;
  departureDateLabel: string;
  arrivalTime: string;
  arrivalDateLabel: string;
  duration: string;
  stopsLabel: string;
  price: number;
  currency: string;
  baggage?: string;
  meal?: string;
  seats: number;
  segments: number;
}
