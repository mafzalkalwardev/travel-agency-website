import { NextResponse } from "next/server";
import { attemptSupplierHold } from "@/lib/booking/supplier-hold";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { requireAdmin } from "@/lib/supabase/require-admin";
import { isTravelLineConfigured } from "@/lib/travelline/env";

export const maxDuration = 120;

/**
 * Retry supplier seat hold for a booking where the initial hold failed or was skipped.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  const supabase = createAdminClient();
  const { data: booking, error } = await supabase.from("bookings").select("*").eq("id", id).single();

  if (error || !booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  if (booking.status === "cancelled") {
    return NextResponse.json({ error: "Cannot hold a cancelled booking" }, { status: 400 });
  }

  if (booking.travelline_booking_ref && booking.supplier_hold_status === "held") {
    return NextResponse.json({
      success: true,
      bookingRef: booking.travelline_booking_ref,
      message: "Supplier hold already active",
    });
  }

  if (!isTravelLineConfigured()) {
    return NextResponse.json({ error: "Supplier credentials not configured" }, { status: 400 });
  }

  let externalProductId = booking.external_product_id;
  if (!externalProductId && booking.ticket_id) {
    const { data: ticket } = await supabase
      .from("tickets")
      .select("external_id")
      .eq("id", booking.ticket_id)
      .maybeSingle();
    externalProductId = ticket?.external_id ?? null;
  }
  if (!externalProductId && booking.umrah_package_id) {
    const { data: pkg } = await supabase
      .from("umrah_packages")
      .select("external_id")
      .eq("id", booking.umrah_package_id)
      .maybeSingle();
    externalProductId = pkg?.external_id ?? null;
  }

  if (!externalProductId) {
    return NextResponse.json({ error: "No supplier product ID on this booking" }, { status: 400 });
  }

  const hold = await attemptSupplierHold(booking.id, {
    externalProductId,
    productType: booking.product_type,
    passengers: booking.passengers,
    passengerDetails: booking.passenger_details as Record<string, unknown>,
    quotedPrice: Number(booking.quoted_price),
    currency: booking.currency,
  });

  if (hold.held) {
    return NextResponse.json({ success: true, bookingRef: hold.bookingRef });
  }

  return NextResponse.json({ error: hold.error || "Supplier hold failed" }, { status: 502 });
}
