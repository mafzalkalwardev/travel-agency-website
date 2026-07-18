# Al Qibla — Redesign & Live-Sync Master Document

Single source of truth for the redesign project defined in
`C:\Users\pc\.claude\plans\live-this-to-vercel-misty-bee.md`. Every later
phase should update this file when it changes something described here —
this is meant to stay current, not be a one-time snapshot.

Last verified against the live TravelLine site and this codebase: **2026-07-17**.

> **Update 2026-07-17 (same day, after initial audit): this is a B2B
> platform, not B2C.** The primary users are **travel sub-agents**, who
> create their own portal accounts on our site, search/hold tickets, get
> redirected to a same-ID confirmation page on our site, settle payment
> with Al Qibla, and download their ticket/voucher once confirmed — mirroring
> TravelLine's own agent-facing workflow (Al Qibla is itself one of
> TravelLine's B2B agents, and is now building the same kind of B2B layer
> one level down for its own sub-agents). This reframes Phase 5 (booking
> flow) and Phase 6 (agent portal) as the structural core of the project,
> not secondary polish. See §8 for the full workflow spec and §3.6-3.7 for
> the live TravelLine booking-model research that informs it.

---

## 1. What this project is

Al Qibla Services (`al-qibla-air-services` on Vercel) is a Next.js 16 B2B
travel-booking site that resells inventory sourced from a supplier,
**travellinetour.com** ("TravelLine"). Al Qibla acts as TravelLine's agent:
it logs into TravelLine with agent credentials, pulls live group-flight and
Umrah-package inventory, marks it up, and lets its own customers/sub-agents
browse and book it. Bookings are placed back against TravelLine's API to
hold real seats.

The goal of this redesign: make the sync fully automatic and complete
(no missed categories, full ticket detail, cancellation tracking), rebuild
the front end to be more animated/cinematic while keeping Al Qibla's own
brand colors, and make the booking flow and admin tooling match the depth
of the supplier's own platform.

---

## 2. Current architecture (as of this audit)

### 2.1 Stack
- **Next.js 16** (App Router), React 19, TypeScript, Tailwind v4.
- **Supabase** (Postgres) — the only database. No Prisma/Drizzle/Mongo.
  Client wrappers in `src/lib/supabase/{client,server,admin,middleware,env,require-admin}.ts`.
- **Supabase Auth** is the sole auth system (no custom JWT/NextAuth on our
  side — NextAuth is what *TravelLine itself* runs, which we authenticate
  against as a client).
- Animation stack: **GSAP + `@gsap/react` + ScrollTrigger + MotionPathPlugin**,
  **framer-motion**, **embla-carousel-react + embla-carousel-autoplay**
  (installed, currently unused), **`@react-three/fiber` + `@react-three/drei` + `three`**
  (installed, currently unused).
- Deployment: Vercel, project `al-qibla-air-services`
  (`.vercel/project.json` already linked). Branch at time of writing:
  `agent/advanced-ui-privacy`.

### 2.2 TravelLine integration (`src/lib/travelline/`)

| File | Role |
|---|---|
| `env.ts` | Reads `TRAVELLINE_*` env vars (base/admin URLs, agent credentials, markup %). |
| `categories.ts` | **Hardcoded** category lists — see §3, this is the main gap. |
| `scraper.ts` | Core scrape functions: `loginViaHttp()` (NextAuth CSRF+credentials login), `fetchTravelLineGroupFlights()` (loops the hardcoded category list hitting `/api/groups?category=...`), `scrapeTravelLineUmrahItems()` (HTTP first, Playwright fallback), `scrapeTravelLineTickets()` (login → fetch → map → dedupe). |
| `mappers.ts` | Transforms raw TravelLine JSON into `NormalizedTicket` / package records. `ticketsFromGroupFlights()` is the group-flight path. |
| `client.ts` | `TravelLineClient` class — booking placement (`createBooking()`, `POST /api/booking` or `/api/umrah-packages/{slug}/book`), session management, `resolveGroupId()` (also iterates the hardcoded category list). |
| `playwright-auth.ts`, `playwright-booking.ts` | Browser-automation fallbacks when the HTTP API path fails. |
| `INTEGRATION.md` | Existing hand-written notes on discovered TravelLine endpoints — still accurate, worth keeping. |
| `discovery-output/` (gitignored) | Scratch output from discovery probes, including the fresh ones run for this doc (`groups-category-probe.json`, `ui-reference/*.png`). |

**Confirmed TravelLine endpoints in use:**
- `GET /api/umrah-packages` — public, no auth required.
- `POST /api/auth/csrf` → `POST /api/auth/callback/credentials` — NextAuth
  login (`phoneNumber`/`password` form-urlencoded). This is the flow that
  actually works; the older `scripts/discover-travelline-http.js` probe
  used a different, wrong endpoint (`/api/auth/login`) and never obtained a
  real session — its `discovery-output/http-discovery.json` should be
  treated as stale/superseded, not as evidence anything is broken.
- `GET /api/groups?category=<name>` — session-required, returns
  `{ flights: [...], pagination: {...} }` for one category at a time.
  **No unfiltered/list-all variant** — calling `/api/groups` with no
  `category` param returns an empty result set (`total: 0`), confirmed
  live. Categories must be enumerated by name; the API does not support
  server-side discovery of the category list itself.
