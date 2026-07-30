import type { Booking } from "@/types";

/** Travel Line holds were observed at ~1 hour (docs/REDESIGN.md §3.7). */
export const DEFAULT_HOLD_MINUTES = 60;
/** Warn admin this many minutes before expiry. */
export const HOLD_WARN_WITHIN_MINUTES = 20;

function parseMaybeDate(value: unknown): Date | null {
  if (!value) return null;
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Resolve when a supplier hold is expected to expire.
 * Prefers Travel Line `expired_at` from stored response, else hold time + 60m.
 */
export function getHoldExpiresAt(booking: {
  created_at: string;
  updated_at?: string;
  supplier_hold_status?: string | null;
  travelline_response?: unknown;
  hold_expires_at?: string | null;
}): Date | null {
  if (booking.supplier_hold_status !== "held") return null;

  if (booking.hold_expires_at) {
    return parseMaybeDate(booking.hold_expires_at);
  }

  const raw = booking.travelline_response;
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    const fromTl =
      parseMaybeDate(obj.expired_at) ||
      parseMaybeDate(obj.expiredAt) ||
      parseMaybeDate(obj.expires_at) ||
      parseMaybeDate(obj.expiresAt);
    if (fromTl) return fromTl;
  }

  const base = parseMaybeDate(booking.updated_at) || parseMaybeDate(booking.created_at);
  if (!base) return null;
  return new Date(base.getTime() + DEFAULT_HOLD_MINUTES * 60 * 1000);
}

export function minutesUntilHoldExpiry(booking: Parameters<typeof getHoldExpiresAt>[0], now = Date.now()) {
  const expires = getHoldExpiresAt(booking);
  if (!expires) return null;
  return Math.round((expires.getTime() - now) / 60000);
}

export function isHoldExpiringSoon(
  booking: Parameters<typeof getHoldExpiresAt>[0],
  withinMinutes = HOLD_WARN_WITHIN_MINUTES,
  now = Date.now()
) {
  const mins = minutesUntilHoldExpiry(booking, now);
  if (mins === null) return false;
  return mins <= withinMinutes;
}

export function isHoldExpired(booking: Parameters<typeof getHoldExpiresAt>[0], now = Date.now()) {
  const mins = minutesUntilHoldExpiry(booking, now);
  if (mins === null) return false;
  return mins <= 0;
}

export function formatHoldCountdown(booking: Booking): string | null {
  const mins = minutesUntilHoldExpiry(booking);
  if (mins === null) return null;
  if (mins <= 0) return "Hold may be expired";
  if (mins < 60) return `Hold expires in ~${mins} min`;
  const hours = Math.floor(mins / 60);
  const rem = mins % 60;
  return `Hold expires in ~${hours}h ${rem}m`;
}

export function extractHoldExpiresAtIso(raw: unknown, fallbackFrom = new Date()): string {
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    const fromTl =
      parseMaybeDate(obj.expired_at) ||
      parseMaybeDate(obj.expiredAt) ||
      parseMaybeDate(obj.expires_at) ||
      parseMaybeDate(obj.expiresAt);
    if (fromTl) return fromTl.toISOString();
  }
  return new Date(fallbackFrom.getTime() + DEFAULT_HOLD_MINUTES * 60 * 1000).toISOString();
}
