import { NextResponse } from "next/server";
import { sendEmail, isEmailConfigured, getBookingAdminEmail } from "@/lib/email/resend";
import { requireAdmin } from "@/lib/supabase/require-admin";
import { SITE } from "@/lib/constants";

export async function POST() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isEmailConfigured()) {
    return NextResponse.json(
      { error: "Email not configured. Set RESEND_API_KEY and BOOKING_FROM_EMAIL." },
      { status: 400 }
    );
  }

  const to = getBookingAdminEmail();
  const result = await sendEmail({
    to,
    subject: `${SITE.shortName} — booking email test`,
    html: `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;padding:24px">
      <h2 style="color:#071b3a">Email test successful</h2>
      <p>Booking notifications from <strong>${SITE.name}</strong> are configured correctly.</p>
      <p>This message was sent from the admin Integrations page.</p>
    </body></html>`,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error || "Send failed" }, { status: 500 });
  }

  return NextResponse.json({ success: true, sentTo: to });
}
