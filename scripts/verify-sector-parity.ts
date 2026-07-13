/**
 * Compare Travel Line live API sectors against mapped ticket output.
 * Run: npm run verify-sectors
 */
import { loadEnv } from "./load-env";
import { isOutboundGroupTicket, resolveAirport } from "@/lib/airport-codes";
import { getTravelLineConfig } from "@/lib/travelline/env";
import { ticketsFromGroupFlights, ticketsFromUmrahApiItems } from "@/lib/travelline/mappers";
import {
  fetchTravelLineGroupFlights,
  scrapeTravelLineTickets,
  scrapeTravelLineUmrahItems,
} from "@/lib/travelline/scraper";

loadEnv();

function collectSetCookies(headers: Headers): string[] {
  if (typeof headers.getSetCookie === "function") return headers.getSetCookie();
  const raw = headers.get("set-cookie");
  return raw ? [raw] : [];
}

function cookieHeader(headers: string[]): string {
  return headers.map((h) => h.split(";")[0]).join("; ");
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

async function main() {
  const { markupPercent } = getTravelLineConfig();
  const items = await scrapeTravelLineUmrahItems();
  const packageTickets = ticketsFromUmrahApiItems(items, markupPercent);

  const cookie = await loginViaHttp();
  const groupFlights = cookie ? await fetchTravelLineGroupFlights(cookie) : [];
  const groupTickets = ticketsFromGroupFlights(groupFlights, markupPercent);
  const merged = await scrapeTravelLineTickets();

  const wrongDirection = merged.filter((t) => !isOutboundGroupTicket(t.from, t.to));
  const packageMismatches: string[] = [];

  for (const item of items) {
    if (!item.departureSectorFrom || !item.departureSectorTo || !item.departureFlightNo) continue;
    const expectedFrom = resolveAirport(item.departureSectorFrom).code;
    const expectedTo = resolveAirport(item.departureSectorTo).code;
    const ticket = packageTickets.find((t) => t.externalId === `${item.id}-out`);
    if (!ticket) continue;
    if (ticket.from !== expectedFrom || ticket.to !== expectedTo) {
      packageMismatches.push(
        `${item.departureFlightNo} supplier ${expectedFrom}→${expectedTo} mapped ${ticket.from}→${ticket.to}`
      );
    }
  }

  const report = {
    at: new Date().toISOString(),
    umrahPackages: items.length,
    packageTickets: packageTickets.length,
    groupFlights: groupFlights.length,
    groupTickets: groupTickets.length,
    mergedTickets: merged.length,
    wrongDirection: wrongDirection.map(
      (t) => `${t.flightNumber} ${t.from}→${t.to} (${t.date}) id=${t.externalId}`
    ),
    packageMismatches,
    sampleOutbound: merged
      .filter((t) => t.from === "ISB" && t.to === "JED")
      .slice(0, 3)
      .map((t) => ({
        flight: t.flightNumber,
        route: `${t.from}→${t.to}`,
        date: t.date,
        price: t.price,
        seats: t.seatsLeft,
        source: t.tripType,
      })),
  };

  console.log(JSON.stringify(report, null, 2));

  if (wrongDirection.length || packageMismatches.length) {
    console.error("\nSector parity check FAILED.");
    process.exitCode = 1;
  } else {
    console.log("\nSector parity check PASSED.");
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
