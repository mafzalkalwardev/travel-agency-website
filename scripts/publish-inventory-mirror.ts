/**
 * After scrape → Supabase, publish compact JSON to a SEPARATE GitHub repo
 * (`travel-agency-inventory-cache`) that is NOT linked to Vercel.
 *
 * Pushing this to the app repo's `inventory-cache` branch caused Vercel Preview
 * failures every 5 minutes and spam emails.
 *
 * Env: SUPABASE_*, GITHUB_TOKEN or GH_DISPATCH_TOKEN (contents:write on mirror repo),
 *      GITHUB_REPOSITORY (app repo, optional), INVENTORY_MIRROR_REPO (optional)
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

const DEFAULT_MIRROR_REPO = "mafzalkalwardev/travel-agency-inventory-cache";

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

async function ensureMirrorRepo(apiToken: string, mirrorRepo: string) {
  const res = await fetch(`https://api.github.com/repos/${mirrorRepo}`, {
    headers: {
      Authorization: `Bearer ${apiToken}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "al-qibla-inventory-mirror",
    },
  });
  if (res.status === 200) return;
  if (res.status !== 404) {
    throw new Error(`Cannot read mirror repo ${mirrorRepo}: HTTP ${res.status}`);
  }

  const [owner, name] = mirrorRepo.split("/");
  const create = await fetch("https://api.github.com/user/repos", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiToken}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "al-qibla-inventory-mirror",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      description: "CDN inventory JSON for Al Qibla site (not linked to Vercel)",
      private: false,
      auto_init: true,
      has_issues: false,
      has_projects: false,
      has_wiki: false,
    }),
  });
  if (!create.ok) {
    const text = await create.text();
    // Org create path if user endpoint fails
    const orgCreate = await fetch(`https://api.github.com/orgs/${owner}/repos`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "al-qibla-inventory-mirror",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        description: "CDN inventory JSON for Al Qibla site (not linked to Vercel)",
        private: false,
        auto_init: true,
      }),
    });
    if (!orgCreate.ok) {
      throw new Error(
        `Create mirror repo failed: user=${create.status} ${text.slice(0, 200)} org=${orgCreate.status}`
      );
    }
  }
  console.log(`Created mirror repo ${mirrorRepo}`);
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const token =
    process.env.GH_DISPATCH_TOKEN ||
    process.env.GITHUB_TOKEN ||
    process.env.GH_TOKEN;
  const mirrorRepo = process.env.INVENTORY_MIRROR_REPO || DEFAULT_MIRROR_REPO;

  if (!url || !key) throw new Error("Supabase env missing");
  if (!token) {
    console.warn("GitHub token missing — skip mirror publish");
    return;
  }

  await ensureMirrorRepo(token, mirrorRepo);

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

  const payload = {
    updatedAt: new Date().toISOString(),
    tickets,
    umrahPackages: umrah,
    tourPackages: tours,
    flyers,
  };

  const dir = mkdtempSync(join(tmpdir(), "inv-mirror-"));
  try {
    writeFileSync(join(dir, "public-inventory.json"), JSON.stringify(payload));
    writeFileSync(
      join(dir, "README.md"),
      "# travel-agency-inventory-cache\n\nPublic inventory JSON for flywithalqibla.com.\nNot connected to Vercel. Updated every ~5 minutes by Actions.\n"
    );
    git(dir, ["init"]);
    git(dir, ["checkout", "-b", "main"]);
    git(dir, ["config", "user.email", "github-actions[bot]@users.noreply.github.com"]);
    git(dir, ["config", "user.name", "github-actions[bot]"]);
    git(dir, ["add", "public-inventory.json", "README.md"]);
    git(dir, ["commit", "-m", `inventory mirror ${payload.updatedAt}`]);
    const remote = `https://x-access-token:${token}@github.com/${mirrorRepo}.git`;
    git(dir, ["remote", "add", "origin", remote]);
    git(dir, ["push", "-f", "origin", "main"]);
    console.log(
      JSON.stringify({
        ok: true,
        tickets: tickets.length,
        umrah: umrah.length,
        tours: tours.length,
        flyers: flyers.length,
        repo: mirrorRepo,
        branch: "main",
        url: `https://raw.githubusercontent.com/${mirrorRepo}/main/public-inventory.json`,
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
