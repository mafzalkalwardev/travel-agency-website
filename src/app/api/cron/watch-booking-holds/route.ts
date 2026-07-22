import { NextResponse } from "next/server";
import {
  HOLD_WARN_WITHIN_MINUTES,
  isHoldExpiringSoon,
  minutesUntilHoldExpiry,
} from "@/lib/booking/hold-expiry";
import { syncSupplierBookingStatus } from "@/lib/booking/supplier-confirm";
import { bookingRowToEmailData } from "@/lib/email/send-booking-notifications";
import { holdExpiryWarningAdminHtml } from "@/lib/email/templates";
import { getBookingAdminEmail, isEmailConfigured, sendEmail } from "@/lib/email/resend";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

function authorize(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret && process.env.NODE_ENV === "production") return false;
  if (!cronSecret) return true;
  return request.headers.get("authorization") === `Bearer ${cronSecret}`;
}

async function alreadyReminded(bookingId: string, template: string, withinMinutes: number) {
  const supabase = createAdminClient();
  const since = new Date(Date.now() - withinMinutes * 60 * 1000).toISOString();
  const { data } = await supabase
    .from("notification_log")
    .select("id")
    .eq("booking_id", bookingId)
    .eq("template", template)
    .eq("status", "sent")
    .gte("created_at", since)
    .limit(1);
  return Boolean(data?.length);
}

async function logReminder(bookingId: string, template: string, ok: boolean, error?: string) {
  const supabase = createAdminClient();
  await supabase.from("notification_log").insert({
    booking_id: bookingId,
    channel: "email_admin",
    recipient: getBookingAdminEmail(),
    template,
    status: ok ? "sent" : "failed",
    error_message: error ?? null,
  });
}

export async function GET(request: Request) {
  if (!authorize(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ note: "Supabase not configured", warned: 0, synced: 0 });
  }

  const supabase = createAdminClient();
  let warned = 0;
  let synced = 0;
  let expiredCount = 0;

  const { data: activeHolds } = await supabase
    .from("bookings")
    .select("*")
    .eq("status", "pending_payment")
    .eq("supplier_hold_status", "held")
    .order("created_at", { ascending: true })
    .limit(40);

  const expiring = (activeHolds || []).filter((b) => isHoldExpiringSoon(b));
  expiredCount = expiring.filter((b) => (minutesUntilHoldExpiry(b) ?? 0) <= 0).length;

  // Refresh Travel Line status for at-risk holds (detect CANCELLED after expiry).
  for (const booking of expiring.slice(0, 10)) {
    if (!booking.travelline_booking_ref && !booking.travelline_order_id) continue;
    const result = await syncSupplierBookingStatus(booking.id);
    if (result.ok) synced += 1;
  }

  if (expiring.length && isEmailConfigured()) {
    const toWarn = [];
    for (const booking of expiring) {
      const mins = minutesUntilHoldExpiry(booking) ?? 0;
      const template = mins <= 0 ? "hold_expired_admin" : "hold_expiry_warning_admin";
      // Don't spam: once per 25 min for warning, once per 60 min for expired.
      const coolDown = mins <= 0 ? 60 : 25;
      if (await alreadyReminded(booking.id, template, coolDown)) continue;
      toWarn.push({
        ...bookingRowToEmailData(booking),
        minutesLeft: mins,
        orderRef: booking.travelline_order_id || booking.travelline_booking_ref || undefined,
        _template: template,
        _id: booking.id,
      });
    }

    if (toWarn.length) {
      const result = await sendEmail({
        to: getBookingAdminEmail(),
        subject:
          expiredCount > 0
            ? `${expiredCount} Travel Line hold(s) expired / at risk — action needed`
            : `${toWarn.length} Travel Line hold(s) expire within ${HOLD_WARN_WITHIN_MINUTES} min`,
        html: holdExpiryWarningAdminHtml(toWarn),
      });

      for (const item of toWarn) {
        await logReminder(item._id, item._template, result.ok, result.error);
        if (result.ok) warned += 1;
      }
    }
  }

  return NextResponse.json({
    activeHolds: activeHolds?.length || 0,
    expiringSoon: expiring.length,
    expiredOrPast: expiredCount,
    warned,
    synced,
    at: new Date().toISOString(),
  });
}
