/**
 * Cancel test/verify booking holds in Travel Line admin.
 * Targets bookings whose reservedBy or passenger names match test patterns.
 *
 * Run: npx tsx scripts/cancel-test-holds.ts
 * Dry run: npx tsx scripts/cancel-test-holds.ts --dry-run
 */
import { loadEnv } from "./load-env";
import { getTravelLineConfig } from "@/lib/travelline/env";
import { loginTravelLineViaPlaywright } from "@/lib/travelline/playwright-auth";
import { sessionToCookieHeader } from "@/lib/travelline/auth";

loadEnv();

const TEST_PATTERNS = [
  /production verify/i,
  /verify test/i,
  /al qibla test/i,
  /al qibla demo/i,
  /umrah probe/i,
  /demo live/i,
  /^VERIFY TEST$/i,
];

const TERMINAL_STATUSES = new Set(["CANCELLED", "CONFIRMED", "cancelled", "confirmed"]);

function collectSetCookies(headers: Headers): string[] {
  if (typeof headers.getSetCookie === "function") return headers.getSetCookie();
  const raw = headers.get("set-cookie");
  return raw ? [raw] : [];
}

function cookieHeader(headers: string[]): string {
  return headers.map((h) => h.split(";")[0]).join("; ");
}

async function loginHttp(base: string, username: string, password: string) {
  const csrfRes = await fetch(`${base}/api/auth/csrf`);
  const { csrfToken } = (await csrfRes.json()) as { csrfToken: string };
  const csrfCookies = collectSetCookies(csrfRes.headers);
  const body = new URLSearchParams({
    csrfToken,
    callbackUrl: `${base}/`,
    json: "true",
    phoneNumber: username,
    password,
  });
  const loginRes = await fetch(`${base}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: cookieHeader(csrfCookies),
    },
    body: body.toString(),
    redirect: "manual",
  });
  return cookieHeader([...csrfCookies, ...collectSetCookies(loginRes.headers)]);
}

function isTestBooking(booking: Record<string, unknown>, agentUsername: string): boolean {
  const phone = String(booking.agentContactNumber || "").replace(/\D/g, "");
  const agentDigits = agentUsername.replace(/\D/g, "");
  const haystack = [
    booking.reservedBy,
    booking.agentName,
    booking.customerName,
    booking.orderId,
    JSON.stringify(booking.passengers || []),
    JSON.stringify(booking),
  ]
    .filter(Boolean)
    .join(" ");

  if (phone && agentDigits && phone.endsWith(agentDigits.slice(-10))) {
    return TEST_PATTERNS.some((re) => re.test(haystack));
  }

  return TEST_PATTERNS.some((re) => re.test(haystack));
}

async function fetchBookings(cookie: string, adminUrl: string) {
  const res = await fetch(`${adminUrl}/api/bookings`, {
    headers: { Accept: "application/json", Cookie: cookie },
  });
  if (!res.ok) throw new Error(`List bookings failed: ${res.status}`);
  const data = (await res.json()) as { bookings?: Record<string, unknown>[] };
  return data.bookings || [];
}

async function cancelBooking(
  cookie: string,
  adminUrl: string,
  booking: Record<string, unknown>,
  dryRun: boolean
) {
  const ref = String(booking.orderId || booking._id || "unknown");
  if (!ref) return { ref, ok: false, error: "No booking ref" };

  if (dryRun) {
    console.log(`[dry-run] Would cancel ${ref}`);
    return { ref, ok: true, dryRun: true };
  }

  const res = await fetch(`${adminUrl}/api/bookings`, {
    method: "PUT",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Cookie: cookie,
    },
    body: JSON.stringify({ ...booking, status: "CANCELLED" }),
  });

  const text = await res.text();
  let json: Record<string, unknown> = {};
  try {
    json = JSON.parse(text) as Record<string, unknown>;
  } catch {
    /* ignore */
  }

  const inner = (json.body as Record<string, unknown> | undefined) || json;
  const ok = res.ok && (inner.status === 200 || inner.message || booking.status === "CANCELLED");

  if (ok || String(inner.message || "").toLowerCase().includes("cancel")) {
    console.log(`✓ Cancelled ${ref}`);
    return { ref, ok: true };
  }

  return { ref, ok: false, error: text.slice(0, 200) || "Cancel failed" };
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const { baseUrl, adminUrl, username, password } = getTravelLineConfig();

  let cookie = await loginHttp(baseUrl, username, password);
  let bookings = await fetchBookings(cookie, adminUrl).catch(() => []);

  if (!bookings.length) {
    const session = await loginTravelLineViaPlaywright();
    if (session) {
      cookie = sessionToCookieHeader(session);
      bookings = await fetchBookings(cookie, adminUrl);
    }
  }

  const testBookings = bookings.filter(
    (b) => isTestBooking(b, username) && !TERMINAL_STATUSES.has(String(b.status || ""))
  );
  console.log(`Found ${bookings.length} total bookings, ${testBookings.length} test holds to cancel`);

  if (!testBookings.length) {
    console.log("No test holds matched. Patterns:", TEST_PATTERNS.map(String));
    return;
  }

  const results = [];
  for (const booking of testBookings) {
    const ref = String(booking.orderId || booking._id || booking.id || "unknown");
    console.log(`\nProcessing ${ref}…`);
    results.push(await cancelBooking(cookie, adminUrl, booking, dryRun));
  }

  const cancelled = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok);
  console.log(`\nDone: ${cancelled} cancelled, ${failed.length} failed`);
  if (failed.length) {
    console.log("Failed:", failed);
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
