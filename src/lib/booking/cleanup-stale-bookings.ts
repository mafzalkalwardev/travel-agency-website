import { createAdminClient } from "@/lib/supabase/admin";
import { isHoldExpired } from "@/lib/booking/hold-expiry";
import {
  extractFlightDateFromTitle,
  humanizeSupplierHoldError,
} from "@/lib/booking/hold-messages";

export { extractFlightDateFromTitle, humanizeSupplierHoldError } from "@/lib/booking/hold-messages";

/** Auto-cancel failed holds after this many days with no successful seat hold. */
export const STALE_FAILED_HOLD_DAYS = 3;
/** Auto-cancel pending payment with an expired/never-held seat after this many days. */
export const STALE_PENDING_DAYS = 5;

export interface StaleBookingCleanupResult {
  cancelledStalePending: number;
  clearedHoldFlagsOnClosed: number;
  ids: string[];
  notes: string[];
}

function pakistanToday(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi" }).format(new Date());
}

/**
 * Cancel abandoned pending bookings and tidy hold badges on closed rows.
 * Failed holds are NOT confirmed tickets — they are failed attempts that should not linger.
 */
export async function cleanupStaleBookings(
  now = new Date()
): Promise<StaleBookingCleanupResult> {
  const supabase = createAdminClient();
  const notes: string[] = [];
  const ids: string[] = [];
  let cancelledStalePending = 0;
  let clearedHoldFlagsOnClosed = 0;

  const today = pakistanToday();
  const failedCutoff = new Date(now.getTime() - STALE_FAILED_HOLD_DAYS * 86400000).toISOString();
  const pendingCutoff = new Date(now.getTime() - STALE_PENDING_DAYS * 86400000).toISOString();

  const { data: openRows, error } = await supabase
    .from("bookings")
    .select(
      "id,status,supplier_hold_status,supplier_hold_error,error_message,admin_notes,product_title,created_at,updated_at,hold_expires_at,travelline_booking_ref,travelline_response"
    )
    .eq("status", "pending_payment")
    .order("created_at", { ascending: true })
    .limit(200);

  if (error) {
    notes.push(`open bookings query failed: ${error.message}`);
    return { cancelledStalePending: 0, clearedHoldFlagsOnClosed: 0, ids, notes };
  }

  for (const row of openRows || []) {
    const flightDate = extractFlightDateFromTitle(row.product_title);
    const flightDeparted = Boolean(flightDate && flightDate < today);
    const holdFailed = row.supplier_hold_status === "failed";
    const holdHeld = row.supplier_hold_status === "held";
    const holdExpired = holdHeld && isHoldExpired(row, now.getTime());
    const olderThanFailedWindow = row.created_at <= failedCutoff;
    const olderThanPendingWindow = row.created_at <= pendingCutoff;
    const neverHeldOnSupplier = !row.travelline_booking_ref;

    let reason: string | null = null;

    if (flightDeparted) {
      reason = `Auto-cancelled: flight date ${flightDate} has passed (never a confirmed ticket).`;
    } else if (holdFailed && olderThanFailedWindow && neverHeldOnSupplier) {
      reason = `Auto-cancelled: failed supplier hold older than ${STALE_FAILED_HOLD_DAYS} days with no supplier booking ref.`;
    } else if (holdExpired && neverHeldOnSupplier === false && olderThanPendingWindow) {
      // Had a hold once; payment never completed and hold window is over.
      reason = `Auto-cancelled: supplier hold expired and payment was never confirmed (${STALE_PENDING_DAYS}+ days).`;
    } else if (!holdHeld && olderThanPendingWindow && neverHeldOnSupplier) {
      reason = `Auto-cancelled: pending payment with no successful hold for ${STALE_PENDING_DAYS}+ days.`;
    }

    if (!reason) continue;

    const friendly = humanizeSupplierHoldError(row.supplier_hold_error || row.error_message);
    const { error: updateError } = await supabase
      .from("bookings")
      .update({
        status: "cancelled",
        supplier_hold_status: holdFailed || !row.travelline_booking_ref ? null : row.supplier_hold_status,
        admin_notes: [row.admin_notes, reason].filter(Boolean).join("\n").slice(0, 2000),
        error_message: friendly || row.error_message,
        supplier_hold_error: friendly || row.supplier_hold_error,
        updated_at: now.toISOString(),
      })
      .eq("id", row.id)
      .eq("status", "pending_payment");

    if (updateError) {
      notes.push(`${row.id}: ${updateError.message}`);
      continue;
    }

    cancelledStalePending += 1;
    ids.push(row.id);
    notes.push(`${row.id.slice(0, 8)}… → cancelled (${reason})`);
  }

  // Closed bookings still showing "hold: held/failed" pollute admin lists.
  const { data: closedWithHold } = await supabase
    .from("bookings")
    .select("id,status,supplier_hold_status,travelline_booking_ref")
    .in("status", ["cancelled", "failed"])
    .in("supplier_hold_status", ["held", "failed", "pending"])
    .limit(200);

  for (const row of closedWithHold || []) {
    const { error: clearError } = await supabase
      .from("bookings")
      .update({
        supplier_hold_status: null,
        updated_at: now.toISOString(),
      })
      .eq("id", row.id);

    if (!clearError) {
      clearedHoldFlagsOnClosed += 1;
      ids.push(row.id);
    }
  }

  return { cancelledStalePending, clearedHoldFlagsOnClosed, ids: [...new Set(ids)], notes };
}
