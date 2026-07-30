import { createAdminClient } from "@/lib/supabase/admin";
import { getTravelLineClient } from "@/lib/travelline/client";
import { isTravelLineConfigured } from "@/lib/travelline/env";

export type TravelLineStatus = "RESERVED" | "CONFIRMED" | "CANCELLED";

function normalizeTlStatus(raw: unknown): TravelLineStatus | null {
  const s = String(raw || "").toUpperCase();
  if (s === "CONFIRMED" || s.includes("CONFIRM")) return "CONFIRMED";
  if (s === "CANCELLED" || s === "CANCELED" || s.includes("CANCEL")) return "CANCELLED";
  if (s === "RESERVED" || s.includes("RESERV") || s === "HOLD" || s === "HELD") return "RESERVED";
  return null;
}

function orderRefFromRow(row: {
  travelline_booking_ref?: string | null;
  travelline_order_id?: string | null;
}): string | null {
  return row.travelline_order_id || row.travelline_booking_ref || null;
}

async function persistSupplierSnapshot(
  bookingId: string,
  snapshot: {
    status: TravelLineStatus | null;
    orderId?: string | null;
    confirmedAt?: string | null;
    raw?: unknown;
  }
) {
  const supabase = createAdminClient();
  const patch: Record<string, unknown> = {
    travelline_status: snapshot.status,
    travelline_status_checked_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  if (snapshot.orderId) {
    patch.travelline_order_id = snapshot.orderId;
    patch.travelline_booking_ref = snapshot.orderId;
  }
  if (snapshot.status === "CONFIRMED") {
    patch.travelline_confirmed_at = snapshot.confirmedAt || new Date().toISOString();
    patch.supplier_hold_status = "held";
    patch.supplier_hold_error = null;
  }
  if (snapshot.status === "CANCELLED") {
    patch.supplier_hold_status = "failed";
  }
  if (snapshot.status === "RESERVED") {
    patch.supplier_hold_status = "held";
  }
  if (snapshot.raw !== undefined) {
    patch.travelline_response = snapshot.raw;
  }

  await supabase.from("bookings").update(patch).eq("id", bookingId);
}

export async function syncSupplierBookingStatus(bookingId: string): Promise<{
  ok: boolean;
  status: TravelLineStatus | null;
  error?: string;
}> {
  if (!isTravelLineConfigured()) {
    return { ok: false, status: null, error: "supplier not configured" };
  }

  const supabase = createAdminClient();
  const { data: booking } = await supabase.from("bookings").select("*").eq("id", bookingId).single();
  if (!booking) return { ok: false, status: null, error: "Booking not found" };

  const ref = orderRefFromRow(booking);
  if (!ref) return { ok: false, status: null, error: "No supplier reference on booking" };

  const found = await getTravelLineClient().findBooking(ref);
  if (!found) {
    await persistSupplierSnapshot(bookingId, { status: null });
    return { ok: false, status: null, error: `supplier booking not found for ${ref}` };
  }

  const status = normalizeTlStatus(found.status);
  const confirmedAt =
    found.confirmed_at || found.confirmedAt
      ? String(found.confirmed_at || found.confirmedAt)
      : status === "CONFIRMED"
        ? new Date().toISOString()
        : null;

  await persistSupplierSnapshot(bookingId, {
    status,
    orderId: String(found.orderId || ref),
    confirmedAt,
    raw: found,
  });

  return { ok: Boolean(status), status };
}

/**
 * Confirm the real ticket on supplier (RESERVED → CONFIRMED).
 * Call this when Al Qibla has received customer payment.
 */
export async function confirmSupplierBooking(bookingId: string): Promise<{
  ok: boolean;
  status: TravelLineStatus | null;
  error?: string;
}> {
  if (!isTravelLineConfigured()) {
    return { ok: false, status: null, error: "supplier not configured" };
  }

  const supabase = createAdminClient();
  const { data: booking } = await supabase.from("bookings").select("*").eq("id", bookingId).single();
  if (!booking) return { ok: false, status: null, error: "Booking not found" };

  const ref = orderRefFromRow(booking);
  if (!ref) {
    return {
      ok: false,
      status: null,
      error: "No supplier hold reference — retry supplier hold first",
    };
  }

  // Already confirmed upstream
  const synced = await syncSupplierBookingStatus(bookingId);
  if (synced.status === "CONFIRMED") {
    return { ok: true, status: "CONFIRMED" };
  }
  if (synced.status === "CANCELLED") {
    return { ok: false, status: "CANCELLED", error: "supplier booking is cancelled" };
  }

  const result = await getTravelLineClient().updateBookingStatus(ref, "CONFIRMED");
  if (!result.ok) {
    await persistSupplierSnapshot(bookingId, {
      status: normalizeTlStatus(result.booking?.status) || synced.status,
      orderId: ref,
      raw: result.raw ?? result.booking,
    });
    return { ok: false, status: synced.status, error: result.error || "supplier confirm failed" };
  }

  const status = normalizeTlStatus(result.booking?.status) || "CONFIRMED";
  await persistSupplierSnapshot(bookingId, {
    status,
    orderId: String(result.booking?.orderId || ref),
    confirmedAt:
      status === "CONFIRMED"
        ? String(result.booking?.confirmed_at || result.booking?.confirmedAt || new Date().toISOString())
        : null,
    raw: result.raw ?? result.booking,
  });

  return {
    ok: status === "CONFIRMED",
    status,
    error: status === "CONFIRMED" ? undefined : `supplier status is ${status}`,
  };
}

export async function cancelSupplierBooking(bookingId: string): Promise<{
  ok: boolean;
  status: TravelLineStatus | null;
  error?: string;
  skipped?: boolean;
}> {
  if (!isTravelLineConfigured()) {
    return { ok: true, status: null, skipped: true };
  }

  const supabase = createAdminClient();
  const { data: booking } = await supabase.from("bookings").select("*").eq("id", bookingId).single();
  if (!booking) return { ok: false, status: null, error: "Booking not found" };

  const ref = orderRefFromRow(booking);
  if (!ref) return { ok: true, status: null, skipped: true };

  const synced = await syncSupplierBookingStatus(bookingId);
  if (synced.status === "CANCELLED") return { ok: true, status: "CANCELLED" };
  if (synced.status === "CONFIRMED") {
    return {
      ok: false,
      status: "CONFIRMED",
      error: "supplier ticket is already confirmed — cancel there manually if needed",
    };
  }

  const result = await getTravelLineClient().updateBookingStatus(ref, "CANCELLED");
  const status = normalizeTlStatus(result.booking?.status) || (result.ok ? "CANCELLED" : synced.status);
  await persistSupplierSnapshot(bookingId, {
    status,
    orderId: ref,
    raw: result.raw ?? result.booking,
  });

  return {
    ok: result.ok || status === "CANCELLED",
    status,
    error: result.ok ? undefined : result.error,
  };
}
