import { getTravelLineConfig } from "./env";
import { extractUmrahItemsFromHtml, extractUmrahItemsFromJsonText } from "./extractors";
import {
  ticketsFromGroupFlights,
  ticketsFromUmrahApiItems,
  type TravelLineGroupFlight,
  type TravelLineUmrahApiItem,
} from "./mappers";
import type { NormalizedTicket } from "@/lib/tickets/providers/types";

const SCRAPER_PATHS = ["/", "/explore", "/login"] as const;
const GROUP_CATEGORIES = ["Umrah Groups", "K S A Oneway Groups", "U A E Oneway Groups"] as const;

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

async function loginViaHttp(): Promise<string | null> {
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

export async function fetchTravelLineGroupFlights(cookie: string): Promise<TravelLineGroupFlight[]> {
  const { baseUrl } = getTravelLineConfig();
  const flights: TravelLineGroupFlight[] = [];

  for (const category of GROUP_CATEGORIES) {
    const res = await fetch(`${baseUrl}/api/groups?category=${encodeURIComponent(category)}`, {
      headers: { Accept: "application/json", Cookie: cookie },
    });
    if (!res.ok) continue;
    const data = (await res.json()) as { flights?: TravelLineGroupFlight[] };
    for (const flight of data.flights || []) {
      if ((flight.availableSeats ?? 0) > 0) flights.push(flight);
    }
  }

  return flights;
}

async function tryPortalLogin(page: { goto: Function; locator: Function; waitForTimeout: Function }) {
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

  const { chromium } = await loadPlaywright();
  const browser = await chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    });
    const page = await context.newPage();
    let intercepted: TravelLineUmrahApiItem[] = [];

    page.on("response", async (response: { url: Function; text: Function }) => {
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

    throw new Error("Travel Line scraper could not extract package inventory");
  } finally {
    await browser.close();
  }
}

function dedupeTickets(tickets: NormalizedTicket[]): NormalizedTicket[] {
  const seen = new Map<string, NormalizedTicket>();

  for (const ticket of tickets) {
    const key = `${ticket.flightNumber}-${ticket.date}-${ticket.from}-${ticket.to}`;
    const existing = seen.get(key);
    if (!existing || ticket.seatsLeft > existing.seatsLeft) {
      seen.set(key, ticket);
    }
  }

  return Array.from(seen.values()).sort(
    (a, b) => b.date.localeCompare(a.date) || a.departureTime.localeCompare(b.departureTime)
  );
}

export async function scrapeTravelLineTickets(): Promise<NormalizedTicket[]> {
  const { markupPercent } = getTravelLineConfig();
  const items = await scrapeTravelLineUmrahItems();
  const packageTickets = ticketsFromUmrahApiItems(items, markupPercent);

  const cookie = await loginViaHttp();
  if (!cookie) return packageTickets;

  const groupFlights = await fetchTravelLineGroupFlights(cookie);
  const groupTickets = ticketsFromGroupFlights(groupFlights, markupPercent);

  return dedupeTickets([...groupTickets, ...packageTickets]);
}
