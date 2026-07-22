import type { Airline } from "@/types";

const codes = [
  "PK", "PA", "PF", "9P", "ER", "EK", "EY", "FZ", "G9", "QR", "SV", "XY", "F3",
  "WY", "OV", "KU", "J9", "GF", "TK", "PC", "BA", "VS", "CA", "CZ", "OD", "TG",
  "UL", "HY", "KC", "FS", "J2", "LH", "ET",
] as const;

export type AirlineCode = (typeof codes)[number];

const names: Record<AirlineCode, string> = {
  PK: "PIA",
  PA: "Airblue",
  PF: "Air Sial",
  "9P": "Fly Jinnah",
  ER: "Serene Air",
  EK: "Emirates",
  EY: "Etihad",
  FZ: "flydubai",
  G9: "Air Arabia",
  QR: "Qatar Airways",
  SV: "Saudia",
  XY: "Flynas",
  F3: "Flyadeal",
  WY: "Oman Air",
  OV: "SalamAir",
  KU: "Kuwait Airways",
  J9: "Jazeera Airways",
  GF: "Gulf Air",
  TK: "Turkish Airlines",
  PC: "Pegasus",
  BA: "British Airways",
  VS: "Virgin Atlantic",
  CA: "Air China",
  CZ: "China Southern",
  OD: "Batik Air",
  TG: "Thai Airways",
  UL: "SriLankan",
  HY: "Uzbekistan Airways",
  KC: "Air Astana",
  FS: "FlyArystan",
  J2: "AZAL",
  LH: "Lufthansa",
  ET: "Ethiopian",
};

/** Name aliases → canonical IATA (covers supplier spelling variants). */
const NAME_TO_CODE: Record<string, AirlineCode> = {
  pia: "PK",
  "pakistan international": "PK",
  "pakistan international airlines": "PK",
  airblue: "PA",
  "air blue": "PA",
  airsial: "PF",
  "air sial": "PF",
  "air-sial": "PF",
  "fly jinnah": "9P",
  flyjinnah: "9P",
  "serene air": "ER",
  serene: "ER",
  emirates: "EK",
  etihad: "EY",
  flydubai: "FZ",
  "fly dubai": "FZ",
  "air arabia": "G9",
  airarabia: "G9",
  "qatar airways": "QR",
  qatar: "QR",
  saudia: "SV",
  "saudi airlines": "SV",
  flynas: "XY",
  flyadeal: "F3",
  "oman air": "WY",
  salamair: "OV",
  "salam air": "OV",
  "kuwait airways": "KU",
  "jazeera airways": "J9",
  "gulf air": "GF",
  "turkish airlines": "TK",
  pegasus: "PC",
  "british airways": "BA",
  "virgin atlantic": "VS",
  "air china": "CA",
  "china southern": "CZ",
  "batik air": "OD",
  "thai airways": "TG",
  srilankan: "UL",
  "sri lankan": "UL",
  "uzbekistan airways": "HY",
  "air astana": "KC",
  flyarystan: "FS",
  azal: "J2",
  lufthansa: "LH",
  ethiopian: "ET",
};

const regions: Record<string, Airline["regions"]> = {
  PK: ["Domestic", "International"],
  PA: ["Domestic", "International"],
  PF: ["Domestic", "International"],
  "9P": ["Domestic", "International"],
  ER: ["Domestic"],
};

export function airlineLogoPath(code: string): string {
  return `/assets/airlines/${code.trim().toLowerCase()}.png`;
}

export function getAirlineByCode(code?: string | null): Airline | undefined {
  if (!code) return undefined;
  const normalized = code.trim().toUpperCase();
  return airlines.find((airline) => airline.code === normalized);
}

export function resolveAirlineCode(input?: {
  code?: string | null;
  name?: string | null;
  flightNumber?: string | null;
}): string {
  const fromFlight = input?.flightNumber?.match(/^([A-Z0-9]{2})/i)?.[1]?.toUpperCase();
  if (fromFlight && names[fromFlight as AirlineCode]) return fromFlight;

  const rawCode = input?.code?.trim().toUpperCase();
  if (rawCode && names[rawCode as AirlineCode]) return rawCode;

  const nameKey = (input?.name || "").trim().toLowerCase();
  if (nameKey && NAME_TO_CODE[nameKey]) return NAME_TO_CODE[nameKey];

  if (rawCode && /^[A-Z0-9]{2}$/.test(rawCode)) return rawCode;
  if (fromFlight) return fromFlight;
  return "XX";
}

/**
 * Prefer the canonical brand for a known IATA code so UI never shows a bare
 * code (or a stale supplier alias) when we know the live carrier.
 */
export function resolveAirlineName(code?: string | null, fallbackName?: string | null): string {
  const resolvedCode = resolveAirlineCode({ code, name: fallbackName });
  const known = names[resolvedCode as AirlineCode];
  if (known) return known;

  const fallback = (fallbackName || "").trim();
  if (fallback && fallback.toUpperCase() !== resolvedCode && fallback.toLowerCase() !== "unknown") {
    return fallback;
  }
  return resolvedCode === "XX" ? "Airline" : resolvedCode;
}

export const airlines: Airline[] = codes.map((code) => ({
  code,
  name: names[code],
  // PNG files are the downloaded carrier marks. The SVG files are only
  // letter-code fallbacks and should not be presented as official logos.
  logo: airlineLogoPath(code),
  regions: regions[code] ?? ["International"],
}));
