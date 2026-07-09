/**
 * Live demo: Travel Line agent login → pick group flight → place RESERVED hold.
 * Run: npm run demo-booking
 */
import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { randomUUID } from "crypto";
import { loadEnv } from "./load-env";
import { getTravelLineConfig } from "@/lib/travelline/env";
import { fetchTravelLineGroupFlights } from "@/lib/travelline/scraper";
import { ticketsFromGroupFlights } from "@/lib/travelline/mappers";

loadEnv();

function log(step: number, message: string, detail?: unknown) {
  console.log(`\n[Step ${step}] ${message}`);
  if (detail !== undefined) console.log(typeof detail === "string" ? detail : JSON.stringify(detail, null, 2));
}

function collectSetCookies(headers: Headers): string[] {
  if (typeof headers.getSetCookie === "function") return headers.getSetCookie();
  const raw = headers.get("set-cookie");
  return raw ? [raw] : [];
}

function cookieHeader(headers: string[]): string {
  return headers.map((header) => header.split(";")[0]).join("; ");
}

async function login() {
  const { baseUrl, username, password } = getTravelLineConfig();
  log(1, "Fetching CSRF token from Travel Line portal", baseUrl);
  const csrfRes = await fetch(`${baseUrl}/api/auth/csrf`);
  const { csrfToken } = (await csrfRes.json()) as { csrfToken: string };
  const csrfCookies = collectSetCookies(csrfRes.headers);

  log(2, "Logging in as agent", { username });
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
  const session = (await sessionRes.json()) as {
    user?: { companyId?: string; agentName?: string };
  };

  if (!session.user?.companyId) {
    throw new Error("Agent login failed — check TRAVELLINE_AGENT_USERNAME/PASSWORD");
  }

  log(3, "Agent session established", {
    companyId: session.user.companyId,
    agentName: session.user.agentName,
  });

  return { cookie, user: session.user, baseUrl, username };
}

function passenger(index: number) {
  return {
    id: randomUUID(),
    givenName: `AL QIBLA DEMO ${index}`,
    surname: "TEST",
    dob: "1990-01-01",
    passportNo: `AB123456${index}`,
    nationality: "PK",
    passportDOE: "2030-01-01",
    type: "adult",
    title: "MR",
    passengerId: randomUUID(),
    remarks: "00",
  };
}

async function main() {
  const outputDir = join(process.cwd(), "tmp", "booking-demo");
  mkdirSync(outputDir, { recursive: true });

  const { cookie, user, baseUrl, username } = await login();

  log(4, "Fetching live group flights from Travel Line");
  const groups = await fetchTravelLineGroupFlights(cookie);
  const tickets = ticketsFromGroupFlights(groups);
  writeFileSync(join(outputDir, "inventory.json"), JSON.stringify(tickets.slice(0, 10), null, 2));

  const pick = tickets.find((t) => t.seatsLeft > 0 && t.from && t.to);
  if (!pick) throw new Error("No bookable group flights found");

  log(5, "Selected flight for live hold", {
    groupId: pick.externalId,
    route: `${pick.from} (${pick.fromCity}) → ${pick.to} (${pick.toCity})`,
    flight: `${pick.airline} ${pick.flightNumber}`,
    date: pick.date,
    seats: pick.seatsLeft,
    price: pick.price,
  });

  const payload = {
    companyId: user.companyId,
    agentContactNumber: username,
    reservedBy: user.agentName || "Al Qibla Agent",
    groupId: pick.externalId,
    passengers: [passenger(1)],
  };

  log(6, "POST /api/booking — placing RESERVED hold on Travel Line", payload);
  const res = await fetch(`${baseUrl}/api/booking`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Cookie: cookie,
    },
    body: JSON.stringify(payload),
  });

  const json = await res.json().catch(() => ({}));
  writeFileSync(join(outputDir, "booking-response.json"), JSON.stringify({ status: res.status, json }, null, 2));

  log(7, res.ok ? "Hold placed successfully" : "Hold failed", {
    httpStatus: res.status,
    bookingRef: (json as { orderId?: string }).orderId || null,
    status: (json as { status?: string }).status || null,
    message: (json as { message?: string }).message || null,
  });

  console.log(`\nDemo artifacts saved to ${outputDir}`);
  console.log("Cancel this test hold in the Travel Line admin portal when done.\n");

  if (!res.ok) process.exit(1);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
