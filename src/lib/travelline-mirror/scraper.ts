import fs from "fs";
import path from "path";
import { TRAVELLINE_GROUP_CATEGORIES } from "@/lib/travelline/categories";
import { getTravelLineConfig } from "@/lib/travelline/env";
import type { TravelLineGroupFlight, TravelLineUmrahApiItem } from "@/lib/travelline/mappers";
import type { TravelLineMirrorSnapshot } from "./types";

const SNAPSHOT_DIR = path.join(process.cwd(), "data", "travelline-mirror");
const SNAPSHOT_FILE = path.join(SNAPSHOT_DIR, "snapshot.json");

function collectSetCookies(headers: Headers): string[] {
  if (typeof headers.getSetCookie === "function") return headers.getSetCookie();
  const raw = headers.get("set-cookie");
  return raw ? [raw] : [];
}

function cookieHeader(headers: string[]): string {
  return headers.map((h) => h.split(";")[0]).join("; ");
}

async function login(): Promise<string | null> {
  const { baseUrl, username, password } = getTravelLineConfig();
  if (!username || !password) return null;

  const csrfRes = await fetch(`${baseUrl}/api/auth/csrf`);
  const { csrfToken } = (await csrfRes.json()) as { csrfToken: string };
  const csrfCookies = collectSetCookies(csrfRes.headers);
  const loginRes = await fetch(`${baseUrl}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: cookieHeader(csrfCookies),
    },
    body: new URLSearchParams({
      csrfToken,
      callbackUrl: `${baseUrl}/`,
      json: "true",
      phoneNumber: username,
      password,
    }).toString(),
    redirect: "manual",
  });

  const cookies = [...csrfCookies, ...collectSetCookies(loginRes.headers)];
  const cookie = cookieHeader(cookies);
  const sessionRes = await fetch(`${baseUrl}/api/auth/session`, {
    headers: { Accept: "application/json", Cookie: cookie },
  });
  const session = (await sessionRes.json()) as { user?: { companyId?: string } };
  return session.user?.companyId ? cookie : null;
}

export async function scrapeTravelLineMirror(): Promise<TravelLineMirrorSnapshot> {
  const { baseUrl } = getTravelLineConfig();

  const umrahRes = await fetch(`${baseUrl}/api/umrah-packages`, {
    headers: { Accept: "application/json" },
  });
  const umrahPackages = umrahRes.ok
    ? ((await umrahRes.json()) as TravelLineUmrahApiItem[])
    : [];

  const cookie = await login();
  const groups: Record<string, TravelLineGroupFlight[]> = {};

  if (cookie) {
    for (const category of TRAVELLINE_GROUP_CATEGORIES) {
      const res = await fetch(`${baseUrl}/api/groups?category=${encodeURIComponent(category)}`, {
        headers: { Accept: "application/json", Cookie: cookie },
      });
      if (!res.ok) {
        groups[category] = [];
        continue;
      }
      const data = (await res.json()) as { flights?: TravelLineGroupFlight[] };
      groups[category] = (data.flights || []).filter((f) => (f.availableSeats ?? 0) > 0);
    }
  }

  const byCategory: Record<string, number> = {};
  let totalFlights = 0;
  for (const [cat, flights] of Object.entries(groups)) {
    byCategory[cat] = flights.length;
    totalFlights += flights.length;
  }

  return {
    scrapedAt: new Date().toISOString(),
    baseUrl,
    sessionOk: Boolean(cookie),
    umrahPackages,
    groups,
    counts: {
      umrahPackages: umrahPackages.length,
      byCategory,
      totalFlights,
    },
  };
}

export function saveMirrorSnapshot(snapshot: TravelLineMirrorSnapshot): string {
  fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
  fs.writeFileSync(SNAPSHOT_FILE, JSON.stringify(snapshot, null, 2), "utf8");
  return SNAPSHOT_FILE;
}

export function loadMirrorSnapshot(): TravelLineMirrorSnapshot | null {
  try {
    if (!fs.existsSync(SNAPSHOT_FILE)) return null;
    return JSON.parse(fs.readFileSync(SNAPSHOT_FILE, "utf8")) as TravelLineMirrorSnapshot;
  } catch {
    return null;
  }
}

export async function scrapeAndSaveMirror(): Promise<TravelLineMirrorSnapshot> {
  const snapshot = await scrapeTravelLineMirror();
  saveMirrorSnapshot(snapshot);
  return snapshot;
}
