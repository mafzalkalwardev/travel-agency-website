/**
 * After scrape → Supabase, publish a compact read-only JSON mirror to the
 * `inventory-cache` git branch. Public site can serve from this CDN-friendly
 * file so most page views never touch Supabase (egress saver).
 *
 * Env: SUPABASE_*, GITHUB_TOKEN (Actions), GITHUB_REPOSITORY
 */
import { execFileSync } from "child_process";
import { writeFileSync, mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { createClient } from "@supabase/supabase-js";

const TICKET_COLS =
  "id,airline,airline_code,flight_number,from_code,from_city,to_code,to_city,sector,destination,departure_date,departure_time,arrival_time,duration,price,currency,seats_left,status,baggage,meal,trip_type,is_direct,active,last_updated,group_category,aircraft,external_id";
const UMRAH_COLS =
  "id,title,slug,package_code,external_id,category,price,currency,duration,departure_city,airline,hotel_makkah,hotel_madinah,distance_from_haram,transport,visa,ziyarat,seats_left,image_url,featured,status,highlights";
const TOUR_COLS =
  "id,title,slug,destination,price,currency,duration,image_url,featured,status,highlights,external_id";
const FLYER_COLS = "id,title,image_url,link,active,display_order,category";

async function fetchAll(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  table: string,
  columns: string,
  filter?: { column: string; value: string | boolean }
) {
  const pageSize = 1000;
  const all: Record<string, unknown>[] = [];
  for (let from = 0; ; from += pageSize) {
    let q = supabase.from(table).select(columns).range(from, from + pageSize - 1);
    if (filter) q = q.eq(filter.column, filter.value);
    const { data, error } = await q;
    if (error) throw new Error(`${table}: ${error.message}`);
    if (!data?.length) break;
    all.push(...(data as unknown as Record<string, unknown>[]));
    if (data.length < pageSize) break;
  }
  return all;
}

/** Prefer narrow cols; on unknown-column errors, fall back so publish still ships. */
async function fetchTable(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  table: string,
  columnSets: string[],
  filter?: { column: string; value: string | boolean }
) {
  let lastError: unknown;
  for (const cols of columnSets) {
    try {
      return await fetchAll(supabase, table, cols, filter);
    } catch (e) {
      lastError = e;
      console.warn(`fetch ${table} failed with narrow cols, trying next:`, e instanceof Error ? e.message : e);
    }
  }
  console.warn(`fetch ${table} giving up:`, lastError instanceof Error ? lastError.message : lastError);
  return [];
}

function git(cwd: string, args: string[]) {
  return execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  const repo = process.env.GITHUB_REPOSITORY || "mafzalkalwardev/travel-agency-website";

  if (!url || !key) throw new Error("Supabase env missing");
  if (!token) {
    console.warn("GITHUB_TOKEN missing — skip mirror publish");
    return;
  }

  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const [tickets, umrah, tours, flyers] = await Promise.all([
    fetchTable(supabase, "tickets", [TICKET_COLS], { column: "active", value: true }),
    fetchTable(
      supabase,
      "umrah_packages",
      [
        UMRAH_COLS,
        "id,title,slug,package_code,category,price,currency,duration,departure_city,airline,hotel_makkah,hotel_madinah,distance_from_haram,transport,visa,ziyarat,seats_left,image_url,featured,status,highlights",
      ],
      { column: "status", value: "active" }
    ),
    fetchTable(
      supabase,
      "tour_packages",
      [
        TOUR_COLS,
        "id,title,slug,destination,price,currency,duration,image_url,featured,status,highlights",
        "id,title,slug,price,currency,duration,image_url,featured,status",
      ],
      { column: "status", value: "active" }
    ),
    fetchTable(
      supabase,
      "flyers",
      [FLYER_COLS, "id,title,image_url,link,active,display_order", "id,title,image_url,active,display_order"],
      { column: "active", value: true }
    ),
  ]);

  const activeTickets = tickets;
  const payload = {
    updatedAt: new Date().toISOString(),
    tickets: activeTickets,
    umrahPackages: umrah,
    tourPackages: tours,
    flyers,
  };

  const dir = mkdtempSync(join(tmpdir(), "inv-mirror-"));
  try {
    writeFileSync(join(dir, "public-inventory.json"), JSON.stringify(payload));
    git(dir, ["init"]);
    git(dir, ["checkout", "-b", "inventory-cache"]);
    git(dir, ["config", "user.email", "github-actions[bot]@users.noreply.github.com"]);
    git(dir, ["config", "user.name", "github-actions[bot]"]);
    git(dir, ["add", "public-inventory.json"]);
    git(dir, ["commit", "-m", `inventory mirror ${payload.updatedAt}`]);
    const remote = `https://x-access-token:${token}@github.com/${repo}.git`;
    git(dir, ["remote", "add", "origin", remote]);
    git(dir, ["push", "-f", "origin", "inventory-cache"]);
    console.log(
      JSON.stringify({
        ok: true,
        tickets: activeTickets.length,
        umrah: umrah.length,
        tours: tours.length,
        flyers: flyers.length,
        branch: "inventory-cache",
      })
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
