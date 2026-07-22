import { randomUUID } from "crypto";
import { getTravelLineConfig } from "./env";
import {
  loadSession,
  mergeCookies,
  parseSetCookieHeaders,
  saveSession,
  sessionToCookieHeader,
} from "./auth";
import {
  announcementsFromUmrahItems,
  mapTravelLineUmrahApiItem,
} from "./mappers";
import type { TravelLineUmrahApiItem } from "./mappers";
import type {
  TravelLineBookingInput,
  TravelLineBookingResult,
  TravelLineFetchResult,
  TravelLinePackageFetchResult,
  TravelLineSession,
} from "./types";
import { resolveTravelLinePackageId, isTravelLineGroupId } from "./resolve-package-id";
import { TRAVELLINE_GROUP_CATEGORIES } from "./categories";
import { matchGroupFlightToPackage } from "./resolve-group-id";
import type { TravelLineGroupFlight } from "./mappers";
import { loginTravelLineViaPlaywright } from "./playwright-auth";

const UMRANH_PACKAGES_PATH = "/api/umrah-packages";
const BOOKING_PATH = "/api/booking";

function collectSetCookies(headers: Headers): string[] {
  if (typeof headers.getSetCookie === "function") {
    return headers.getSetCookie();
  }
  const raw = headers.get("set-cookie");
  return raw ? [raw] : [];
}

function cookiesFromSetCookieHeaders(headers: string[]): TravelLineSession["cookies"] {
  const parsed: TravelLineSession["cookies"] = [];
  for (const header of headers) {
    parsed.push(...parseSetCookieHeaders(header));
  }
  return parsed;
}

function hasSessionToken(session: TravelLineSession): boolean {
  return session.cookies.some((cookie) => cookie.name.includes("session-token"));
}

interface SessionUser {
  companyId?: string;
  agentName?: string;
  phoneNumber?: string;
}

function buildPassenger(details: Record<string, unknown>) {
  const names = String(details.names || "Al Qibla Test");
  const parts = names.trim().split(/\s+/);
  const givenName = parts.slice(0, -1).join(" ") || parts[0] || "Al Qibla";
  const surname = parts.length > 1 ? parts[parts.length - 1] : "Test";

  return {
    id: randomUUID(),
    givenName: givenName.toUpperCase(),
    surname: surname.toUpperCase(),
    dob: String(details.dob || "1990-01-01"),
    passportNo: String(details.passportNo || "AB1234567"),
    nationality: String(details.nationality || "PK"),
    passportDOE: String(details.passportDOE || "2030-01-01"),
    type: "adult",
    title: "MR",
    passengerId: randomUUID(),
    remarks: String(details.remarks || "00"),
  };
}

export class TravelLineClient {
  private config = getTravelLineConfig();
  private session: TravelLineSession | null = null;
  private sessionUser: SessionUser | null = null;
  private umrahCache: TravelLineUmrahApiItem[] | null = null;

