# Airline Logos — Al Qibla Air Services

Real airline logos are stored locally at:

```
public/assets/airlines/{iata-code}.png
```

Example: `pk.png`, `ek.png`, `9p.png`

## Refresh logos

```bash
npm run download-airline-logos
```

Logos are fetched by IATA code. Codes that are historically reassigned (PF, 9P, FZ)
use curated override URLs inside `scripts/download-airline-logos.js` so we never
accidentally pull Primera Air for Air Sial or Air Arabia for Fly Jinnah again.

## Airlines included (33)

PK, PA, PF, 9P, ER, EK, EY, FZ, G9, QR, SV, XY, F3, WY, OV, KU, J9, GF, TK, PC, BA, VS, CA, CZ, OD, TG, UL, HY, KC, FS, J2, LH, ET

## Known IATA reassignments

| Code | Live carrier | Stale CDN risk |
|------|--------------|----------------|
| PF | Air Sial | Primera Air |
| 9P | Fly Jinnah | Air Arabia |
| FZ | flydubai | (curated for consistency) |
| G9 | Air Arabia | — |

## Replace with official assets

For brand compliance, you may replace any PNG with an official logo from the airline's media kit — keep the same filename (e.g. `pk.png`).

Legacy SVG code-badge fallbacks remain in the folder but are no longer referenced by the site.
