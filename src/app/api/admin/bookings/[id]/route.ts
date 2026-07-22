import { NextResponse } from "next/server";
import {
  bookingRowToEmailData,
  sendPaymentConfirmedNotifications,
} from "@/lib/email/send-booking-notifications";
import {
  cancelSupplierBooking,
  confirmSupplierBooking,
} from "@/lib/booking/supplier-confirm";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { requireAdmin } from "@/lib/supabase/require-admin";

export const maxDuration = 120;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const status = body.status as string;
  const adminNotes = body.admin_notes as string | undefined;
  /** When true, mark our side paid even if Travel Line confirm fails (manual override). */
  const forceLocal = Boolean(body.force_local);

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  const allowed = ["payment_confirmed", "confirmed", "cancelled", "pending_payment"];
  if (!allowed.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: existing } = await supabase.from("bookings").select("*").eq("id", id).single();
  if (!existing) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  let finalStatus = status;
  let travellineStatus = existing.travelline_status as string | null;
  let supplierError: string | undefined;

  if (status === "payment_confirmed" || status === "confirmed") {
    // Real ticket lives on Travel Line — confirm there before we call it confirmed.
    const supplier = await confirmSupplierBooking(id);
    travellineStatus = supplier.status;

    if (supplier.ok && supplier.status === "CONFIRMED") {
      finalStatus = "confirmed";
    } else if (forceLocal) {
      finalStatus = "payment_confirmed";
      supplierError = supplier.error || "Travel Line not confirmed — local override";
    } else {
      // Payment received on our side, but Travel Line still not confirmed.
      finalStatus = "booking_in_progress";
      supplierError = supplier.error || "Travel Line confirmation failed";

      await supabase
        .from("bookings")
        .update({
          status: finalStatus,
          admin_notes: adminNotes ?? existing.admin_notes,
          error_message: supplierError,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      return NextResponse.json(
        {
          success: false,
          status: finalStatus,
          travellineStatus,
          error: supplierError,
          hint: "Confirm or settle the order in Travel Line, then retry — or pass force_local to mark paid here only.",
        },
        { status: 502 }
      );
    }
  }

  if (status === "cancelled") {
    const cancel = await cancelSupplierBooking(id);
    travellineStatus = cancel.status;
    if (!cancel.ok && !cancel.skipped) {
      supplierError = cancel.error;
    }
  }

  const { error } = await supabase
    .from("bookings")
    .update({
      status: finalStatus,
      admin_notes: adminNotes ?? undefined,
      error_message: supplierError ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (finalStatus === "confirmed" || finalStatus === "payment_confirmed") {
    const { data: updated } = await supabase.from("bookings").select("*").eq("id", id).single();
    if (updated) {
      sendPaymentConfirmedNotifications(bookingRowToEmailData(updated)).catch(() => {
        /* non-blocking */
      });
    }
  }

  return NextResponse.json({
    success: true,
    status: finalStatus,
    travellineStatus,
    supplierError: supplierError || null,
  });
}
