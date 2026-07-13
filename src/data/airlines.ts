import type { Airline } from "@/types";

const codes = [
  "PK", "PA", "PF", "9P", "ER", "EK", "EY", "FZ", "G9", "QR", "SV", "XY", "F3",
  "WY", "OV", "KU", "J9", "GF", "TK", "PC", "BA", "VS", "CA", "CZ", "OD", "TG",
  "UL", "HY", "KC", "FS", "J2", "LH", "ET",
] as const;

const names: Record<(typeof codes)[number], string> = {
  PK: "PIA",
  PA: "Airblue",
  PF: "AirSial",
  "9P": "Fly Jinnah",
  ER: "Serene Air",
  EK: "Emirates",
  EY: "Etihad",
  FZ: "Flydubai",
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

const regions: Record<string, Airline["regions"]> = {
  PK: ["Domestic", "International"],
  PA: ["Domestic", "International"],
  PF: ["Domestic", "International"],
  "9P": ["Domestic", "International"],
  ER: ["Domestic"],
};

export const airlines: Airline[] = codes.map((code) => ({
  code,
  name: names[code],
  // PNG files are the downloaded carrier marks. The SVG files are only
  // letter-code fallbacks and should not be presented as official logos.
  logo: `/assets/airlines/${code.toLowerCase()}.png`,
  regions: regions[code] ?? ["International"],
}));
