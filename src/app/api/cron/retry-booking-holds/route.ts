import { NextResponse } from "next/server";
import {
  STALE_FAILED_HOLD_DAYS,
  cleanupStaleBookings,
  extractFlightDateFromTitle,
} from "@/lib/booking/cleanup-stale-bookings";
import { attemptSupplierHold } from "@/lib/booking/supplier-hold";
import {
  bookingRowToEmailData,
  sendBookingReceivedNotifications,
} from "@/lib/email/send-booking-notifications";
import { stuckBookingReminderAdminHtml } from "@/lib/email/templates";
import { getBookingAdminEmail, isEmailConfigured, sendEmail } from "@/lib/email/resend";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { isTravelLineConfigured } from "@/lib/travelline/env";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const MAX_HOLD_ATTEMPTS = 3;
const STUCK_HOURS = 24;

function authorize(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret && process.env.NODE_ENV === "production") return false;
  if (!cronSecret) return true;
  return request.headers.get("authorization") === `Bearer ${cronSecret}`;
}

export async function GET(request: Request) {
  if (!authorize(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ note: "Supabase not configured", retried: 0, reminded: 0 });
  }

  const cleanup = await cleanupStaleBookings();

  const supabase = createAdminClient();
  let retried = 0;
  let reminded = 0;
  let skippedStale = 0;

  const pakistanToday = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Karachi",
  }).format(new Date());
  const retryAfter = new Date(
    Date.now() - STALE_FAILED_HOLD_DAYS * 86400000
  ).toISOString();

  if (isTravelLineConfigured()) {
    const { data: failedHolds } = await supabase
      .from("bookings")
      .select("*")
      .eq("status", "pending_payment")
      .eq("supplier_hold_status", "failed")
      .lt("supplier_hold_attempts", MAX_HOLD_ATTEMPTS)
      .gt("created_at", retryAfter)
      .order("created_at", { ascending: true })
      .limit(10);

    for (const booking of failedHolds || []) {
      if (!booking.external_product_id) continue;
      const flightDate = extractFlightDateFromTitle(booking.product_title);
      if (flightDate && flightDate < pakistanToday) {
        skippedStale += 1;
        continue;
      }

      const hold = await attemptSupplierHold(booking.id, {
        externalProductId: booking.external_product_id,
        productType: booking.product_type,
        passengers: booking.passengers,
        passengerDetails: booking.passenger_details as Record<string, unknown>,
        quotedPrice: Number(booking.quoted_price),
        currency: booking.currency,
      });

      if (hold.held) {
        retried += 1;
        const emailData = bookingRowToEmailData(booking);
        emailData.supplierRef = hold.bookingRef;
        emailData.supplierHoldFailed = false;
        sendBookingReceivedNotifications(emailData).catch(() => {});
      }
    }
  }

  const stuckBefore = new Date(Date.now() - STUCK_HOURS * 60 * 60 * 1000).toISOString();
  const { data: stuckBookings } = await supabase
    .from("bookings")
    .select("*")
    .eq("status", "pending_payment")
    .eq("supplier_hold_status", "held")
    .lt("created_at", stuckBefore)
    .limit(20);

  if (stuckBookings?.length && isEmailConfigured()) {
    const adminEmail = getBookingAdminEmail();
    const result = await sendEmail({
      to: adminEmail,
      subject: `${stuckBookings.length} booking(s) awaiting WhatsApp payment`,
      html: stuckBookingReminderAdminHtml(stuckBookings.map(bookingRowToEmailData)),
    });
    if (result.ok) reminded = stuckBookings.length;
  }

  return NextResponse.json({
    cleanup: {
      cancelledStalePending: cleanup.cancelledStalePending,
      clearedHoldFlagsOnClosed: cleanup.clearedHoldFlagsOnClosed,
    },
    retried,
    skippedStale,
    reminded,
    at: new Date().toISOString(),
  });
}
