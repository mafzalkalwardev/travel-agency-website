import { createAdminClient } from "@/lib/supabase/admin";
import {
  bookingReceivedAdminHtml,
  bookingReceivedCustomerHtml,
  paymentConfirmedAdminHtml,
  paymentConfirmedCustomerHtml,
  type BookingEmailData,
} from "@/lib/email/templates";
import { getBookingAdminEmail, isEmailConfigured, sendEmail } from "@/lib/email/resend";

async function logNotification(params: {
  bookingId: string;
  channel: "email_customer" | "email_admin";
  recipient: string;
  template: string;
  status: "sent" | "failed" | "skipped";
  errorMessage?: string;
}) {
  try {
    const supabase = createAdminClient();
    await supabase.from("notification_log").insert({
      booking_id: params.bookingId,
      channel: params.channel,
      recipient: params.recipient,
      template: params.template,
      status: params.status,
      error_message: params.errorMessage ?? null,
    });
  } catch {
    /* non-blocking */
  }
}

async function deliver(
  bookingId: string,
  channel: "email_customer" | "email_admin",
  recipient: string,
  template: string,
  subject: string,
  html: string
) {
  if (!recipient || !isEmailConfigured()) {
    await logNotification({
      bookingId,
      channel,
      recipient: recipient || "none",
      template,
      status: "skipped",
      errorMessage: "Email not configured or no recipient",
    });
    return;
  }

  const result = await sendEmail({ to: recipient, subject, html });
  await logNotification({
    bookingId,
    channel,
    recipient,
    template,
    status: result.ok ? "sent" : "failed",
    errorMessage: result.error,
  });
}

export async function sendBookingReceivedNotifications(data: BookingEmailData) {
  const ref = data.id.slice(0, 8).toUpperCase();

  await Promise.all([
    deliver(
      data.id,
      "email_customer",
      data.customerEmail || "",
      "booking_received_customer",
      `Booking request ${ref} — ${data.productTitle}`,
      bookingReceivedCustomerHtml(data)
    ),
    deliver(
      data.id,
      "email_admin",
      getBookingAdminEmail(),
      "booking_received_admin",
      `New booking ${ref} — ${data.customerName}`,
      bookingReceivedAdminHtml(data)
    ),
  ]);

  try {
    const supabase = createAdminClient();
    await supabase
      .from("bookings")
      .update({ notifications_sent_at: new Date().toISOString() })
      .eq("id", data.id);
  } catch {
    /* non-blocking */
  }
}

export async function sendPaymentConfirmedNotifications(data: BookingEmailData) {
  const ref = data.id.slice(0, 8).toUpperCase();

  await Promise.all([
    deliver(
      data.id,
      "email_customer",
      data.customerEmail || "",
      "payment_confirmed_customer",
      `Payment confirmed — booking ${ref}`,
      paymentConfirmedCustomerHtml(data)
    ),
    deliver(
      data.id,
      "email_admin",
      getBookingAdminEmail(),
      "payment_confirmed_admin",
      `Payment confirmed — ${data.customerName} (${ref})`,
      paymentConfirmedAdminHtml(data)
    ),
  ]);
}

export function bookingRowToEmailData(row: {
  id: string;
  customer_name: string;
  customer_email?: string | null;
  customer_phone: string;
  product_title?: string | null;
  product_type: string;
  passengers: number;
  quoted_price: number;
  currency: string;
  travelline_booking_ref?: string | null;
  supplier_hold_status?: string | null;
}): BookingEmailData {
  return {
    id: row.id,
    customerName: row.customer_name,
    customerEmail: row.customer_email || undefined,
    customerPhone: row.customer_phone,
    productTitle: row.product_title || row.product_type,
    passengers: row.passengers,
    quotedPrice: Number(row.quoted_price),
    currency: row.currency,
    supplierRef: row.travelline_booking_ref || undefined,
    supplierHoldFailed: row.supplier_hold_status === "failed",
  };
}
