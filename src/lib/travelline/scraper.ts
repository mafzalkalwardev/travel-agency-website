import { getTravelLineConfig } from "./env";
import { extractUmrahItemsFromHtml, extractUmrahItemsFromJsonText } from "./extractors";
import {
  ticketsFromGroupFlights,
  type TravelLineGroupFlight,
  type TravelLineUmrahApiItem,
} from "./mappers";
import { TRAVELLINE_GROUP_CATEGORIES } from "./categories";
import type { NormalizedTicket } from "@/lib/tickets/providers/types";
import type { Page, Response } from "playwright";

const SCRAPER_PATHS = ["/", "/explore", "/login"] as const;

async function loadPlaywright() {
  try {
    return await import("playwright");
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? `Playwright runtime unavailable: ${error.message}`
        : "Playwright runtime unavailable"
    );
  }
}

function collectSetCookies(headers: Headers): string[] {
  if (typeof headers.getSetCookie === "function") return headers.getSetCookie();
  const raw = headers.get("set-cookie");
  return raw ? [raw] : [];
}

function cookieHeader(headers: string[]): string {
  return headers.map((header) => header.split(";")[0]).join("; ");
}

export async function loginViaHttp(): Promise<string | null> {
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

export interface TravelLineLiveCategory {
  name: string;
  imageUrl?: string;
  availableGroupsCount?: number;
}

/** TravelLine's own category list — see docs/REDESIGN.md §3.6. */
export async function fetchLiveCategories(cookie: string): Promise<TravelLineLiveCategory[]> {
  const { baseUrl } = getTravelLineConfig();
  const res = await fetch(`${baseUrl}/api/categories`, {
    headers: { Accept: "application/json", Cookie: cookie },
  });
  if (!res.ok) return [];
  const data = (await res.json()) as TravelLineLiveCategory[];
  return Array.isArray(data) ? data : [];
}

function buildCategoryImageMap(categories: TravelLineLiveCategory[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const c of categories) {
    if (c.name && c.imageUrl) map[c.name] = c.imageUrl;
  }
  return map;
}

/**
 * Fetches every known category in parallel rather than sequentially — with
 * 5 categories (KSA alone has 250+ flights), the sequential loop this
 * replaced was a major contributor to sync runs exceeding Vercel's 120s
 * function timeout once inventory grew. See docs/REDESIGN.md §7.
 */
export async function fetchTravelLineGroupFlights(cookie: string): Promise<TravelLineGroupFlight[]> {
  const { baseUrl } = getTravelLineConfig();

  const perCategory = await Promise.all(
    TRAVELLINE_GROUP_CATEGORIES.map(async (category) => {
      try {
        const res = await fetch(`${baseUrl}/api/groups?category=${encodeURIComponent(category)}`, {
          headers: { Accept: "application/json", Cookie: cookie },
        });
        if (!res.ok) return [];
        const data = (await res.json()) as { flights?: TravelLineGroupFlight[] };
        return (data.flights || [])
          .filter((flight) => (flight.availableSeats ?? 0) > 0)
          .map((flight) => ({ ...flight, groupCategory: flight.groupCategory || category }));
      } catch {
        return [];
      }
    })
  );

  return perCategory.flat();
}

async function tryPortalLogin(page: Page) {
  const { baseUrl, adminUrl, username, password } = getTravelLineConfig();
  if (!username || !password) return;

  for (const url of [`${baseUrl}/login`, `${adminUrl}/signin`, `${adminUrl}/login`]) {
    try {
      await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
      const phoneSelectors = [
        'input[type="tel"]',
        'input[name*="phone" i]',
        'input[name*="user" i]',
        'input[name*="email" i]',
        'input[type="text"]',
      ];

      let filled = false;
      for (const selector of phoneSelectors) {
        const field = page.locator(selector).first();
        if ((await field.count()) > 0) {
          await field.fill(username);
          filled = true;
          break;
        }
      }

      const passwordField = page.locator('input[type="password"]').first();
      if (!filled || (await passwordField.count()) === 0) continue;

      await passwordField.fill(password);
      const submit = page
        .locator('button[type="submit"], input[type="submit"], button:has-text("Sign"), button:has-text("Login")')
        .first();
      if ((await submit.count()) === 0) continue;

      await Promise.all([
        page.waitForTimeout(3000),
        submit.click().catch(() => null),
      ]);
      return;
    } catch {
      /* try next URL */
    }
  }
}

export async function scrapeTravelLineUmrahItems(): Promise<TravelLineUmrahApiItem[]> {
  const { baseUrl } = getTravelLineConfig();

  try {
    const res = await fetch(`${baseUrl}/api/umrah-packages`, {
      headers: { Accept: "application/json" },
    });
    if (res.ok) {
      const data = await res.json();
      const items = extractUmrahItemsFromJsonText(JSON.stringify(data));
      if (items.length) return items;
    }
  } catch {
    /* fall through to Playwright */
  }

  // Vercel serverless does not ship Playwright browser binaries. Falling back
  // there turns an otherwise healthy HTTP sync into a runtime module failure.
  if (process.env.VERCEL === "1") {
    throw new Error("supplier package API returned no usable inventory");
  }

  const { chromium } = await loadPlaywright();
  const browser = await chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    });
    const page = await context.newPage();
    let intercepted: TravelLineUmrahApiItem[] = [];

    page.on("response", async (response: Response) => {
      const url = String(response.url());
      if (!url.includes("/api/umrah-packages")) return;
      try {
        const text = await response.text();
        const items = extractUmrahItemsFromJsonText(text);
        if (items.length) intercepted = items;
      } catch {
        /* ignore malformed payload */
      }
    });

    await tryPortalLogin(page);

    for (const path of SCRAPER_PATHS) {
      try {
        await page.goto(`${baseUrl}${path}`, { waitUntil: "networkidle", timeout: 60000 });
        await page.waitForTimeout(2500);
        if (intercepted.length) return intercepted;

        const html = await page.content();
        const htmlItems = extractUmrahItemsFromHtml(html);
        if (htmlItems.length) return htmlItems;
      } catch {
        /* try next path */
      }
    }

    await page.goto(`${baseUrl}/api/umrah-packages`, { waitUntil: "networkidle", timeout: 60000 });
    const text = await page.locator("body").innerText();
    const apiItems = extractUmrahItemsFromJsonText(text);
    if (apiItems.length) return apiItems;

    throw new Error("supplier scraper could not extract package inventory");
  } finally {
    await browser.close();
  }
}

