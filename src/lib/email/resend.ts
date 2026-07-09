import { Resend } from "resend";

let resendClient: Resend | null = null;

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.BOOKING_FROM_EMAIL);
}

export function getBookingFromEmail(): string {
  return process.env.BOOKING_FROM_EMAIL || "bookings@alqiblaairservices.com";
}

export function getBookingAdminEmail(): string {
  return (
    process.env.BOOKING_ADMIN_EMAIL ||
    process.env.ADMIN_EMAIL ||
    "info@alqiblaairservices.com"
  );
}

export function getResendClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resendClient) resendClient = new Resend(process.env.RESEND_API_KEY);
  return resendClient;
}

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ ok: boolean; error?: string }> {
  const client = getResendClient();
  if (!client) return { ok: false, error: "Email not configured" };

  const { error } = await client.emails.send({
    from: getBookingFromEmail(),
    to: params.to,
    subject: params.subject,
    html: params.html,
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