- `GET /api/auth/session` — session validation, returns
  `user.companyId`/`agentName`/**`role`** (e.g. `COMPANY_ADMIN`) and,
  importantly, **`creditLimit`/`creditBalance`** — see §3.7, TravelLine
  runs on a B2B credit-account model, not per-transaction payment.
- `GET /api/categories` — **newly discovered, supersedes the guess-based
  approach originally planned for Phase 3.** Returns every live group
  category with `name`, `imageUrl`, and `availableGroupsCount`, no
  category-name guessing required. See §3.6.
- `GET /api/booking?page=&limit=&companyId=&startDate=&endDate=` — lists
  the agency's own bookings (paginated, date-ranged). See §3.7 for the
  full record shape.
- `POST /api/booking` — places a group-flight seat hold.
- `POST /api/umrah-packages/{slug}/book` — places an Umrah package hold.

### 2.3 Data model (Supabase, `supabase/schema.sql` + `migrations/002-006`)

| Table | Purpose | Notable gaps |
|---|---|---|
| `tickets` | Group-flight inventory, synced from TravelLine. `status` check constraint: `available \| limited \| sold_out \| booked`. Has `external_id`, `source_provider`, `group_category`, `raw_payload jsonb`, `active boolean`. | **No `cancelled` status.** **No image/picture column at all.** |
| `umrah_packages`, `tour_packages` | Package inventory, same sync pattern. Has `image_url`. | No cancelled state either (only `active`/`sold_out`). |
| `bookings` | Customer hold-then-pay records. `status`: `pending_payment \| payment_confirmed \| booking_in_progress \| confirmed \| failed \| cancelled`. Has `supplier_hold_status`, `travelline_booking_ref`, `travelline_response jsonb`. | Cancellation is a single mutable field — **no history/audit trail** of transitions (who/when/why). |
| `customer_profiles` | Customer + agent accounts (same table, no role distinction). `approval_status: pending \| approved \| rejected`. | **No `role`/agent column** — agents and retail customers are indistinguishable in the data model. |
| `sync_logs` / `sync_changes` | Audit trail of each sync run and field-level diffs. | This is the closest thing to an audit trail today — good pattern to extend to booking history. |
| `integration_sessions` | Cached TravelLine NextAuth session cookies, server-side. | Matters for §5 (1-minute sync) — reuse here is what makes frequent polling viable without constant re-login. |
| `notification_log` | Email send audit. | — |
| `profiles` | Admin/editor accounts. | — |

### 2.4 Sync mechanism today

`vercel.json` runs **3 daily** Vercel Cron jobs (not per-minute):
```
sync-tickets        0 0 * * *
sync-packages        15 0 * * *
retry-booking-holds  30 0 * * *
```
All hit `CRON_SECRET`-protected routes under `src/app/api/cron/`. There's
also an on-demand "Sync Now" button in `/admin/tickets`
(`POST /api/admin/sync`, admin-auth gated).

### 2.5 Admin (`src/app/admin/(protected)/`)

Auth-gated via `requireAdmin()` (checks `profiles.role in ('admin','editor')`),
enforced at layout level, API level, and via Postgres RLS as defense in
depth. Existing pages: `dashboard`, `flight-analytics`, `bookings` (full
CRUD incl. cancel), `customers` (approve/reject), `inquiries`, `reviews`,
`tickets` (sync controls + sync-log feed, **not** per-ticket CRUD),
`umrah-packages`, `tour-packages`, `blog`, `flyers`, `announcements`,
`gallery`, `airlines`, `settings`, `login`.

**Gap**: `/admin/tickets` is sync-log/summary only — no per-ticket
browse/edit/cancel view. `/portal` is a 3-tile chooser page with no
distinct agent functionality; `SubAgentCTA.tsx` just routes to the same
customer signup flow. A real agent portal doesn't exist yet.

### 2.6 Frontend / animation inventory (reuse, don't rebuild)

- `src/components/layout/Header.tsx` — the navbar (there's no component
  literally named `Navbar`). Currently `sticky bg-navy/90 backdrop-blur-2xl`,
  becoming `bg-navy/95` on scroll (scroll-state logic already exists at
  lines 34-39) — solid, not transparent, over the hero.
- `src/components/motion/SiteArrivalIntro.tsx` — a brand splash **already
  exists**, rendered in `layout.tsx` before all chrome. Currently **1.3s**,
  skips via `sessionStorage` after first view. Uses the `.arrival-*`
  keyframe set in `globals.css` (sky/cloud/vignette/aircraft layers,
  mobile + `prefers-reduced-motion` variants already handled).
- `src/components/motion/AnimatedFlightPath.tsx`,
  `FloatingAircraftLayer.tsx`, `FlightPathStory.tsx` — the established
  "plane animation" pattern library (SVG motion-path plane, ambient
  floating aircraft/clouds, scroll-pinned milestone story). Reuse these
  rather than inventing new plane animation approaches.
- `src/components/motion/GsapReveal.tsx`, `GsapStagger.tsx`,
  `MotionStagger.tsx`, `GsapParallax.tsx` — generic scroll-reveal/parallax
  primitives, GSAP and framer-motion variants both exist side by side.
- `src/app/globals.css` — brand tokens already centralized:
  `--navy: #071b3a`, `--navy-light: #0a2548`, `--royal: #0b5da8`,
  `--gold: #d6a84f`, `--gold-light: #e8c97a`, `--brand-red: #c9202f`,
  `--light-bg: #f7f8fa`, mapped into Tailwind via `@theme inline` so
  `bg-navy`, `text-gold` etc. work directly. **These are the non-negotiable
  constant through every redesign phase.**
- Logo: already a real asset, `public/assets/logo/logo.png` (+`logo-alt.png`,
  `logo.svg`), referenced via `LOGO_PATH` in `src/lib/constants.ts:94` and
  used in both `Header.tsx` and `SiteArrivalIntro.tsx`. No new logo file
  needed unless the current one is visually unsatisfactory.
- `src/app/page.tsx` composes: `HeroSection` → `AnnouncementTicker` →
  `DestinationGrid` → `TicketsPreview` → `WhyChooseUs` → `FlightPathStory`
  → `SubAgentCTA`. `HeroSection.tsx` today is a single static background
  image (`ASSETS.heroPoster`) — **no carousel, no poster rotation** exists.
  `ContactCTA.tsx` exists but isn't currently wired into `page.tsx`.
- Booking flow: `src/components/booking/BookRequestSheet.tsx` is a
  **single-step slide-over form** — ticket summary → Supabase auth gate →
  approval-status gate → flat form (name/phone/email/passengers/notes) →
  `POST /api/bookings/` → redirect to WhatsApp. Not a multi-step
  ticket-detail → passengers → review → confirm flow.
- `src/app/tl-mirror/` — an existing **dev-only comparison tool**: renders
  our own scraped TravelLine data (`npm run scrape-mirror`) in a layout
  that visually copies TravelLine's own site, specifically for side-by-side
  comparison during redesign work. Worth using during Phase 5, not
  deleting.
- Asset folders: `public/assets/airlines/` (~30 airline logos, svg+png),
  `public/assets/heroes/` (flat JPGs per page, no `group-flights/`
  subfolder yet), `public/assets/flyers/` (6 promo images — natural
  starting material for the new hero carousel), `public/assets/gallery/`,
  `destinations/`, `packages/`.

---

## 3. Live TravelLine findings (verified 2026-07-17)

### 3.1 The "5th category" is real and confirmed

Logged into travellinetour.com with the project's own agent credentials
(same NextAuth flow `scraper.ts` uses) and probed `/api/groups` directly.
Results:

| Category string | Status | Live flight count |
|---|---|---|
| `Umrah Groups` | 200 | 53 |
| `U A E Oneway Groups` | 200 | 41 |
| `O M A N Oneway Groups` | 200 | 0 (valid category, currently empty) |
| `K S A Oneway Groups` | 200 | 251 |
| **`Bahrain Oneway Groups`** | 200 | **1** ← confirmed real, not in our code |

Sample record for the new category (full JSON saved at
`src/lib/travelline/discovery-output/groups-category-probe.json`):
ISB → BAH, Fly Jinnah `9P-764`, groupPnr `4ZR08U`, 2026-07-30 departure,
PKR 115,000 sale price, 2 seats available. Its `groupCategory` field in
the payload is the exact string `"Bahrain Oneway Groups"`.

This was also confirmed visually: the live homepage's "Explore by
Destination" strip (screenshot at
`src/lib/travelline/discovery-output/ui-reference/02-post-login.png`) shows
**6 tiles**: `2026 Season` (Umrah packages), `K S A Oneway`, one partially
obscured tile, `U A E Oneway`, `OMAN Oneway`, `Bahrain Oneway` — i.e. 5
group categories + 1 package tile, matching the API probe exactly.

**Action for Phase 3**: add `"Bahrain Oneway Groups"` to
`TRAVELLINE_GROUP_CATEGORIES` (`categories.ts:2-7`) and a matching
`EXPLORE_CATEGORIES` entry (`ksa`/`uae`/`oman` pattern), *and* build the
auto-detection/alerting mechanism described in §6 so the *next* new
category doesn't require another manual code change + live audit like this
one did.

### 3.2 No image field confirmed at the source too

Inspected full flight payload shape for all 5 categories — there is no
image/photo field anywhere on a group-flight record (only airline logos,
which we already capture via `AirlineLogo.tsx`'s static per-carrier asset
map, not from the API). So "same pictures" for tickets in the original
request most realistically means: airline logos (already covered) plus
possibly destination/category imagery (already exists for the category
tiles, e.g. `public/assets/flyers/`), not a picture-per-flight — TravelLine
itself doesn't have that either. Package records (`umrah_packages`) *do*
carry `images: [...]` — that path is already handled correctly by our
mapper.

### 3.3 No explicit ticket-level "cancelled" status at the source

Every sampled flight record's top-level `status` field reads `"published"`.
There's no `"cancelled"` value observed. This confirms the plan's approach
in §6: our own sync needs to *infer* cancellation (a previously-seen
`external_id`/PNR disappearing from the feed, or seats going to 0 in a way
distinct from normal sell-through) rather than reading a supplier-provided
cancelled flag, because the supplier doesn't expose one directly on this
endpoint. `groupPnr` is the natural stable identifier to track across sync
runs for this purpose.

### 3.4 Hero section — what TravelLine actually built

Screenshot: `src/lib/travelline/discovery-output/ui-reference/01-homepage-hero.png`.
It is **not** a WebGL/3D screen — it's a simpler CSS effect: two overlapping,
slightly rotated photo cards (Kaaba + Masjid Nabawi) with drop shadows over
a dark green gradient background with a faint skyline silhouette, plus a
"TRUSTED B2B FLIGHT BOOKING PLATFORM" eyebrow badge, a two-tone headline
("Your Gateway to **Group Travel**"), a stat row (50+ Destinations / 1,000+
Group Flights / 1,500+ Agents / 24/7 Support), and a promo strip below
("Umrah Bookings 2026 are Live!" + Explore Packages CTA). Below that, the
"Explore by Destination" tile grid (§3.1).

This matters for Phase 5: the user explicitly chose a **true WebGL 3D**
hero over matching this simpler effect, so our build will exceed
TravelLine's own visual complexity by design — that's a deliberate
differentiation, not a misunderstanding of the source.

### 3.5 Booking/detail flow — not directly explorable this pass

`/groups`, `/explore`, and `/dashboard` as literal routes all 404'd even
when authenticated — TravelLine's search/detail UI is client-rendered
through the homepage's "Search Group Flights" widget rather than living at
separate URLs, so it needs interactive (not just static) navigation to
capture. Deeper capture of the actual booking/detail screen layout is
flagged as follow-up work for early Phase 5 (drive the search widget with
Playwright, not just goto() known paths) rather than blocking this
document.

### 3.6 `/api/categories` replaces the guess-based discovery plan

Found while investigating the booking workflow (its response was captured
incidentally alongside a "My Bookings" network trace). This is the
authoritative, no-guessing category list:

```json
[
  { "name": "K S A Oneway Groups",   "availableGroupsCount": 251, "imageUrl": "..." },
  { "name": "Umrah Groups",          "availableGroupsCount": 53,  "imageUrl": "..." },
  { "name": "U A E Oneway Groups",   "availableGroupsCount": 41,  "imageUrl": "..." },
  { "name": "OMAN Oneway Groups",    "availableGroupsCount": 14,  "imageUrl": "..." },
  { "name": "Bahrain Oneway Groups", "availableGroupsCount": 1,   "imageUrl": "..." }
]
```
(Full response: `discovery-output/categories-full.json`.) This **replaces**
§6's original guess-and-probe design entirely: Phase 3 should call this
endpoint directly (on every sync, or at least hourly) and diff its
`name` list against `TRAVELLINE_GROUP_CATEGORIES` to detect new categories
with certainty — no more heuristic name-pattern guessing. It also solves
category tile imagery for free (`imageUrl` per category, usable for
`EXPLORE_CATEGORIES` artwork instead of manually sourcing images per
category as originally planned). One correction from the earlier probe: OMAN
now shows 14 available (it was a temporary 0 when first probed hours
earlier) — inventory genuinely fluctuates live, reinforcing why 1-minute
sync matters.

### 3.7 Booking model — this is the blueprint for Phase 5/6's workflow

Pulled the agency's real booking history via `GET /api/booking` (own
company's bookings only, this is not a security issue — it's the same
account Al Qibla already uses). The raw dump contained real customer
passenger PII (names, passport numbers, DOB) and was deleted after review
per §5 — the structure below is the complete extract of what it showed.
Key structure:

- **`orderId`** (e.g. `"TL-CF27B1"`, `"TL-ACFDD2"`) — a short, human-facing
  order code distinct from the airline `airlinePnr`. **This is exactly the
  "same ticket id" the user wants mirrored on our own confirmation page** —
  our booking flow should adopt/display this same `orderId` (or generate
  our own in the same style and store TravelLine's alongside it) so an
  agent sees one consistent identifier across both TravelLine's system and
  ours.
- **`status`**: `RESERVED → CONFIRMED` or `RESERVED → CANCELLED`. Directly
  matches the "ALL / CONFIRMED / RESERVED / CANCELLED" filter tabs visible
  on TravelLine's own "My Bookings" screen
  (`discovery-output/ui-reference/04-my-bookings.png`). Our `bookings`
  table's existing status enum
  (`pending_payment/payment_confirmed/booking_in_progress/confirmed/failed/cancelled`)
  should map cleanly onto this three-state model for the *TravelLine side*
  of the record, kept separate from our own *Al Qibla-facing* payment
  status (see §8).
- **`reserved_at` / `expired_at`**: the hold window is short — observed
  example was exactly 1 hour (21:01 → 22:01). A booking that isn't
  confirmed before `expired_at` auto-cancels (`updatedBy: "SYSTEM"` in its
  history). This confirms the existing `retry-booking-holds` cron's intent
  and means **our own redirect-to-confirm-payment step (§8) has to happen
  inside this same tight window**, not asynchronously — the 1-minute sync
  cadence (Phase 4) matters here too, not just for inventory freshness.
- **`confirmed_at`**: appears once a booking transitions to `CONFIRMED`
  (absent/`null` before). Our schema should add the equivalent so "when did
  this actually get confirmed" is queryable, not just inferred from
  `updated_at`.
- **`history[]`**: a full audit trail per booking — `{ eventType:
  "CREATED"|"UPDATED", previousData: {...changed fields...}, timestamp }`.
  This is precisely the shape planned for our new `booking_status_history`
  table in Phase 3 — TravelLine's own data model validates that design
  directly, down to storing a diff (`previousData`) rather than just
  before/after status.
- **No download/voucher/PDF URL field anywhere in the booking JSON** —
  confirmed by grepping the full response for `voucher`/`pdf`/`download`/
  `ticketUrl`/`eTicket`: zero matches. TravelLine's own "Download" action
  (if any — not yet confirmed to exist on the detail view, see §3.8) is
  almost certainly a client-rendered print/PDF view built from this same
  JSON, not a separate generated-file endpoint. **This means Phase 5 can
  build our own download/print view straight from data we already store —
  no supplier file API to reverse-engineer.**

### 3.8 Credit-account model (important nuance for §8's payment design)

`GET /api/auth/session` returns, alongside the session user, the
**company's** `creditLimit` and `creditBalance` (both currently
1,000,000 PKR for Al Qibla's TravelLine account). This confirms
TravelLine doesn't take payment per booking from its agents in real time —
Al Qibla operates against a pre-arranged credit line with TravelLine, and
presumably settles that account balance separately/periodically. **This is
a different relationship than Al Qibla ↔ its own sub-agents**, who don't
have their own TravelLine credit lines — they pay Al Qibla directly. See
§8's open question about which model (credit-account vs. per-booking
proof-of-payment) Al Qibla wants to run internally for its own sub-agents.

A live "View" click into an actual booking detail page (to see whether a
Download/Print button exists at all, and what it renders) was **not**
captured in this pass — reaching it requires either an existing confirmed
booking or placing a new test hold, and placing a real hold against
TravelLine's live inventory is a mutating action with real consequences
(consumes a real seat, affects the credit balance) that shouldn't happen
as a side effect of documentation research. Flagged as deliberate,
consent-gated follow-up at the start of Phase 5, not done here.

---

## 4. Everything the user asked for, mapped to a phase

| Ask | Status today | Phase |
|---|---|---|
| PNG logo of Al Qibla | Already exists, already wired in | — (done) |
| Transparent navbar | Exists but solid `bg-navy/90`, not transparent-over-hero | 5 |
| 5-second brand intro | Exists at 1.3s | 5 |
| Sync stays current with TravelLine incl. new categories | Hardcoded 4-category list, missing confirmed 5th (`Bahrain Oneway Groups`) | 3 |
| Same pictures/tickets/details as TravelLine | Ticket detail depth is solid (segments, baggage, meal, fares); no per-ticket images exist at the source either (§3.2) | 3 |
| Full backend, everything admin-managed | Admin covers bookings/customers/packages/content/sync; ticket CRUD and agent management missing | 6 |
| Sync every 1 minute | Currently daily via Vercel Cron | 4 |
| Full record of every ticket | `sync_logs`/`sync_changes` exist for inventory diffs; no per-ticket cancelled state | 3 |
| Homepage hero "3D screen" like TravelLine, scrolling posters/offers | No carousel at all today; TravelLine's own hero is a simpler tilted-photo effect (§3.4), user chose to build genuine WebGL 3D instead | 5 |
| Ticket booking flow/detail layout like TravelLine | Single-step form → WhatsApp handoff today; TravelLine's own flow needs deeper interactive capture (§3.5) as this phase starts | 5 |
| Agent portal keeps full clear admin records | Doesn't exist as a distinct system today | 6 |
| Cancelled tickets show as cancelled | Only `bookings.status` has cancelled; ticket-level doesn't | 3 |
| Everything synced automatically every minute | Same as above | 4 |
| **B2B agent portal is the primary product, not a side feature** | `/portal` is a 3-tile chooser only | 5, 6 |
| **Same order ID on our site as TravelLine's, redirect-to-confirm flow** | Doesn't exist; current flow ends at WhatsApp handoff | 5 |
| **Agent can download ticket/voucher like on TravelLine** | Doesn't exist; TravelLine itself has no file-download API either (§3.7) — build our own print/download view from stored data | 5 |
| **Admin confirms payment via admin portal or by checking TravelLine's own confirmation** | Admin can mark a booking `payment_confirmed` today; no TravelLine-status cross-check exists | 3, 6 |
| **Footer redesign + "Made by INDUS WEB AGENCY" credit/link** | Current footer flagged by user as not looking good; no agency credit exists | 5 |
| **Fault isolation — one failing service shouldn't take down the rest of the site** | Not yet audited end-to-end | cross-cutting, see §10 |
| **SEO — rank for brand name + B2B/flight-booking keywords, internationally** | No dedicated SEO work done yet beyond basic metadata | new Phase 8, see §11 |

---

## 5. Repo cleanup (Phase 1) — done 2026-07-17

- `public/assets/hero.mp4.mp4` — confirmed byte-identical (sha256 match) to
  `public/assets/videos/hero-flight.mp4` and referenced nowhere in `src/`.
  **Deleted.**
- Root-level generated audit reports (`WEBSITE-AUDIT-REPORT.md`,
  `WEBSITE-AUDIT-REPORT.local.md`, `WEBSITE-AUDIT-REPORT.production.md`) —
  disposable outputs of `scripts/audit-website.ts`, already gitignored per
  commit `76c7ecd`. **Deleted.**
- `scripts/discover-travelline-http.js` — hit the wrong login endpoint and
  never obtained a real session (§2.2), producing misleading "login
  failed" artifacts when the real flow (`scraper.ts`'s `loginViaHttp`)
  works fine. **Deleted** — superseded by the proven-working flow already
  in `scraper.ts` and by this session's own ad-hoc discovery scripts
  (§3.6-3.8).
- **Security/privacy hygiene — done, not just flagged**:
  - `discovery-output/http-discovery.json` (plaintext TravelLine agent
    phone number + password from an old probe). **Deleted.**
  - `discovery-output/bookings-full.json` and `bookings-api-calls.json` —
    the real booking dumps pulled for §3.7-3.8's research contained actual
    customer **passenger PII** (full names, passport numbers, dates of
    birth). Their structure is fully captured in §3.7-3.8 above, so the
    raw dumps had no further reference value and were **deleted** rather
    than left sitting as plaintext PII on disk. `groups-category-probe.json`,
    `categories-full.json`, and the `ui-reference/*.png` screenshots were
    kept — no PII in those (flight inventory + UI screenshots only).
- Filenames the user mentioned that **don't exist** in this repo or its
  git history at all: `debug-ticket-sync.ts`, `dump-sample-booking.ts`,
  `list-test-holds.ts`, `probe-admin-booking-methods.ts`,
  `cancel-hold-playwright.ts`, `list-group-categories.ts`,
  `add-group-category-column.js`, and the various `capture-*.ts` Playwright
  scripts / `book-step-0.png`. Nothing to delete there.

---

## 6. Category auto-detection design (Phase 3 detail) — REVISED

~~Original design guessed category name patterns since no discovery
endpoint was known.~~ **Superseded by §3.6**: `GET /api/categories` is a
real, reliable discovery endpoint. Revised approach:
1. On each sync (or at least hourly, independent of the 1-minute ticket
   sync), call `GET /api/categories` and diff its `name` list against
   `TRAVELLINE_GROUP_CATEGORIES`.
2. Any name present in the API response but not in our known list is a new
   category — surface it as an admin alert/pending-approval item (with its
   `imageUrl` and `availableGroupsCount` pre-filled from the API response)
   rather than silently auto-adding it to production; a human should
   confirm the category before it goes live with customer-facing copy.
3. Once approved, add it to `TRAVELLINE_GROUP_CATEGORIES` and a matching
   `EXPLORE_CATEGORIES` entry (image can default to the supplier's
   `imageUrl` or be replaced with Al Qibla's own branded asset).
4. Add a generic/dynamic fallback at `group-flights/[category]` so a
   newly-approved category is immediately browsable without a further
   deploy once added to the list.

This is materially simpler and more reliable than the original
guess-and-probe plan — no name-pattern brute-forcing needed at all.

---

## 6.1 Phase 3 execution notes (2026-07-18)

- Phase 3 shipped: migrations 007-009 (cancelled state, image_url,
  booking_status_history, TravelLine order/status cross-reference,
  sub-agent role + credit ledger, category_alerts, public RLS excluding
  cancelled tickets), Bahrain added, ticket images sourced from
  `/api/categories`, and the departed-ticket safety-net deactivation.
- **The new category-alert system immediately caught a real, pre-existing
  bug**: `TRAVELLINE_GROUP_CATEGORIES` had `"O M A N Oneway Groups"`
  (letter-spaced) as the `/api/groups` query param, but TravelLine's real
  category name has no internal spaces (`"OMAN Oneway Groups"`) — verified
  live, the spaced query always returned 0 flights while the correct one
  returned 14. This predates this session; Oman group flights had likely
  never synced correctly before. Fixed by correcting the string in
  `categories.ts`.
- First sync-tickets run after adding category discovery hit Vercel's
  120s function timeout, because `recordNewCategories` was logging into
  TravelLine a second time on top of the ticket fetch's own login.
  Fixed by merging both into one login via
  `scrapeTravelLineTicketsWithCategories()`. Post-fix run: 200 OK in
  ~111s — still close to the ceiling, worth watching once Phase 4's
  1-minute cadence is live (see §7 risk below).
- Removed the "Candy" / Finance Officer entry from the About Us page per
  request (a separate session running in parallel on this same repo had
  independently done the same removal and gone further, trimming
  leadership down to Farman Ullah only — reconciled via a normal git
  merge, no work lost).

## 6.2 Phase 4 execution notes (2026-07-18) — 1-minute sync

- `src/lib/sync/sync-lock.ts` + migration 010 (`sync_locks` table): a
  best-effort overlap lock (5-minute staleness timeout so a crashed run
  can't deadlock future ones). Wired into every sync trigger via a new
  shared `src/lib/sync/run-ticket-sync.ts` — the Vercel cron route
  (`/api/cron/sync-tickets`), the admin "Sync Now" button
  (`/api/admin/sync`), and the GitHub Actions script all now go through
  one code path instead of three that could drift.
- **`.github/workflows/travelline-sync.yml` existed already** (from the
  parallel session working on this repo) at a 5-minute cadence, running a
  full `npm ci` + Playwright install + local scrape every invocation.
  That's impractical at 1-minute cadence (the setup overhead alone could
  exceed the 60s gap between runs). Replaced with a lightweight workflow
  that just calls the deployed, lock-protected
  `/api/cron/sync-tickets` endpoint via `curl` — no checkout, no install,
  no Playwright. `CRON_SECRET` was already present as a GitHub repo
  secret.
- **Honesty note for the user**: GitHub Actions' `schedule` trigger is
  best-effort, not a real-time guarantee — GitHub explicitly documents
  that scheduled workflows can be delayed by several minutes during
  platform load, especially on the free tier. "Every minute" here means
  "as close to every minute as a free scheduler allows," with Vercel's
  own daily cron (`vercel.json`) kept as an unrelated backstop in case the
  GitHub side goes quiet entirely.
- Package sync (Umrah packages) intentionally stays on Vercel's existing
  daily cron — the user's "every minute" ask was about ticket
  availability/seats, which changes far more often than package content.

## 7. Open questions / risks carried into execution

- **Vercel plan**: not yet confirmed whether the linked Vercel project is
  Hobby or Pro. Doesn't block Phase 4 since the plan uses an external
  1-minute scheduler regardless, but worth knowing for other constraints
  (function duration, bandwidth).
- **TravelLine rate-limiting under 1-minute polling**: not yet tested at
  sustained frequency. `integration_sessions` session reuse should help;
  Phase 4 includes a burn-in observation period specifically to catch this
  before calling it done.
- **Sync duration vs. 1-minute cadence**: a full sync now takes ~110s
  (confirmed live 2026-07-18), close to Vercel's 120s function ceiling and
  uncomfortably close to the 60s gap between runs Phase 4 introduces.
  Overlapping runs need to be prevented explicitly (e.g. a simple
  in-flight lock via `sync_logs`/a dedicated lock row) rather than assumed
  away — a naive every-60s external trigger risks a second run starting
  before the first finishes.
- **WebGL 3D hero perf on low-end/mobile devices**: real risk given
  `@react-three/fiber` is unused today (unproven in this codebase). Phase 5
  ships a static-carousel (`embla-carousel-react`) fallback path gated on
  `prefers-reduced-motion` / a basic capability check.
- **Booking/detail page structure**: §3.5 — TravelLine's actual
  ticket-detail/booking screens need an interactive (not just static)
  capture pass early in Phase 5, since they weren't reachable via direct
  URL navigation in this pass.
- **Agent commission visibility**: Phase 6's agent portal scope currently
  assumes booking-queue/history access only; whether agents need to *see*
  commission figures (beyond the flat `TRAVELLINE_PRICE_MARKUP_PERCENT` env
  var today) needs a explicit answer before that part of Phase 6 is built.
- ~~Payment mechanism for the redirect-to-confirm step~~ **Resolved
  2026-07-17**: credit-account model, same as TravelLine's own — see §8.4.
- ~~INDUS WEB AGENCY's URL~~ **Resolved 2026-07-17**:
  `https://www.induswebagency.com/` — see §9.
- ~~SEO target scope~~ **Resolved 2026-07-17**: Pakistan + Gulf region
  (UAE/Oman/KSA/Bahrain) — matches the real destination set, see §11.

---

## 8. B2B booking workflow — full spec (added 2026-07-17)

This is the structural core of the product, not a side feature. Al Qibla
is itself a TravelLine B2B agent; this section defines the equivalent
one-level-down relationship between Al Qibla and *its own* sub-agents,
directly modeled on what §3.7-3.8 found TravelLine actually does.

### 8.1 Actors
- **Sub-agent**: creates a portal account on our site (this is what
  `SubAgentCTA.tsx` gestures at today but doesn't deliver — see §2.5).
  Searches live inventory, places holds, pays Al Qibla, downloads
  confirmed tickets, sees their own booking history.
- **Al Qibla admin**: confirms sub-agent payment, cross-checks against
  TravelLine's own booking status, manages the whole record set.
- **TravelLine**: the actual seat-holding system of record. Every booking
  Al Qibla's sub-agents make ultimately becomes one real
  `POST /api/booking` hold against TravelLine, under Al Qibla's own
  company credit line (§3.8).

### 8.2 Flow (as described by the user, mapped onto §3.7's real TravelLine model)

1. Sub-agent searches/selects a ticket on our site and submits a booking
   request — same as today's `BookRequestSheet` entry point.
2. We place the hold against TravelLine (`POST /api/booking`, already
   implemented in `client.ts`), receiving TravelLine's own `orderId` and
   `airlinePnr` back, with a short `expired_at` hold window (observed
   ~1 hour in §3.7 — **must be treated as the hard deadline for the whole
   flow below**).
3. Sub-agent is **redirected to a page on our own site** that displays the
   same order/ticket identifiers and details TravelLine's own confirmation
   would show (itinerary, fare, passengers, `orderId`) — not a WhatsApp
   handoff as today.
4. Sub-agent **confirms/settles payment** on that page. *(Open question:
   proof-of-payment upload + admin review, vs. an integrated payment
   gateway — flagged in §7, needs an explicit answer before Phase 5 builds
   this screen.)*
5. Admin confirms the booking two ways, either is sufficient: (a) manually
   in our admin portal once Al Qibla has received the sub-agent's payment,
   or (b) by observing that TravelLine's own system shows the booking as
   `CONFIRMED` (§3.7) — which is a direct signal the hold successfully
   converted to a real ticket. **Phase 3/6 should surface TravelLine's live
   `status`/`confirmed_at` for each of our bookings in the admin UI**
   (poll `GET /api/booking` or the specific booking's status, not just
   rely on our own database state) so admins can use signal (b) without
   tabbing over to TravelLine's own site.
6. Once confirmed, the sub-agent can **download** their ticket/voucher from
   our site. Per §3.7, TravelLine's own API has no separate file-download
   endpoint — build a print/PDF view rendered from the same structured
   data we already store (itinerary, passengers, fare, `orderId`), the
   same way TravelLine's own UI almost certainly does it. No external file
   API to reverse-engineer.
7. The booking then lives in the sub-agent's own booking history on our
   site, and in Al Qibla's admin records, permanently — including if it
   later gets cancelled (ties back to Phase 3's booking-status-history
   work, now directly informed by TravelLine's own `history[]` shape from
   §3.7).

### 8.3 Data model implications for Phase 3/6
- `bookings` needs a `travelline_order_id` (or reuse the existing
  `travelline_booking_ref` column if it's already storing this — verify at
  implementation time) distinct from `travelline_booking_ref`/PNR, and a
  `travelline_status`/`travelline_confirmed_at` pair kept in sync via
  polling, separate from our own `status` field which tracks *our*
  side (sub-agent payment) of the transaction.
- The planned `booking_status_history` table (Phase 3) should store
  `previousData`-style diffs, matching §3.7's finding, not just a bare
  before/after status pair.
- `customer_profiles` needs the planned `role` column (§2.5) so "sub-agent"
  is a real, distinguishable account type with its own portal experience —
  this was already planned but is now confirmed as core, not optional.

### 8.4 Payment mechanism — resolved: credit-account model (2026-07-17)

Decision: sub-agents get their own **credit limit / credit balance** with
Al Qibla, directly mirroring how TravelLine itself treats Al Qibla as a
company (§3.8: `creditLimit`/`creditBalance` on the TravelLine session).
This replaces "confirm/settle payment" in step 4 of §8.2 with: the booking
draws down the sub-agent's credit balance automatically at hold time (or
at confirm time — needs a concrete rule, see below), rather than the agent
uploading proof of payment per booking. Settlement of the agent's actual
cash owed to Al Qibla happens periodically, outside the booking flow
itself (e.g. admin tops up an agent's credit balance after receiving a
bank transfer, the same way TravelLine presumably tops up Al Qibla's own
balance).

Design implications for Phase 3/6:
- `customer_profiles` (or wherever the new `role` column lands, §8.3) needs
  `credit_limit` and `credit_balance` columns for sub-agent accounts,
  mirroring TravelLine's own fields exactly.
- A `credit_transactions` (or `credit_ledger`) table is needed — every
  booking-hold debit and every admin top-up credit, timestamped and
  attributed, so the balance is always derivable/auditable rather than a
  single mutable number (same audit-trail principle as
  `booking_status_history` in §8.3).
- **Open sub-question to resolve at Phase 5/6 implementation time**: does
  placing a hold immediately debit the credit balance (blocking further
  bookings once exhausted, refunded automatically if the hold expires
  unconfirmed — mirrors TravelLine's own hold/expire behavior from §3.7
  most closely), or does debit only happen on `CONFIRMED`? The former is
  safer (prevents a sub-agent overcommitting past their limit across
  several simultaneous holds) and is the recommended default given it
  matches TravelLine's own pattern, but confirm before building.
- Admin needs a credit-management UI (set/adjust an agent's limit, record
  top-ups, view ledger) — new surface for Phase 6, not covered by any
  existing admin page today.
- This makes step 5 of §8.2 (admin confirms two ways) slightly different
  in practice: since payment is credit-based rather than per-booking proof,
  "admin confirms via TravelLine's own status" becomes the *primary*
  signal (the booking is real once TravelLine shows `CONFIRMED`), while
  admin's own portal action is more about credit-limit management and
  manual overrides than reviewing individual payment proofs.

---

## 9. Footer redesign + agency credit (Phase 5)

- User flagged the current footer as not looking good — visual redesign
  needed as part of Phase 5's broader front-end pass, keeping the same
  navy/gold/royal/red brand tokens as everything else.
- Add a "Made by **INDUS WEB AGENCY**" credit line at the bottom of the
  footer, linking to `https://www.induswebagency.com/` (provided by the
  user 2026-07-17).

---

## 10. Fault isolation (cross-cutting, applies from Phase 3 onward)

User's explicit requirement: "if one service goes down other should must
work." This isn't a single task — it's a principle to apply everywhere a
new dependency gets added:
- **TravelLine outage/slowness** must not break ticket browsing/booking of
  already-synced inventory — the site should serve last-known-good data
  from Supabase, not fail live if the supplier is briefly unreachable
  (partially true today: sync failures are logged via `sync_logs` rather
  than surfaced as user-facing errors — verify this holds for the new
  1-minute sync and the new TravelLine booking-status polling in §8.2 too).
- **Email (Resend) failures** must not block booking creation — check this
  is already true (`notification_log` suggests failures are tracked
  separately) and keep it true as the booking flow gets rebuilt in Phase 5.
- **The new WebGL 3D hero (Phase 5)** must not block the rest of the
  homepage from rendering if `three`/`@react-three/fiber` fails to init on
  a given device — this is exactly why §7 already scopes a static-carousel
  fallback path, not just a nice-to-have.
- **The external 1-minute sync scheduler (Phase 4)** failing to fire must
  not silently stop the site from working — the existing daily Vercel cron
  fallback (already planned) covers this, but Phase 4 should also add
  admin-visible alerting when a sync gap is detected, not just a silent
  fallback.
- Carry this principle into Phase 6's admin/agent portal build too: an
  agent-portal bug shouldn't be able to take down retail ticket browsing,
  and vice versa — keep them architecturally decoupled where practical
  (shared data layer is fine; shared failure modes are not).

---

## 11. SEO (new Phase 8, after QA)

User's ask: rank first on Google for the Al Qibla brand name, and rank
well internationally for B2B/flight/ticket-booking keywords. Scoping this
honestly: **no one can guarantee a #1 ranking** — that depends on domain
age, backlinks, and competition, not just on-site code. What *is*
fully within this project's control, and should be delivered as Phase 8:
- **Technical SEO**: proper per-page `<title>`/meta description (partial
  groundwork already exists via `src/lib/metadata.ts` and the
  `TravelAgency` JSON-LD block in `layout.tsx` — extend, don't rebuild),
  `sitemap.xml`, `robots.txt`, canonical URLs, Open Graph + Twitter card
  tags, structured data per ticket/package (`Flight`/`Product` schema, not
  just organization-level JSON-LD).
- **Performance**: Core Web Vitals matter directly for ranking — the new
  WebGL hero (Phase 5) needs to be built with this in mind from the start
  (lazy-load, fallback path), not retrofitted after Phase 8 finds it's
  slow.
- **Content/keyword targeting — resolved 2026-07-17**: primary market is
  **Pakistan + Gulf region** (UAE, Oman, KSA, Bahrain — matches the actual
  live ticket categories in §3.6), not worldwide. Target keyword families:
  brand name ("Al Qibla", "Al Qibla Air Services", "Al Qibla Services"),
  B2B travel-agent terms ("B2B flight booking Pakistan", "group flight
  booking agent portal", "Umrah group booking B2B"), and per-destination
  terms ("UAE oneway group tickets", "KSA group flight booking", "Bahrain
  flight tickets Pakistan", etc.) reflecting the live category set.
- **Indexability audit**: confirm nothing important is accidentally
  `noindex`ed or blocked by `robots.txt`/`trailingSlash` redirects
  (`next.config.ts` already sets `trailingSlash: true` — verify this
  doesn't create duplicate-URL indexing issues).
