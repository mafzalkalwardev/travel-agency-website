/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Download airline logos by IATA code.
 *
 * Default source: pics.avs.io (travel industry CDN).
 * Some IATA codes are reused/reassigned historically — that CDN still returns
 * obsolete brands (e.g. PF → Primera Air, 9P → Air Arabia). Curated overrides
 * below keep our local PNGs aligned with the live carriers we sell.
 *
 * Run: node scripts/download-airline-logos.js
 */
const fs = require("fs");
const path = require("path");

const CODES = [
  "PK", "PA", "PF", "9P", "ER", "EK", "EY", "FZ", "G9", "QR", "SV", "XY", "F3",
  "WY", "OV", "KU", "J9", "GF", "TK", "PC", "BA", "VS", "CA", "CZ", "OD", "TG",
  "UL", "HY", "KC", "FS", "J2", "LH", "ET",
];

/** Official / vendor logos for codes where pics.avs.io is wrong or stale. */
const CURATED_OVERRIDES = {
  // PF was Primera Air Nordic; Air Sial now operates under PF.
  PF: "https://storage.googleapis.com/sub-agents-logo/airline-logos/pf.png",
  // 9P is Fly Jinnah (Air Arabia sister brand); CDN often returns Air Arabia mark.
  "9P": "https://storage.googleapis.com/sub-agents-logo/airline-logos/9p.png",
  // Keep flydubai mark consistent with inventory partner CDN.
  FZ: "https://storage.googleapis.com/sub-agents-logo/airline-logos/fz.png",
};

const EXPECTED_CARRIERS = {
  PF: "Air Sial",
  "9P": "Fly Jinnah",
  FZ: "flydubai",
  G9: "Air Arabia",
  PA: "Airblue",
};

const OUT = path.join(__dirname, "..", "public", "assets", "airlines");
const SIZE = 200;

function logoUrl(code) {
  if (CURATED_OVERRIDES[code]) return CURATED_OVERRIDES[code];
  return `https://pics.avs.io/${SIZE}/${SIZE}/${code}.png`;
}

async function download(code) {
  const url = logoUrl(code);
  const dest = path.join(OUT, `${code.toLowerCase()}.png`);
  const res = await fetch(url, { headers: { "User-Agent": "AlQiblaAirServices/1.0" } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 800) throw new Error(`File too small (${buf.length}b)`);
  fs.writeFileSync(dest, buf);
  return { bytes: buf.length, source: CURATED_OVERRIDES[code] ? "curated" : "pics.avs.io" };
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  let ok = 0;
  let fail = 0;
  console.log("Known reassigned IATA codes (always use curated URLs):");
  for (const [code, name] of Object.entries(EXPECTED_CARRIERS)) {
    console.log(`  ${code} → ${name}${CURATED_OVERRIDES[code] ? " [override]" : ""}`);
  }
  console.log("");
  for (const code of CODES) {
    try {
      const { bytes, source } = await download(code);
      console.log(`✓ ${code} → ${code.toLowerCase()}.png (${Math.round(bytes / 1024)} KB, ${source})`);
      ok++;
    } catch (e) {
      console.error(`✗ ${code}: ${e.message}`);
      fail++;
    }
  }
  console.log(`\nDone: ${ok}/${CODES.length} logos saved to public/assets/airlines/`);
  if (fail) process.exit(1);
}

main();