  async fetchUmrahApiItems(): Promise<TravelLineUmrahApiItem[]> {
    if (this.umrahCache) return this.umrahCache;
    const res = await fetch(`${this.config.baseUrl}${UMRANH_PACKAGES_PATH}`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 0 },
    });
    if (!res.ok) throw new Error(`Supplier package API returned ${res.status}`);
    const data = await res.json();
    const { extractUmrahItemsFromJsonText } = await import("./extractors");
    const items = Array.isArray(data)
      ? (data as TravelLineUmrahApiItem[])
      : extractUmrahItemsFromJsonText(JSON.stringify(data));
    if (!items.length) throw new Error("Supplier package API returned no usable inventory");
    this.umrahCache = items;
    return items;
  }

  async fetchTickets(): Promise<TravelLineFetchResult> {
    const { scrapeTravelLineTickets } = await import("./scraper");
    const tickets = await scrapeTravelLineTickets();
    return { tickets, rawTickets: [] };
  }

  async fetchPackages(): Promise<TravelLinePackageFetchResult> {
    const items = await this.fetchUmrahApiItems();
    const umrah = items.map((i) => mapTravelLineUmrahApiItem(i, this.config.markupPercent));
    const promos = announcementsFromUmrahItems(items).map((a) => ({
      id: a.source_external_id,
      title: a.message,
      message: a.message,
      active: a.active,
    }));
    return { umrah, tours: [], promos };
  }

  private async validateSession(session: TravelLineSession, base: string): Promise<SessionUser | null> {
    if (!hasSessionToken(session)) return null;
    try {
      const res = await fetch(`${base}/api/auth/session`, {
        headers: {
          Accept: "application/json",
          Cookie: sessionToCookieHeader(session),
        },
      });
      if (!res.ok) return null;
      const data = (await res.json()) as { user?: SessionUser };
      return data.user || null;
    } catch {
      return null;
    }
  }

  async ensureSession(): Promise<TravelLineSession | null> {
    try {
      if (this.session && hasSessionToken(this.session)) {
        const user = await this.validateSession(this.session, this.config.baseUrl);
        if (user) {
          this.sessionUser = user;
          return this.session;
        }
        this.session = null;
        this.sessionUser = null;
      }

      const cached = await loadSession();
      if (cached && hasSessionToken(cached)) {
        const user = await this.validateSession(cached, this.config.baseUrl);
        if (user) {
          this.session = cached;
          this.sessionUser = user;
          return this.session;
        }
      }

      this.session = await this.loginNextAuth();
      if (!this.session) {
        this.session = await loginTravelLineViaPlaywright();
      }
      if (this.session) {
        this.sessionUser = await this.validateSession(this.session, this.config.baseUrl);
        await saveSession(this.session);
      }
      return this.session;
    } catch {
      return null;
    }
  }

  private async loginNextAuth(): Promise<TravelLineSession | null> {
    const { username, password } = this.config;

    for (const base of [this.config.baseUrl, this.config.adminUrl]) {
      try {
        const csrfRes = await fetch(`${base}/api/auth/csrf`);
        if (!csrfRes.ok) continue;
        const { csrfToken } = (await csrfRes.json()) as { csrfToken: string };
        const csrfCookies = collectSetCookies(csrfRes.headers);

        const fields: Record<string, string> = {
          csrfToken,
          callbackUrl: `${base}/`,
          json: "true",
          phoneNumber: username,
          phone: username,
          password,
          username,
          email: username,
        };

        const loginRes = await fetch(`${base}/api/auth/callback/credentials`, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Cookie: csrfCookies.map((c) => c.split(";")[0]).join("; "),
          },
          body: new URLSearchParams(fields).toString(),
          redirect: "manual",
        });

        const cookies = mergeCookies(
          cookiesFromSetCookieHeaders(csrfCookies),
          cookiesFromSetCookieHeaders(collectSetCookies(loginRes.headers))
        );

        if (hasSessionToken({ cookies }) && loginRes.status < 400) {
          const body = await loginRes.text().catch(() => "");
          if (body.includes("Authentication failed") || body.includes("error=Authentication")) {
            continue;
          }
          return {
            cookies,
            expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
          };
        }
      } catch {
        /* try next base */
      }
    }
    return null;
  }

  private async resolveGroupId(externalProductId: string): Promise<string | null> {
    const packageId = resolveTravelLinePackageId(externalProductId);
    const items = await this.fetchUmrahApiItems();
    const pkg = items.find((item) => item.id === packageId);
    if (!pkg) return null;

    const session = await this.ensureSession();
    if (!session) return null;

    const flights: TravelLineGroupFlight[] = [];
    for (const category of TRAVELLINE_GROUP_CATEGORIES) {
      const groupsRes = await fetch(
        `${this.config.baseUrl}/api/groups?category=${encodeURIComponent(category)}`,
        {
          headers: {
            Accept: "application/json",
            Cookie: sessionToCookieHeader(session),
          },
        }
      );
      if (!groupsRes.ok) continue;
      const groups = (await groupsRes.json()) as { flights?: TravelLineGroupFlight[] };
      flights.push(...(groups.flights || []));
    }

    const match = matchGroupFlightToPackage(flights, pkg);
    return match?._id || null;
  }

  async createBooking(input: TravelLineBookingInput): Promise<TravelLineBookingResult> {
    const session = await this.ensureSession();
    if (!session || !this.sessionUser?.companyId) {
      return {
        success: false,
        error: "Supplier login unavailable - booking saved locally; retry from admin",
      };
    }

    const packageId = resolveTravelLinePackageId(input.externalProductId);
    const groupId = isTravelLineGroupId(input.externalProductId)
      ? input.externalProductId
      : await this.resolveGroupId(input.externalProductId);

    if (!groupId) {
      const items = await this.fetchUmrahApiItems();
      const pkg = items.find((item) => item.id === packageId);
      let umrahErr: unknown;

      if (pkg?.slug) {
        const umrahPayload = {
          companyId: this.sessionUser.companyId,
          packageId: pkg.id,
          adult: input.passengers,
          child: 0,
          infant: 0,
          pricingOption: "sharing",
          agentContactNumber: this.config.username,
          reservedBy: this.sessionUser.agentName || "Al Qibla Agent",
          saleFare: input.quotedPrice,
          passengers: Array.from({ length: input.passengers }, () =>
            buildPassenger(input.passengerDetails)
          ),
        };

        const umrahRes = await fetch(
          `${this.config.baseUrl}/api/umrah-packages/${pkg.slug}/book`,
          {
            method: "POST",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              Cookie: sessionToCookieHeader(session),
            },
            body: JSON.stringify(umrahPayload),
          }
        );
        const umrahJson = await umrahRes.json().catch(() => ({}));
        if (umrahRes.ok) {
          const ref =
            (umrahJson as Record<string, unknown>).orderId ||
            (umrahJson as Record<string, unknown>).bookingRef ||
            (umrahJson as Record<string, unknown>)._id ||
            `TL-${packageId}`;
          return { success: true, bookingRef: String(ref), raw: umrahJson };
        }

        umrahErr =
          (umrahJson as Record<string, unknown>).message ||
          (umrahJson as Record<string, unknown>).error;
      }

      return {
        success: false,
        error:
          typeof umrahErr === "string"
            ? `Umrah package hold failed: ${umrahErr}`
            : "Could not resolve Travel Line group flight for booking",
      };
    }

    const payload = {
      companyId: this.sessionUser.companyId,
      agentContactNumber: this.config.username,
      reservedBy: this.sessionUser.agentName || "Al Qibla Agent",
      groupId,
      passengers: Array.from({ length: input.passengers }, () =>
        buildPassenger(input.passengerDetails)
      ),
    };

    const res = await fetch(`${this.config.baseUrl}${BOOKING_PATH}`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Cookie: sessionToCookieHeader(session),
      },
      body: JSON.stringify(payload),
    });

    const json = await res.json().catch(() => ({}));
    if (res.ok) {
      const ref =
        (json as Record<string, unknown>).orderId ||
        (json as Record<string, unknown>).bookingRef ||
        (json as Record<string, unknown>)._id ||
        `TL-${groupId}`;
      return { success: true, bookingRef: String(ref), raw: json };
    }

    const errMsg =
      (json as Record<string, unknown>).message ||
      (json as Record<string, unknown>).error ||
      `Supplier returned ${res.status}`;
    return { success: false, error: String(errMsg), raw: json };
  }

  /**
   * List agency bookings from Travel Line (admin or public booking APIs).
   * Used to sync RESERVED/CONFIRMED/CANCELLED and to PUT status updates.
   */
  async listBookings(): Promise<Record<string, unknown>[]> {
    const session = await this.ensureSession();
    if (!session) return [];

    const cookie = sessionToCookieHeader(session);
    const endpoints = [
      `${this.config.adminUrl}/api/bookings`,
      `${this.config.baseUrl}/api/booking?limit=200`,
      `${this.config.baseUrl}/api/bookings`,
    ];

    for (const url of endpoints) {
      try {
        const res = await fetch(url, {
          headers: { Accept: "application/json", Cookie: cookie },
        });
        if (!res.ok) continue;
        const data = (await res.json()) as
          | { bookings?: Record<string, unknown>[] }
          | Record<string, unknown>[];
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data.bookings)
            ? data.bookings
            : [];
        if (list.length) return list;
      } catch {
        /* try next */
      }
    }
    return [];
  }

  async findBooking(orderRef: string): Promise<Record<string, unknown> | null> {
    const needle = orderRef.trim().toLowerCase();
    if (!needle) return null;
    const bookings = await this.listBookings();
    return (
      bookings.find((b) => {
        const candidates = [b.orderId, b.bookingRef, b._id, b.id]
          .filter(Boolean)
          .map((v) => String(v).toLowerCase());
        return candidates.includes(needle);
      }) || null
    );
  }

  /**
   * Confirm or cancel a Travel Line hold (PUT /api/bookings with status).
   * Same mechanism used by scripts/cancel-test-holds.ts for CANCELLED.
   */
  async updateBookingStatus(
    orderRef: string,
    status: "CONFIRMED" | "CANCELLED"
  ): Promise<{ ok: boolean; booking?: Record<string, unknown>; error?: string; raw?: unknown }> {
    const session = await this.ensureSession();
    if (!session) {
      return { ok: false, error: "Supplier login unavailable" };
    }

    const existing = await this.findBooking(orderRef);
    if (!existing) {
      return { ok: false, error: `Travel Line booking not found for ${orderRef}` };
    }

    const current = String(existing.status || "").toUpperCase();
    if (current === status) {
      return { ok: true, booking: existing };
    }
    if (current === "CANCELLED" && status === "CONFIRMED") {
      return { ok: false, error: "Travel Line booking is already cancelled", booking: existing };
    }

    const cookie = sessionToCookieHeader(session);
    const payload = { ...existing, status };
    const endpoints = [
      `${this.config.adminUrl}/api/bookings`,
      `${this.config.baseUrl}/api/bookings`,
      `${this.config.baseUrl}/api/booking`,
    ];

    let lastError = "Supplier status update failed";
    for (const url of endpoints) {
      try {
        const res = await fetch(url, {
          method: "PUT",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Cookie: cookie,
          },
          body: JSON.stringify(payload),
        });
        const text = await res.text();
        let json: Record<string, unknown> = {};
        try {
          json = JSON.parse(text) as Record<string, unknown>;
        } catch {
          /* ignore */
        }

        if (!res.ok) {
          lastError =
            String(json.message || json.error || text.slice(0, 160) || `HTTP ${res.status}`);
          continue;
        }

        const refreshed = (await this.findBooking(orderRef)) || {
          ...existing,
          status,
        };
        const next = String(refreshed.status || status).toUpperCase();
        if (next === status || next.includes(status)) {
          return { ok: true, booking: refreshed, raw: json };
        }

        // Some APIs wrap OK in body.status / message without updating list immediately
        const inner = (json.body as Record<string, unknown> | undefined) || json;
        if (
          Number(inner.status) === 200 ||
          String(inner.message || "").toLowerCase().includes("success") ||
          String(inner.status || "").toUpperCase() === status
        ) {
          return { ok: true, booking: { ...existing, status }, raw: json };
        }

        lastError = `Travel Line still reports ${next || "unknown"} after update`;
      } catch (err) {
        lastError = err instanceof Error ? err.message : "Supplier request failed";
      }
    }

    return { ok: false, error: lastError, booking: existing || undefined };
  }
}

let clientInstance: TravelLineClient | null = null;

export function getTravelLineClient(): TravelLineClient {
  if (!clientInstance) clientInstance = new TravelLineClient();
  return clientInstance;
}
