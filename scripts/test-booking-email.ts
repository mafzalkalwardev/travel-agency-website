/**
 * Send a test booking notification email via Resend.
 * Run: npm run test-email
 */
import { loadEnv } from "./load-env";
import { isEmailConfigured, getBookingAdminEmail, getBookingFromEmail, sendEmail } from "@/lib/email/resend";
import { SITE } from "@/lib/constants";

loadEnv();

async function main() {
  if (!isEmailConfigured()) {
    console.error("Email not configured. Set RESEND_API_KEY and BOOKING_FROM_EMAIL in .env");
    process.exit(1);
  }

  const to = getBookingAdminEmail();
  console.log(`Sending test email from ${getBookingFromEmail()} to ${to}...`);

  const result = await sendEmail({
    to,
    subject: `${SITE.shortName} — booking email test`,
    html: `<p>Test email from ${SITE.name}. Booking notifications are working.</p>`,
  });

  if (!result.ok) {
    console.error("Failed:", result.error);
    process.exit(1);
  }

  console.log("Test email sent successfully.");
}

main();
