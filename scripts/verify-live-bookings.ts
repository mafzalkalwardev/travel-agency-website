import { randomUUID } from "crypto";
import { loadEnv } from "./load-env";
import { getTravelLineConfig } from "@/lib/travelline/env";

loadEnv();

type GroupFlight = {
  _id: string;
  availableSeats?: number;
  fares?: { salePrice?: number };
  itineraries?: Array<{ segments?: Array<{ flightNumber?: string; airline?: { carrierName?: string } }> }>;
  groupCategory?: string;
};

function collectSetCookies(headers: Headers): string[] {
  if (typeof headers.getSetCookie === "function") return headers.getSetCookie();
  const raw = headers.get("set-cookie");
  return raw ? [raw] : [];
}

function cookieHeader(headers: string[]): string {
  return headers.map((h) => h.split(";")[0]).join("; ");
}

async function login(base: string, username: string, password: string) {
  const csrfRes = await fetch(`${base}/api/auth/csrf`);
  const { csrfToken } = (await csrfRes.json()) as { csrfToken: string };
  const csrfCookies = collectSetCookies(csrfRes.headers);
  const loginRes = await fetch(`${base}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: cookieHeader(csrfCookies),
    },
    body: new URLSearchParams({
      csrfToken,
      callbackUrl: `${base}/`,
      json: "true",
      phoneNumber: username,
      password,
    }).toString(),
    redirect: "manual",
  });
  const cookie = cookieHeader([...csrfCookies, ...collectSetCookies(loginRes.headers)]);
  const sessionRes = await fetch(`${base}/api/auth/session`, {
    headers: { Accept: "application/json", Cookie: cookie },
  });
  const session = (await sessionRes.json()) as { user?: { companyId?: string; agentName?: string } };
  return { cookie, user: session.user };
}

function passenger(index: number) {
  return {
    id: randomUUID(),
    givenName: `AL QIBLA ${index}`,
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
  const { baseUrl, username, password } = getTravelLineConfig();
  const { cookie, user } = await login(baseUrl, username, password);
  if (!user?.companyId) throw new Error("Travel Line login failed");

  const pool: GroupFlight[] = [];
  for (const category of ["K S A Oneway Groups", "U A E Oneway Groups", "Umrah Groups"]) {
    const res = await fetch(`${baseUrl}/api/groups?category=${encodeURIComponent(category)}`, {
      headers: { Accept: "application/json", Cookie: cookie },
    });
    const data = (await res.json()) as { flights?: GroupFlight[] };
    for (const flight of data.flights || []) {
      if ((flight.availableSeats ?? 0) > 0) pool.push(flight);
    }
  }

  const results = [];
  const used = new Set<string>();
  let attempt = 0;

  for (const group of pool) {
    if (results.filter((item) => item.success).length >= 5) break;
    if (used.has(group._id)) continue;
    used.add(group._id);
    attempt += 1;

    const payload = {
      companyId: user.companyId,
      agentContactNumber: username,
      reservedBy: user.agentName || "AKRAM ULLAH",
      groupId: group._id,
      passengers: [passenger(attempt)],
    };

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
    const segment = group.itineraries?.[0]?.segments?.[0];
    results.push({
      groupId: group._id,
      category: group.groupCategory,
      airline: segment?.airline?.carrierName,
      flightNumber: segment?.flightNumber,
      seatsAvailable: group.availableSeats,
      success: res.ok,
      bookingRef: (json as { orderId?: string }).orderId || null,
      status: (json as { status?: string }).status || null,
      error: res.ok ? null : (json as { message?: string }).message || `HTTP ${res.status}`,
    });
  }

  console.log(JSON.stringify({ tested: results.length, results }, null, 2));
  const successes = results.filter((item) => item.success).length;
  console.log(`\nSummary: ${successes}/${results.length} live holds placed (target 5).`);
  if (successes < 5) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
