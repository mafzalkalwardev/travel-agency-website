<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

Single Next.js 16 (App Router) product (`al-qibla-air-services`). Package manager is npm; Node 22 is used in CI. Standard commands live in `package.json` and `README.md` (`npm run dev`, `npm run build`, `npm run lint`); there is no automated test suite.

Non-obvious caveats:
- Runs in a **development fallback mode** with no external services: when Supabase env vars are absent, `src/lib/supabase/env.ts` (`isSupabaseConfigured()`) makes the app serve seed data from `src/data/*`, and the reviews/inquiries/bookings API routes return a `devFallback: true` success response without persisting. So the dev server and all public pages work end-to-end with zero setup. Supabase (schema in `supabase/`, see `SUPABASE_SETUP.md`) is only required to exercise real admin auth and DB writes; Resend (email) and TravelLine (ticket sync) are optional and self-disable when unset.
- `next.config.ts` enables `trailingSlash`, so routes and API endpoints redirect (308) without a trailing slash. Use `/inquiry/`, `/api/inquiries/`, etc. (or `curl -L`).
- `npm run lint` only covers `src/` — `eslint.config.mjs` ignores `scripts/**`.
- There is no `.env.example` despite README/`SUPABASE_SETUP.md` referencing one; create `.env.local` manually from the variables listed in the README if you need Supabase.
