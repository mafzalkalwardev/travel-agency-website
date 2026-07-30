import { humanizeSupplierHoldError } from "@/lib/booking/hold-messages";
import { createAdminClient } from "@/lib/supabase/admin";
import { extractHoldExpiresAtIso } from "@/lib/booking/hold-expiry";
import { getTravelLineClient } from "@/lib/travelline/client";
import { isTravelLineConfigured } from "@/lib/travelline/env";
import { resolveTravelLinePackageId } from "@/lib/travelline/resolve-package-id";
import type { TravelLineBookingInput } from "@/lib/travelline/types";
import { TravelLineTicketProvider } from "@/lib/tickets/providers/travelLineProvider";

export interface SupplierHoldResult {
  held: boolean;
  bookingRef?: string;
  error?: string;
  skipped?: boolean;
}

export async function attemptSupplierHold(
  bookingId: string,
  input: TravelLineBookingInput
): Promise<SupplierHoldResult> {
  const supabase = createAdminClient();

  if (!isTravelLineConfigured() || !input.externalProductId) {
    await supabase
      .from("bookings")
      .update({
        supplier_hold_status: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", bookingId);
    return { held: false, skipped: true };
  }

  const packageId = resolveTravelLinePackageId(input.externalProductId);

  await supabase
    .from("bookings")
    .update({
      supplier_hold_status: "pending",
      updated_at: new Date().toISOString(),
    })
    .eq("id", bookingId);

  const { data: row } = await supabase
    .from("bookings")
    .select("supplier_hold_attempts")
    .eq("id", bookingId)
    .single();

  const attempts = (row?.supplier_hold_attempts ?? 0) + 1;

  const supplier = await getTravelLineClient().createBooking({
    ...input,
    externalProductId: packageId,
  });

  if (supplier.success) {
    const successPatch = {
      status: "pending_payment",
      supplier_hold_status: "held",
      supplier_hold_error: null,
      supplier_hold_attempts: attempts,
      travelline_booking_ref: supplier.bookingRef,
      travelline_order_id: supplier.bookingRef,
      travelline_status: "RESERVED",
      travelline_status_checked_at: new Date().toISOString(),
      hold_expires_at: extractHoldExpiresAtIso(supplier.raw),
      travelline_response: supplier.raw ?? null,
      error_message: null,
      updated_at: new Date().toISOString(),
    };

    let { error: holdWriteError } = await supabase
      .from("bookings")
      .update(successPatch)
      .eq("id", bookingId);

    // Column may not exist until migration 008 is applied — retry without it.
    if (holdWriteError?.message?.includes("hold_expires_at")) {
      const { hold_expires_at: _omit, ...withoutExpiry } = successPatch;
      ({ error: holdWriteError } = await supabase
        .from("bookings")
        .update(withoutExpiry)
        .eq("id", bookingId));
    }
    if (holdWriteError) {
      return { held: false, error: holdWriteError.message, bookingRef: supplier.bookingRef };
    }

    try {
      const ticketProvider = new TravelLineTicketProvider();
      await ticketProvider.sync();
    } catch {
      /* non-blocking inventory refresh */
    }

    return { held: true, bookingRef: supplier.bookingRef };
  }

  const error =
    humanizeSupplierHoldError(supplier.error) || supplier.error || "Supplier hold failed";
  await supabase
    .from("bookings")
    .update({
      status: "pending_payment",
      supplier_hold_status: "failed",
      supplier_hold_error: error,
      supplier_hold_attempts: attempts,
      travelline_response: supplier.raw ?? null,
      error_message: error,
      updated_at: new Date().toISOString(),
    })
    .eq("id", bookingId);

  return { held: false, error };
}