function dedupeTickets(tickets: NormalizedTicket[]): NormalizedTicket[] {
  const seen = new Map<string, NormalizedTicket>();

  for (const ticket of tickets) {
    seen.set(ticket.externalId, ticket);
  }

  return Array.from(seen.values()).sort(
    (a, b) => b.date.localeCompare(a.date) || a.departureTime.localeCompare(b.departureTime)
  );
}

export interface TravelLineTicketScrapeResult {
  tickets: NormalizedTicket[];
  categories: TravelLineLiveCategory[];
}

/**
 * Group flights only — Umrah packages are synced separately via package
 * sync. Logs in once and reuses that session for both the group-flight
 * fetch and the categories fetch (used for ticket imagery and category
 * discovery) rather than logging in twice per sync — a second login here
 * previously pushed sync past Vercel's function timeout.
 */
export async function scrapeTravelLineTicketsWithCategories(): Promise<TravelLineTicketScrapeResult> {
  const { markupPercent } = getTravelLineConfig();
  const cookie = await loginViaHttp();
  if (!cookie) return { tickets: [], categories: [] };

  const [groupFlights, categories] = await Promise.all([
    fetchTravelLineGroupFlights(cookie),
    fetchLiveCategories(cookie).catch(() => []),
  ]);
  const categoryImageMap = buildCategoryImageMap(categories);
  const tickets = dedupeTickets(ticketsFromGroupFlights(groupFlights, markupPercent, categoryImageMap));
  return { tickets, categories };
}

/** Group flights only. Thin wrapper for callers that only need tickets. */
export async function scrapeTravelLineTickets(): Promise<NormalizedTicket[]> {
  return (await scrapeTravelLineTicketsWithCategories()).tickets;
}
