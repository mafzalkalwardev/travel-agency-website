import { NextResponse } from "next/server";
import {
  bookingRowToEmailData,
  sendBookingReceivedNotifications,
  sendPaymentConfirmedNotifications,
} from "@/lib/email/send-booking-notifications";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { requireAdmin } from "@/lib/supabase/require-admin";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  const { id } = await params;
  const supabase = createAdminClient();
  const { data: booking, error } = await supabase.from("bookings").select("*").eq("id", id).single();
  if (error || !booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  const emailData = bookingRowToEmailData(booking);
  const isPaid =
    booking.status === "payment_confirmed" || booking.status === "confirmed";

  if (isPaid) {
    await sendPaymentConfirmedNotifications(emailData);
  } else {
    await sendBookingReceivedNotifications(emailData);
  }

  return NextResponse.json({
    success: true,
    template: isPaid ? "payment_confirmed" : "booking_received",
  });
}
