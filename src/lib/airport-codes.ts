const AIRPORT_CITIES: Record<string, string> = {
  ISB: "Islamabad",
  LHE: "Lahore",
  KHI: "Karachi",
  PEW: "Peshawar",
  SKT: "Sialkot",
  MUX: "Multan",
  JED: "Jeddah",
  MED: "Madinah",
  RUH: "Riyadh",
  DXB: "Dubai",
  AUH: "Abu Dhabi",
  SHJ: "Sharjah",
  DOH: "Doha",
  BAH: "Bahrain",
  MCT: "Muscat",
  IST: "Istanbul",
  KBL: "Kabul",
  LHR: "London",
  ADD: "Addis Ababa",
};

const CITY_TO_CODE: Record<string, string> = Object.fromEntries(
  Object.entries(AIRPORT_CITIES).map(([code, city]) => [city.toLowerCase(), code])
);

/** Pakistan departure airports for group/Umrah outbound inventory */
export const PK_AIRPORT_CODES = new Set(["ISB", "LHE", "KHI", "PEW", "SKT", "MUX"]);

const GULF_AIRPORT_CODES = new Set(["JED", "MED", "RUH", "DXB", "AUH", "SHJ", "DOH", "BAH", "MCT"]);

/** Group inventory should be PK → destination, not return legs */
export function isOutboundGroupTicket(fromCode: string, toCode: string): boolean {
  const from = fromCode.toUpperCase();
  const to = toCode.toUpperCase();
  if (!PK_AIRPORT_CODES.has(from)) return false;
  if (GULF_AIRPORT_CODES.has(to)) return true;
  return ["IST", "LHR", "ADD", "KBL"].includes(to);
}

export function isReturnLegExternalId(externalId?: string | null): boolean {
  return Boolean(externalId && /-(ret)$/i.test(externalId));
}

export function isIataCode(value: string): boolean {
  return /^[A-Z]{3}$/i.test(value.trim());
}

export function resolveAirport(value?: string | null): { code: string; city: string } {
  const raw = String(value || "").trim();
  if (!raw) return { code: "", city: "" };

  if (isIataCode(raw)) {
    const code = raw.toUpperCase();
    return { code, city: AIRPORT_CITIES[code] || code };
  }

  const code = CITY_TO_CODE[raw.toLowerCase()];
  if (code) return { code, city: AIRPORT_CITIES[code] || raw };

  return { code: raw.toUpperCase().slice(0, 3), city: raw };
}

export function cityMatchesFilter(
  code: string,
  city: string,
  filterValue: string
): boolean {
  const filter = filterValue.trim();
  if (!filter || filter === "all") return true;

  const normalizedFilter = filter.toLowerCase();
  if (code.toLowerCase() === normalizedFilter) return true;
  if (city.toLowerCase() === normalizedFilter) return true;
  if (city.toLowerCase().includes(normalizedFilter)) return true;

  const filterCode = CITY_TO_CODE[normalizedFilter];
  if (filterCode && code.toUpperCase() === filterCode) return true;

  return false;
}

export function formatRouteLabel(fromCode: string, fromCity: string, toCode: string, toCity: string): string {
  const from = fromCity && fromCity !== fromCode ? `${fromCity} (${fromCode})` : fromCode;
  const to = toCity && toCity !== toCode ? `${toCity} (${toCode})` : toCode;
  return `${from} → ${to}`;
}

/** Cities shown in search dropdowns — PK origins first, then destinations */
export const SEARCH_CITIES = [
  "Islamabad",
  "Lahore",
  "Karachi",
  "Peshawar",
  "Sialkot",
  "Multan",
  "Jeddah",
  "Madinah",
  "Riyadh",
  "Dubai",
  "Abu Dhabi",
  "Sharjah",
  "Doha",
  "Istanbul",
] as const;
