import { SITE } from "@/lib/constants";

export interface BookingEmailData {
  id: string;
  customerName: string;
  customerEmail?: string;
  customerPhone: string;
  productTitle: string;
  passengers: number;
  quotedPrice: number;
  currency: string;
  supplierRef?: string;
  supplierHoldFailed?: boolean;
}

function formatPrice(price: number, currency: string) {
  return `${price.toLocaleString()} ${currency}`;
}

function layout(title: string, body: string) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${title}</title></head>
<body style="font-family:Arial,sans-serif;line-height:1.6;color:#1a2744;max-width:600px;margin:0 auto;padding:24px">
  <div style="border-bottom:3px solid #c9a227;padding-bottom:12px;margin-bottom:24px">
    <strong style="font-size:18px">${SITE.name}</strong>
    <div style="color:#666;font-size:13px">${SITE.tagline}</div>
  </div>
  ${body}
  <p style="margin-top:32px;font-size:12px;color:#888">${SITE.name} · ${SITE.whatsappNumber}</p>
</body>
</html>`;
}

export function bookingReceivedCustomerHtml(data: BookingEmailData) {
  const ref = data.id.slice(0, 8).toUpperCase();
  const holdNote = data.supplierHoldFailed
    ? "<p>Our team is securing your seats and will confirm shortly on WhatsApp.</p>"
    : data.supplierRef
      ? `<p><strong>Supplier reference:</strong> ${data.supplierRef}</p><p>Your seats are held. Complete payment on WhatsApp to confirm.</p>`
      : "<p>Our team will contact you on WhatsApp to complete payment.</p>";

  return layout(
    "Booking Request Received",
    `<h2 style="color:#1a2744">Booking request received</h2>
    <p>Hello ${data.customerName},</p>
    <p>Thank you for booking with ${SITE.name}. Your reference is <strong>${ref}</strong>.</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0">
      <tr><td style="padding:8px 0;border-bottom:1px solid #eee"><strong>Product</strong></td><td style="padding:8px 0;border-bottom:1px solid #eee">${data.productTitle}</td></tr>
      <tr><td style="padding:8px 0;border-bottom:1px solid #eee"><strong>Passengers</strong></td><td style="padding:8px 0;border-bottom:1px solid #eee">${data.passengers}</td></tr>
      <tr><td style="padding:8px 0"><strong>Total</strong></td><td style="padding:8px 0">${formatPrice(data.quotedPrice, data.currency)}</td></tr>
    </table>
    ${holdNote}
    <p><strong>Next step:</strong> Send your payment screenshot on WhatsApp at ${SITE.whatsappNumber}.</p>
    <p>Track your booking anytime from your account at <a href="${SITE.url}/account/">My Trips</a>.</p>`
  );
}

export function bookingReceivedAdminHtml(data: BookingEmailData) {
  const ref = data.id.slice(0, 8).toUpperCase();
  const adminUrl = `${SITE.url}/admin/bookings/`;

  return layout(
    "New Booking Alert",
    `<h2 style="color:#c0392b">New booking requires action</h2>
    <p><strong>Reference:</strong> ${ref}</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0">
      <tr><td style="padding:8px 0;border-bottom:1px solid #eee"><strong>Customer</strong></td><td style="padding:8px 0;border-bottom:1px solid #eee">${data.customerName}</td></tr>
      <tr><td style="padding:8px 0;border-bottom:1px solid #eee"><strong>Phone</strong></td><td style="padding:8px 0;border-bottom:1px solid #eee">${data.customerPhone}</td></tr>
      <tr><td style="padding:8px 0;border-bottom:1px solid #eee"><strong>Email</strong></td><td style="padding:8px 0;border-bottom:1px solid #eee">${data.customerEmail || "—"}</td></tr>
      <tr><td style="padding:8px 0;border-bottom:1px solid #eee"><strong>Product</strong></td><td style="padding:8px 0;border-bottom:1px solid #eee">${data.productTitle}</td></tr>
      <tr><td style="padding:8px 0;border-bottom:1px solid #eee"><strong>Passengers</strong></td><td style="padding:8px 0;border-bottom:1px solid #eee">${data.passengers}</td></tr>
      <tr><td style="padding:8px 0"><strong>Total</strong></td><td style="padding:8px 0">${formatPrice(data.quotedPrice, data.currency)}</td></tr>
    </table>
    ${data.supplierRef ? `<p><strong>Supplier hold ref:</strong> ${data.supplierRef}</p>` : ""}
    ${data.supplierHoldFailed ? `<p style="color:#c0392b"><strong>Supplier hold failed</strong> — retry from admin panel.</p>` : ""}
    <p><a href="${adminUrl}" style="display:inline-block;background:#1a2744;color:#fff;padding:10px 20px;text-decoration:none;border-radius:6px">Open Admin Bookings</a></p>`
  );
}

export function paymentConfirmedCustomerHtml(data: BookingEmailData) {
  const ref = data.id.slice(0, 8).toUpperCase();
  return layout(
    "Payment Confirmed",
    `<h2 style="color:#1a2744">Payment confirmed</h2>
    <p>Hello ${data.customerName},</p>
    <p>We have received your payment for booking <strong>${ref}</strong>.</p>
    <p><strong>${data.productTitle}</strong> — ${formatPrice(data.quotedPrice, data.currency)}</p>
    ${data.supplierRef ? `<p>Supplier reference: <strong>${data.supplierRef}</strong></p>` : ""}
    <p>Your booking is confirmed. We will share ticket details on WhatsApp shortly.</p>`
  );
}

export function paymentConfirmedAdminHtml(data: BookingEmailData) {
  const ref = data.id.slice(0, 8).toUpperCase();
  return layout(
    "Payment Confirmed",
    `<h2>Payment confirmed — booking ${ref}</h2>
    <p><strong>${data.customerName}</strong> (${data.customerPhone}) paid for ${data.productTitle}.</p>
    <p>Amount: ${formatPrice(data.quotedPrice, data.currency)}</p>
    ${data.supplierRef ? `<p>Supplier ref: ${data.supplierRef}</p>` : ""}`
  );
}

export function stuckBookingReminderAdminHtml(bookings: BookingEmailData[]) {
  const rows = bookings
    .map(
      (b) =>
        `<li>${b.id.slice(0, 8).toUpperCase()} — ${b.customerName} — ${b.productTitle} — ${formatPrice(b.quotedPrice, b.currency)}</li>`
    )
    .join("");
  return layout(
    "Pending Payment Reminder",
    `<h2>Bookings awaiting WhatsApp payment (24h+)</h2>
    <ul>${rows}</ul>
    <p><a href="${SITE.url}/admin/bookings/">Review in admin panel</a></p>`
  );
}

export function accountVerificationCustomerHtml(params: {
  fullName: string;
  confirmUrl: string;
}) {
  const name = params.fullName.trim() || "there";
  return layout(
    "Confirm your Al Qibla account",
    `<h2 style="color:#1a2744">Confirm your email</h2>
    <p>Hello ${name},</p>
    <p>Welcome to <strong>${SITE.name}</strong>. Please confirm your email to finish creating your customer / sub-agent account.</p>
    <p style="margin:28px 0">
      <a href="${params.confirmUrl}" style="display:inline-block;background:#071b3a;color:#ffffff;padding:12px 22px;text-decoration:none;border-radius:8px;font-weight:bold">
        Verify email address
      </a>
    </p>
    <p style="font-size:13px;color:#666">If the button does not work, copy and paste this link into your browser:<br>
      <a href="${params.confirmUrl}" style="color:#0b5da8;word-break:break-all">${params.confirmUrl}</a>
    </p>
    <p style="font-size:13px;color:#666">Questions? Reply to this email or WhatsApp us at ${SITE.whatsappNumber}.</p>
    <p style="font-size:12px;color:#888">This message was sent by ${SITE.name} · ${SITE.email}</p>`
  );
}

export function accountPasswordResetCustomerHtml(params: {
  fullName?: string;
  resetUrl: string;
}) {
  const name = params.fullName?.trim() || "there";
  return layout(
    "Reset your Al Qibla password",
    `<h2 style="color:#1a2744">Reset your password</h2>
    <p>Hello ${name},</p>
    <p>We received a request to reset the password for your <strong>${SITE.name}</strong> account.</p>
    <p style="margin:28px 0">
      <a href="${params.resetUrl}" style="display:inline-block;background:#071b3a;color:#ffffff;padding:12px 22px;text-decoration:none;border-radius:8px;font-weight:bold">
        Choose a new password
      </a>
    </p>
    <p style="font-size:13px;color:#666">If the button does not work, copy and paste this link into your browser:<br>
      <a href="${params.resetUrl}" style="color:#0b5da8;word-break:break-all">${params.resetUrl}</a>
    </p>
    <p style="font-size:13px;color:#666">If you did not request this, you can ignore this email. Your password will stay the same.</p>
    <p style="font-size:12px;color:#888">This message was sent by ${SITE.name} · ${SITE.email}</p>`
  );
}

export function customerApprovedHtml(params: { fullName?: string }) {
  const name = params.fullName?.trim() || "there";
  return layout(
    "Account approved",
    `<h2 style="color:#1a2744">You're approved to book</h2>
    <p>Hello ${name},</p>
    <p>Good news — your <strong>${SITE.name}</strong> account is approved. You can now request group tickets, Umrah packages, and tours online.</p>
    <p style="margin:28px 0">
      <a href="${SITE.url}/available-tickets/" style="display:inline-block;background:#071b3a;color:#ffffff;padding:12px 22px;text-decoration:none;border-radius:8px;font-weight:bold">
        Browse available tickets
      </a>
    </p>
    <p style="font-size:13px;color:#666">Need help? WhatsApp us at ${SITE.whatsappNumber}.</p>`
  );
}

export function customerRejectedHtml(params: { fullName?: string; notes?: string | null }) {
  const name = params.fullName?.trim() || "there";
  const notes = params.notes?.trim()
    ? `<p><strong>Note from our team:</strong> ${params.notes.trim()}</p>`
    : "";
  return layout(
    "Account update",
    `<h2 style="color:#1a2744">Account review update</h2>
    <p>Hello ${name},</p>
    <p>We reviewed your <strong>${SITE.name}</strong> account and are unable to approve booking access at this time.</p>
    ${notes}
    <p>Please contact us on WhatsApp at ${SITE.whatsappNumber} if you have questions or want to resubmit details.</p>`
  );
}

